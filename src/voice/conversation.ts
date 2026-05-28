/**
 * OpenAI-native realtime conversation engine.
 *
 * Pipeline:
 *   Browser mic + WebRTC
 *   -> OpenAI Realtime API
 *   -> realtime speech-to-speech patient reasoning
 *
 * The backend only mints a short-lived OpenAI client secret. STT, reasoning,
 * TTS, turn detection, and interruptions are handled by the realtime model.
 */

const REALTIME_SDP_URL = 'https://api.openai.com/v1/realtime/calls';
const TOKEN_URL = '/voice/realtime-secret';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ConversationState =
  | 'loading'
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'interrupted'
  | 'recovering'
  | 'error'
  | 'disposed';

export type ConversationStatus = ConversationState | 'uninitialized' | 'ready' | 'thinking';

const VALID_TRANSITIONS: Record<ConversationState, Set<ConversationState>> = {
  loading: new Set(['idle', 'listening', 'speaking', 'error', 'disposed']),
  idle: new Set(['listening', 'processing', 'speaking', 'interrupted', 'disposed', 'loading']),
  listening: new Set(['processing', 'speaking', 'idle', 'interrupted', 'disposed']),
  processing: new Set(['speaking', 'listening', 'idle', 'recovering', 'error', 'disposed']),
  speaking: new Set(['listening', 'idle', 'interrupted', 'recovering', 'disposed']),
  interrupted: new Set(['listening', 'processing', 'idle', 'disposed']),
  recovering: new Set(['loading', 'idle', 'error', 'disposed']),
  error: new Set(['loading', 'disposed']),
  disposed: new Set([]),
};

const STATE_TIMEOUTS: Partial<Record<ConversationState, number>> = {
  loading: 15_000,
  processing: 12_000,
  recovering: 5_000,
};

export interface ConversationEvent {
  timestamp: number;
  correlationId: string;
  type:
    | 'state_transition'
    | 'transcription'
    | 'error'
    | 'reconnect'
    | 'timeout'
    | 'interruption'
    | 'latency'
    | 'drift'
    | 'lifecycle';
  from?: string;
  to?: string;
  detail?: string;
  latencyMs?: number;
}

export type PatientEmotion = 'neutral' | 'pain' | 'fear' | 'relief' | 'confused';

export interface SubtitleEvent {
  who: 'patient' | 'you';
  text: string;
  partial?: boolean;
}

export interface ConversationListeners {
  onStatus?: (status: ConversationStatus, detail?: string) => void;
  onProgress?: (msg: string) => void;
  onSubtitle?: (sub: SubtitleEvent) => void;
  onError?: (err: string) => void;
  onEmotion?: (e: PatientEmotion) => void;
}

export interface ConversationOptions {
  systemPrompt?: string;
  initialMessage?: { role: 'assistant'; content: string };
  voiceGender?: 'M' | 'F';
  caseId?: string;
  voice?: string;
  storageKey?: string;
  age?: number;
  severity?: 'stable' | 'urgent' | 'critical';
}

interface RealtimeSecretResponse {
  value: string;
  model: string;
  voice: string;
  expires_at?: number;
}

let _corrSeq = 0;
function nextCorrelationId(): string {
  _corrSeq += 1;
  return `rt-${Date.now()}-${_corrSeq}`;
}

function detectEmotion(text: string): PatientEmotion {
  const t = text.toLowerCase();
  if (/\b(hurts?|pain|ache|aching|ow|ouch|sore|burn|sharp|throb|stab|chest|breath)\b/.test(t)) return 'pain';
  if (/\b(scared|afraid|terrified|worried|nervous|anxious|help|dying|die|dar lag)\b/.test(t)) return 'fear';
  if (/\b(okay|fine|better|good now|thanks|thank you|relieved|easier)\b/.test(t)) return 'relief';
  if (/\b(don'?t know|not sure|confused|what does that mean|sorry what)\b/.test(t)) return 'confused';
  return 'neutral';
}

function detectLanguage(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  if (/\b(nahi|haan|kal|aaj|thoda|matlab|dar|lag|ho raha|hua|hai)\b/i.test(text)) return 'Hindi';
  return 'English';
}

function safeJsonParse(data: string): any | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function isOpenState(state: RTCDataChannelState | undefined): boolean {
  return state === 'open';
}

export class Conversation {
  private audioCtx: AudioContext;
  private messages: ChatMessage[] = [];
  private listeners: ConversationListeners = {};
  private state: ConversationState = 'disposed';
  private previousState: ConversationState = 'disposed';
  private stateTimer: ReturnType<typeof setTimeout> | null = null;
  private initLock: Promise<void> | null = null;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private reconnectAttempts = 0;
  private disposed = false;
  private micMuted = false;
  private currentCorrelationId = nextCorrelationId();
  private eventLog: ConversationEvent[] = [];
  private messageSubscribers = new Set<(msgs: ReadonlyArray<ChatMessage>) => void>();
  private stateSubscribers = new Set<(state: ConversationState) => void>();
  private currentEmotion: PatientEmotion = 'neutral';
  private lastDetectedLanguage = 'English';
  private responseStartedAt: number | null = null;
  private pendingAssistantText = '';

  private systemPrompt: string;
  private initialMessage: { role: 'assistant'; content: string };
  private voiceGender: 'M' | 'F';
  private caseId: string;
  private age: number;
  private severity: 'stable' | 'urgent' | 'critical';
  private preferredVoice: string | undefined;

  private static readonly MAX_EVENT_LOG = 160;

  constructor(
    _audioCtx: AudioContext,
    listeners: ConversationListeners = {},
    options: ConversationOptions = {},
  ) {
    this.audioCtx = _audioCtx;
    this.listeners = listeners;
    this.systemPrompt = options.systemPrompt ?? 'Stay in character as a patient. Reply briefly in natural spoken language.';
    this.initialMessage = options.initialMessage ?? { role: 'assistant', content: 'Hi doctor.' };
    this.voiceGender = options.voiceGender ?? 'F';
    this.caseId = options.caseId ?? 'unknown';
    this.age = options.age ?? 35;
    this.severity = options.severity ?? 'stable';
    this.preferredVoice = options.voice;

    if (typeof document !== 'undefined') {
      this.audioEl = document.createElement('audio');
      this.audioEl.autoplay = true;
      this.audioEl.setAttribute('playsinline', 'true');
      this.audioEl.style.display = 'none';
      document.body.appendChild(this.audioEl);
    }
  }

  async init(): Promise<void> {
    if (this.initLock) return this.initLock;
    if (this.state !== 'disposed' && this.state !== 'error') return;
    this.disposed = false;
    this.initLock = this.connect();
    try {
      await this.initLock;
    } finally {
      this.initLock = null;
    }
  }

  private async connect(): Promise<void> {
    this.transition('loading', 'minting realtime client secret');
    this.listeners.onProgress?.('Connecting to OpenAI Realtime...');
    this.logEvent({ type: 'lifecycle', detail: `session_start case=${this.caseId}` });

    try {
      const secret = await this.fetchRealtimeSecret();
      if (this.disposed) return;

      this.listeners.onProgress?.(`Opening ${secret.model} voice session...`);
      const pc = new RTCPeerConnection();
      this.pc = pc;

      if (!this.audioEl && typeof document !== 'undefined') {
        this.audioEl = document.createElement('audio');
        this.audioEl.autoplay = true;
        this.audioEl.setAttribute('playsinline', 'true');
        this.audioEl.style.display = 'none';
        document.body.appendChild(this.audioEl);
      }

      pc.ontrack = (event) => {
        if (this.audioEl) this.audioEl.srcObject = event.streams[0];
        
        try {
          const streamSource = this.audioCtx.createMediaStreamSource(event.streams[0]);
          streamSource.connect(this.audioCtx.destination);
          this.logEvent({ type: 'lifecycle', detail: 'remote_audio_track_attached_web_audio' });
        } catch (err) {
          console.warn('[Conversation] Failed to route WebRTC track to AudioContext:', err);
        }

        this.logEvent({ type: 'lifecycle', detail: 'remote_audio_track_attached' });
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        this.logEvent({ type: 'lifecycle', detail: `peer_connection=${s}` });
        if (s === 'failed' || s === 'disconnected') this.handleConnectionLoss(s);
      };

      let activeStream = this.localStream;
      if (activeStream) {
        // Verify tracks are not ended
        const allActive = activeStream.getAudioTracks().every(track => track.readyState === 'live');
        if (!allActive) {
          activeStream = null;
        }
      }

      if (!activeStream) {
        activeStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }
      this.localStream = activeStream;
      this.localStream.getAudioTracks().forEach((track) => pc.addTrack(track, this.localStream!));

      const dc = pc.createDataChannel('oai-events', { ordered: true });
      this.dc = dc;
      dc.onopen = () => {
        this.logEvent({ type: 'lifecycle', detail: `data_channel_open voice=${secret.voice}` });
        this.transition('listening', 'realtime session ready');
        this.sendOpeningLine();
      };
      dc.onclose = () => this.logEvent({ type: 'lifecycle', detail: 'data_channel_closed' });
      dc.onerror = () => this.handleError('Realtime data channel error');
      dc.onmessage = (event) => this.handleRealtimeEvent(event.data);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpResponse = await fetch(REALTIME_SDP_URL, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${secret.value}`,
          'Content-Type': 'application/sdp',
        },
      });
      if (!sdpResponse.ok) {
        throw new Error(`OpenAI Realtime SDP failed: ${sdpResponse.status} ${await sdpResponse.text().catch(() => '')}`);
      }
      await pc.setRemoteDescription({ type: 'answer', sdp: await sdpResponse.text() });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (this.reconnectAttempts === 0 || this.reconnectAttempts >= 3) {
        this.handleError(errMsg);
      } else {
        this.logEvent({ type: 'error', detail: `interim_connect_error: ${errMsg}` });
        this.listeners.onError?.(errMsg);
      }
      throw err;
    }
  }

  private async fetchRealtimeSecret(): Promise<RealtimeSecretResponse> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: this.caseId,
        systemPrompt: this.systemPrompt,
        initialLine: this.initialMessage.content,
        gender: this.voiceGender,
        age: this.age,
        severity: this.severity,
        voice: this.preferredVoice,
      }),
    });
    if (!res.ok) {
      throw new Error(`/voice/realtime-secret ${res.status}: ${await res.text().catch(() => '')}`);
    }
    return res.json();
  }

  private handleRealtimeEvent(raw: string) {
    const event = safeJsonParse(raw);
    if (!event || typeof event.type !== 'string') return;

    const type = event.type as string;
    if (type.endsWith('.delta') || type.endsWith('.done') || type.includes('transcription')) {
      this.logEvent({ type: 'transcription', detail: type });
    }

    switch (type) {
      case 'input_audio_buffer.speech_started':
        if (this.state === 'speaking' || this.state === 'processing') {
          this.cancelCurrentResponse('doctor interrupted');
          this.transition('interrupted', 'doctor barge-in');
          this.logEvent({ type: 'interruption', detail: 'speech_started while patient responding' });
        }
        this.transition('listening', 'doctor speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        this.transition('processing', 'doctor turn ended');
        this.responseStartedAt = performance.now();
        break;

      case 'conversation.item.input_audio_transcription.completed':
      case 'input_audio_transcription.completed':
        this.commitUserText(event.transcript ?? event.text ?? '');
        break;

      case 'response.created':
        this.responseStartedAt ??= performance.now();
        this.transition('processing', 'model response created');
        break;

      case 'response.audio.delta':
        if (this.responseStartedAt !== null) {
          this.logEvent({
            type: 'latency',
            detail: 'first_audio_delta',
            latencyMs: Math.round(performance.now() - this.responseStartedAt),
          });
          this.responseStartedAt = null;
        }
        this.transition('speaking', 'patient audio streaming');
        break;

      case 'response.audio_transcript.delta':
      case 'response.output_text.delta':
        this.appendAssistantText(event.delta ?? '');
        break;

      case 'response.audio_transcript.done':
      case 'response.output_text.done':
        this.commitAssistantText(event.transcript ?? event.text ?? this.pendingAssistantText);
        break;

      case 'response.done':
        this.commitAssistantText(this.pendingAssistantText);
        this.transition('listening', 'patient turn complete');
        break;

      case 'response.cancelled':
        this.commitAssistantText(this.pendingAssistantText);
        this.transition('listening', 'response cancelled');
        break;

      case 'error': {
        const msg = event.error?.message ?? event.message ?? 'Realtime API error';
        if (msg.includes('Cancellation failed: no active response found') || msg.includes('no active response found')) {
          this.logEvent({ type: 'error', detail: `Ignored benign OpenAI cancellation warning: ${msg}` });
          break;
        }
        this.handleError(msg);
        break;
      }
    }
  }

  private sendOpeningLine() {
    const firstLine = this.initialMessage.content.trim();
    if (!firstLine) return;
    this.createResponse(
      `Open the consultation as the patient. Say this naturally, with the right emotion for your condition: "${firstLine}". ` +
        'Keep it to one short spoken sentence. Stay fully in character.',
    );
  }

  private createResponse(instructions?: string) {
    this.sendEvent({
      type: 'response.create',
      response: {
        instructions,
      },
    });
    this.responseStartedAt = performance.now();
    this.transition('processing', 'response requested');
  }

  private sendEvent(payload: unknown): boolean {
    if (!isOpenState(this.dc?.readyState)) return false;
    this.dc!.send(JSON.stringify(payload));
    return true;
  }

  private cancelCurrentResponse(reason: string) {
    this.sendEvent({ type: 'response.cancel' });
    this.logEvent({ type: 'interruption', detail: `response.cancel ${reason}` });
  }

  async sendTextMessage(text: string): Promise<void> {
    const content = text.trim();
    if (!content) return;
    if (!isOpenState(this.dc?.readyState)) throw new Error('Realtime session is not connected.');
    this.commitUserText(content);
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: content }],
      },
    });
    this.createResponse('Answer as the patient in one or two short, natural spoken sentences.');
  }

  async sayFarewell(): Promise<void> {
    if (!isOpenState(this.dc?.readyState)) return;
    this.createResponse(
      'The doctor is ending the consultation. Reply as the patient with a brief natural closing, such as thanks or concern. One sentence only.',
    );
    await this.waitForState(['listening', 'idle', 'error', 'disposed'], 4_500).catch(() => undefined);
  }

  async toggleMicMute(): Promise<boolean> {
    this.micMuted = !this.micMuted;
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !this.micMuted;
    });
    this.logEvent({ type: 'lifecycle', detail: this.micMuted ? 'mic_muted' : 'mic_unmuted' });
    return this.micMuted;
  }

  dispose() {
    if (this.state === 'disposed') return;
    this.disposed = true;
    this.logEvent({ type: 'lifecycle', detail: `session_dispose case=${this.caseId}` });
    this.clearStateTimer();
    try { this.cancelCurrentResponse('dispose'); } catch { /* noop */ }
    try { this.dc?.close(); } catch { /* noop */ }
    try { this.pc?.close(); } catch { /* noop */ }
    this.localStream?.getTracks().forEach((track) => track.stop());
    if (this.audioEl) {
      try { this.audioEl.srcObject = null; this.audioEl.remove(); } catch { /* noop */ }
    }
    this.dc = null;
    this.pc = null;
    this.localStream = null;
    this.audioEl = null;
    this.transition('disposed', 'disposed');
  }

  isVoiceDisabled(): boolean {
    return false;
  }

  getMessages(): ReadonlyArray<ChatMessage> {
    return this.messages;
  }

  subscribeMessages(cb: (msgs: ReadonlyArray<ChatMessage>) => void): () => void {
    this.messageSubscribers.add(cb);
    cb(this.messages);
    return () => this.messageSubscribers.delete(cb);
  }

  getEventLog(): ReadonlyArray<ConversationEvent> {
    return this.eventLog;
  }

  getStatus(): ConversationStatus {
    if (this.state === 'disposed') return 'uninitialized';
    if (this.state === 'idle') return 'ready';
    if (this.state === 'processing') return 'thinking';
    return this.state;
  }

  getState(): ConversationState {
    return this.state;
  }

  getPreviousState(): ConversationState {
    return this.previousState;
  }

  getCurrentEmotion(): PatientEmotion {
    return this.currentEmotion;
  }

  getLastDetectedLanguage(): string {
    return this.lastDetectedLanguage;
  }

  setListeners(listeners: ConversationListeners) {
    this.listeners = listeners;
    this.listeners.onStatus?.(this.getStatus());
    this.listeners.onEmotion?.(this.currentEmotion);
  }

  private appendAssistantText(delta: string) {
    if (!delta) return;
    this.pendingAssistantText += delta;
    this.listeners.onSubtitle?.({ who: 'patient', text: this.pendingAssistantText, partial: true });
  }

  private commitAssistantText(text: string) {
    const content = text.trim();
    this.pendingAssistantText = '';
    if (!content) return;
    const last = this.messages[this.messages.length - 1];
    if (last?.role === 'assistant' && last.content === content) return;
    this.messages = [...this.messages, { role: 'assistant', content }];
    this.currentEmotion = detectEmotion(content);
    this.listeners.onEmotion?.(this.currentEmotion);
    this.listeners.onSubtitle?.({ who: 'patient', text: content });
    this.notifyMessages();
  }

  private commitUserText(text: string) {
    const content = String(text || '').trim();
    if (!content) return;
    const last = this.messages[this.messages.length - 1];
    if (last?.role === 'user' && last.content === content) return;
    this.messages = [...this.messages, { role: 'user', content }];
    this.lastDetectedLanguage = detectLanguage(content);
    this.listeners.onSubtitle?.({ who: 'you', text: content });
    this.notifyMessages();
  }

  private notifyMessages() {
    for (const cb of this.messageSubscribers) cb(this.messages);
  }

  private transition(to: ConversationState, detail?: string): boolean {
    if (this.state === to) {
      if (detail) this.logEvent({ type: 'lifecycle', detail });
      return true;
    }
    if (this.state !== 'disposed' && !VALID_TRANSITIONS[this.state].has(to)) {
      this.logEvent({
        type: 'error',
        detail: `invalid_transition ${this.state}->${to}${detail ? ` ${detail}` : ''}`,
      });
      return false;
    }
    const from = this.state;
    this.previousState = from;
    this.state = to;
    this.clearStateTimer();
    this.logEvent({ type: 'state_transition', from, to, detail });
    this.listeners.onStatus?.(this.getStatus(), detail);
    for (const cb of this.stateSubscribers) cb(to);
    const timeout = STATE_TIMEOUTS[to];
    if (timeout) {
      this.stateTimer = setTimeout(() => {
        this.logEvent({ type: 'timeout', detail: `${to} exceeded ${timeout}ms` });
        if (to === 'loading' || to === 'processing') this.transition('recovering', `${to} timeout`);
      }, timeout);
    }
    return true;
  }

  private clearStateTimer() {
    if (this.stateTimer) clearTimeout(this.stateTimer);
    this.stateTimer = null;
  }

  private waitForState(targets: ConversationState[], timeoutMs: number): Promise<ConversationState> {
    if (targets.includes(this.state)) return Promise.resolve(this.state);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.stateSubscribers.delete(sub);
        reject(new Error(`Timed out waiting for ${targets.join(', ')}`));
      }, timeoutMs);
      const sub = (state: ConversationState) => {
        if (!targets.includes(state)) return;
        clearTimeout(timer);
        this.stateSubscribers.delete(sub);
        resolve(state);
      };
      this.stateSubscribers.add(sub);
    });
  }

  private handleConnectionLoss(reason: string) {
    if (this.disposed || this.state === 'disposed') return;
    this.logEvent({ type: 'reconnect', detail: `connection_loss reason=${reason} attempt=${this.reconnectAttempts}` });
    this.attemptReconnect();
  }

  private attemptReconnect() {
    if (this.disposed || this.state === 'disposed') return;
    if (this.reconnectAttempts >= 3) {
      this.handleError('Realtime connection lost. Max reconnection attempts reached.');
      return;
    }

    this.reconnectAttempts += 1;
    this.transition('recovering', `Reconnecting realtime session (attempt ${this.reconnectAttempts}/3)...`);

    // Clean up peer connection resources without destroying localStream
    try { this.dc?.close(); } catch { /* noop */ }
    try { this.pc?.close(); } catch { /* noop */ }
    if (this.audioEl) {
      try { this.audioEl.srcObject = null; this.audioEl.remove(); } catch { /* noop */ }
    }
    this.dc = null;
    this.pc = null;
    this.audioEl = null;

    setTimeout(async () => {
      if (this.disposed || this.state === 'disposed') return;
      try {
        this.initLock = this.connect();
        await this.initLock;
        this.reconnectAttempts = 0; // Success!
      } catch (err) {
        this.logEvent({ type: 'reconnect', detail: `reconnect_failed attempt=${this.reconnectAttempts} err=${err instanceof Error ? err.message : String(err)}` });
        // If we still have attempts left, retry again
        if (this.reconnectAttempts < 3) {
          this.attemptReconnect();
        } else {
          this.handleError(`Realtime connection failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      } finally {
        this.initLock = null;
      }
    }, 1500);
  }

  private handleError(message: string) {
    this.logEvent({ type: 'error', detail: message });
    this.listeners.onError?.(message);
    if (this.state !== 'disposed') this.transition('error', message);
  }

  private logEvent(partial: Omit<ConversationEvent, 'timestamp' | 'correlationId'>) {
    const event = {
      timestamp: Date.now(),
      correlationId: this.currentCorrelationId,
      ...partial,
    };
    this.eventLog.push(event);
    if (this.eventLog.length > Conversation.MAX_EVENT_LOG) {
      this.eventLog.splice(0, this.eventLog.length - Conversation.MAX_EVENT_LOG);
    }
    const suffix = event.latencyMs !== undefined ? ` (${event.latencyMs}ms)` : '';
    console.log(`[realtime] ${event.type}${event.from || event.to ? ` ${event.from ?? ''}->${event.to ?? ''}` : ''}${event.detail ? ` ${event.detail}` : ''}${suffix}`);
  }
}
