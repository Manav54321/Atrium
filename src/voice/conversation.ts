/**
 * Real-time voice conversation engine — deterministic FSM architecture.
 *
 * Pipeline:  Browser mic → LiveKit WebRTC → Deepgram STT → Groq LLM
 *            → Cartesia TTS → LiveKit WebRTC → Browser playback
 *
 * State machine:
 *   IDLE → LISTENING → PROCESSING → SPEAKING → IDLE
 *   SPEAKING → INTERRUPTED → IDLE
 *   {PROCESSING,SPEAKING} → RECOVERING → IDLE
 *   * → DISPOSED (always valid)
 *
 * All transitions are validated — invalid transitions are logged and rejected.
 * Every turn gets a correlation ID for end-to-end tracing.
 */

import {
  Room,
  RoomEvent,
  Track,
  type RemoteAudioTrack,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
  type Participant,
  type TranscriptionSegment,
} from 'livekit-client';
import { hasOpenAIKey, streamPatientResponse, type ChatMessage } from './patientStream';

// ─── Remote console forwarding ──────────────────────────────────────────────
if (typeof window !== 'undefined' && !(window as any).__consoleRedirected) {
  (window as any).__consoleRedirected = true;
  const originalLog = window.console.log;
  const originalWarn = window.console.warn;
  const originalError = window.console.error;

  const logRemote = (level: string, ...args: any[]) => {
    const msg = args.map((x) => {
      if (x instanceof Error) return x.stack || x.message;
      return typeof x === 'object' ? JSON.stringify(x) : String(x);
    }).join(' ');

    if (level === 'log') originalLog(...args);
    else if (level === 'warn') originalWarn(...args);
    else if (level === 'error') originalError(...args);

    fetch('/log/frontend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message: msg }),
    }).catch(() => {});
  };

  window.console.log = (...args) => logRemote('log', ...args);
  window.console.warn = (...args) => logRemote('warn', ...args);
  window.console.error = (...args) => logRemote('error', ...args);
}

// ─── Constants ──────────────────────────────────────────────────────────────
const FALLBACK_PERSONA =
  'You are a patient speaking to a doctor. Keep replies to 1–2 short spoken sentences. ' +
  'Output spoken dialogue only — no stage directions, no asterisks, no brackets.';
const FALLBACK_INITIAL: { role: 'assistant'; content: string } = {
  role: 'assistant',
  content: 'Hi doc.',
};

// ─── FSM State Definitions ──────────────────────────────────────────────────

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

/** Backward-compat alias — old consumers use ConversationStatus */
export type ConversationStatus = ConversationState | 'uninitialized' | 'ready' | 'thinking';

/** Valid state transitions. Every entry is `from → Set<to>`. */
const VALID_TRANSITIONS: Record<ConversationState, Set<ConversationState>> = {
  loading:     new Set(['idle', 'error', 'disposed']),
  idle:        new Set(['listening', 'processing', 'speaking', 'disposed', 'loading']),
  listening:   new Set(['processing', 'idle', 'speaking', 'disposed']),
  processing:  new Set(['speaking', 'idle', 'recovering', 'disposed']),
  speaking:    new Set(['idle', 'interrupted', 'disposed', 'recovering', 'listening']),
  interrupted: new Set(['idle', 'processing', 'disposed', 'listening']),
  recovering:  new Set(['idle', 'error', 'disposed']),
  error:       new Set(['loading', 'disposed']),
  disposed:    new Set([]), // terminal state
};

/** Per-state timeout before auto-recovery (ms). */
const STATE_TIMEOUTS: Partial<Record<ConversationState, number>> = {
  processing: 12_000,
  speaking:   30_000,
  recovering: 5_000,
};

// ─── Structured Event Log ───────────────────────────────────────────────────

export interface ConversationEvent {
  timestamp: number;
  correlationId: string;
  type: 'state_transition' | 'transcription' | 'error' | 'reconnect' | 'timeout' | 'drift' | 'lifecycle';
  from?: string;
  to?: string;
  detail?: string;
  latencyMs?: number;
}

// ─── Emotion Detection ──────────────────────────────────────────────────────

export type PatientEmotion = 'neutral' | 'pain' | 'fear' | 'relief' | 'confused';

function detectEmotion(text: string): PatientEmotion {
  const t = text.toLowerCase();
  if (/\b(hurts?|pain(?:ful)?|ache|aching|ow|ouch|sore|burn(?:s|ing)?|sharp|throb|stab|rip(?:ping)?|tear(?:ing)?|crush(?:ing)?|killing me|agony|can'?t breathe|chest)\b/.test(t)) return 'pain';
  if (/\b(scared|afraid|frightened|terrified|worr(?:ied|y)|nervous|anxious|help me|please help|dying|die|gonna die|save me)\b/.test(t)) return 'fear';
  if (/\b(okay|i'?m okay|fine|better|good now|thanks|thank you|relieved?|easier|breathing better|no more pain)\b/.test(t)) return 'relief';
  if (/\b(i don'?t (?:know|understand)|not sure|confused|what does that mean|what do you mean|sorry what)\b/.test(t)) return 'confused';
  return 'neutral';
}

// ─── Subtitle & Listener Types ──────────────────────────────────────────────

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

// ─── Options ────────────────────────────────────────────────────────────────

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

interface VoiceTokenResponse {
  token: string;
  url: string;
  roomName: string;
}

async function fetchVoiceToken(opts: {
  caseId: string;
  systemPrompt: string;
  initialLine: string;
  gender: 'M' | 'F';
  age?: number;
  severity?: string;
}): Promise<VoiceTokenResponse> {
  const r = await fetch('/voice/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!r.ok) throw new Error(`/voice/token ${r.status}: ${await r.text().catch(() => '')}`);
  return r.json();
}

// ─── Correlation ID Generator ───────────────────────────────────────────────
let _corrSeq = 0;
function nextCorrelationId(): string {
  return `turn-${Date.now()}-${++_corrSeq}`;
}

// ─── Conversation Engine ────────────────────────────────────────────────────

export class Conversation {
  private messages: ChatMessage[] = [];
  private listeners: ConversationListeners = {};
  private _state: ConversationState = 'disposed'; // pre-init sentinel
  private _prevState: ConversationState = 'disposed';
  private voiceDisabled = false;

  private room: Room | null = null;
  private remoteAudioTrack: RemoteAudioTrack | null = null;
  private analyser: AnalyserNode | null = null;
  private audioCtx: AudioContext;
  private ampBuf: Uint8Array;

  // Explicit audio element tracking — no more DOM queries
  private audioElements = new Set<HTMLAudioElement>();

  private systemPrompt: string;
  private initialMessage: { role: 'assistant'; content: string };
  private voiceGender: 'M' | 'F';
  private caseId: string;
  private storageKey: string | null = null;
  private age: number;
  private severity: 'stable' | 'urgent' | 'critical';
  private lastDetectedLanguage: string = 'English';

  // Reconnect state
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Per-state timeout timer
  private stateTimer: ReturnType<typeof setTimeout> | null = null;

  // Heartbeat interval
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Init mutex — prevents concurrent init() calls
  private initLock: Promise<void> | null = null;

  // Correlation ID for the current turn
  private currentCorrelationId: string = nextCorrelationId();

  // Structured event log (ring buffer, last 100 events)
  private eventLog: ConversationEvent[] = [];
  private static readonly MAX_EVENT_LOG = 100;

  // Message subscribers
  private messageSubscribers = new Set<(msgs: ReadonlyArray<ChatMessage>) => void>();

  // State change subscribers (for farewell Promise and other waiters)
  private stateSubscribers = new Set<(state: ConversationState) => void>();

  // Current patient emotion
  private currentEmotion: PatientEmotion = 'neutral';

  // Mic mute state (soft mute — session stays alive)
  private _micMuted = false;

  constructor(
    audioCtx: AudioContext,
    listeners: ConversationListeners = {},
    options: ConversationOptions = {}
  ) {
    this.audioCtx = audioCtx;
    this.listeners = listeners;
    this.systemPrompt = options.systemPrompt ?? FALLBACK_PERSONA;
    this.initialMessage = options.initialMessage ?? FALLBACK_INITIAL;
    this.voiceGender = options.voiceGender ?? 'M';
    this.caseId = options.caseId ?? 'unknown';
    this.storageKey = options.storageKey ?? null;
    this.age = options.age ?? 35;
    this.severity = options.severity ?? 'stable';
    this.ampBuf = new Uint8Array(1024);

    const restored = this.loadMessages();
    this.messages = restored && restored.length > 0 ? restored : [this.initialMessage];
    // Mark as pre-init, not truly disposed
    this._state = 'disposed';
    this._prevState = 'disposed';
  }

  // ─── FSM Core ───────────────────────────────────────────────────────────

  /**
   * Attempt a state transition. Returns true if the transition was valid
   * and applied, false if it was rejected.
   */
  private transition(to: ConversationState, detail?: string): boolean {
    const from = this._state;

    // Same-state transitions are no-ops (not errors)
    if (from === to) return true;

    // Disposed is terminal — nothing can leave it except init() which sets
    // state directly before the first transition.
    if (from === 'disposed' && to !== 'loading') {
      console.warn(`[FSM] Rejected: ${from} → ${to} (disposed is terminal)`);
      return false;
    }

    // Allow disposed from any state (teardown is always valid)
    if (to === 'disposed') {
      this.applyTransition(from, to, detail);
      return true;
    }

    const valid = VALID_TRANSITIONS[from];
    if (!valid || !valid.has(to)) {
      console.warn(`[FSM] Rejected: ${from} → ${to} (not a valid transition)`);
      this.logEvent({
        type: 'error',
        detail: `Invalid transition: ${from} → ${to}`,
      });
      return false;
    }

    this.applyTransition(from, to, detail);
    return true;
  }

  private applyTransition(from: ConversationState, to: ConversationState, detail?: string) {
    this._prevState = from;
    this._state = to;

    // Log the transition
    this.logEvent({
      type: 'state_transition',
      from,
      to,
      detail,
    });

    console.log(`[FSM] ${from} → ${to}${detail ? ` (${detail})` : ''}`);

    // Clear any existing state timeout
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }

    // Set timeout for the new state if applicable
    const timeout = STATE_TIMEOUTS[to];
    if (timeout && to !== 'disposed') {
      this.stateTimer = setTimeout(() => {
        if (this._state === to) {
          console.warn(`[FSM] State timeout: ${to} exceeded ${timeout}ms. Recovering.`);
          this.logEvent({ type: 'timeout', detail: `${to} exceeded ${timeout}ms` });
          this.transition('recovering', `${to} timeout`);
          // In recovery, speak an in-character line
          this.handleRecovery();
        }
      }, timeout);
    }

    // Notify listeners with backward-compat status mapping
    const compatStatus = this.toCompatStatus(to);
    this.listeners.onStatus?.(compatStatus, detail);

    // Notify state subscribers
    for (const sub of this.stateSubscribers) {
      try { sub(to); } catch { /* subscriber error — non-fatal */ }
    }
  }

  /** Map internal FSM states to backward-compatible status strings */
  private toCompatStatus(state: ConversationState): ConversationStatus {
    switch (state) {
      case 'idle': return 'ready';
      case 'processing': return 'thinking';
      case 'recovering': return 'thinking';
      default: return state;
    }
  }

  /** Wait for the FSM to reach any of the given states. Resolves immediately
   *  if already in one of them. Times out after `timeoutMs`. */
  private waitForState(targets: ConversationState[], timeoutMs: number = 10_000): Promise<ConversationState> {
    if (targets.includes(this._state)) return Promise.resolve(this._state);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.stateSubscribers.delete(sub);
        reject(new Error(`waitForState timeout: expected ${targets.join('|')}, stuck at ${this._state}`));
      }, timeoutMs);

      const sub = (state: ConversationState) => {
        if (targets.includes(state)) {
          clearTimeout(timer);
          this.stateSubscribers.delete(sub);
          resolve(state);
        }
      };
      this.stateSubscribers.add(sub);
    });
  }

  private handleRecovery() {
    // Generate an in-character recovery line
    const recoveryLines: Record<string, string> = {
      critical: "I'm sorry... I'm struggling to hear... could you say that again?",
      urgent: "Sorry doc, I'm feeling really dizzy. What did you say?",
      stable: "Sorry, I didn't quite catch that. Could you repeat it?",
    };
    const line = recoveryLines[this.severity] ?? recoveryLines.stable;

    this.listeners.onSubtitle?.({ who: 'patient', text: line });
    this.setEmotion(detectEmotion(line));

    // After a brief pause, return to idle
    setTimeout(() => {
      if (this._state === 'recovering') {
        this.transition('idle', 'recovery complete');
      }
    }, 1500);
  }

  // ─── Event Log ──────────────────────────────────────────────────────────

  private logEvent(partial: Omit<ConversationEvent, 'timestamp' | 'correlationId'>) {
    const event: ConversationEvent = {
      timestamp: Date.now(),
      correlationId: this.currentCorrelationId,
      ...partial,
    };
    this.eventLog.push(event);
    if (this.eventLog.length > Conversation.MAX_EVENT_LOG) {
      this.eventLog.shift();
    }
  }

  /** Public read access to the event log for debug panels */
  getEventLog(): ReadonlyArray<ConversationEvent> {
    return this.eventLog;
  }

  // ─── Public Status API ──────────────────────────────────────────────────

  getStatus(): ConversationStatus {
    if (this._state === 'disposed' && !this.room) return 'uninitialized';
    return this.toCompatStatus(this._state);
  }

  getState(): ConversationState {
    return this._state;
  }

  getPreviousState(): ConversationState {
    return this._prevState;
  }

  isVoiceDisabled(): boolean {
    return this.voiceDisabled;
  }

  isMicMuted(): boolean {
    return this._micMuted;
  }

  setListeners(listeners: ConversationListeners) {
    this.listeners = listeners;
  }

  // ─── Messages ───────────────────────────────────────────────────────────

  getMessages(): ReadonlyArray<ChatMessage> {
    return [...this.messages];
  }

  subscribeMessages(fn: (msgs: ReadonlyArray<ChatMessage>) => void): () => void {
    this.messageSubscribers.add(fn);
    return () => { this.messageSubscribers.delete(fn); };
  }

  private emitMessages() {
    const snap = [...this.messages];
    this.messageSubscribers.forEach((fn) => fn(snap));
  }

  private saveMessages() {
    if (!this.storageKey) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    } catch { /* quota or privacy-mode */ }
  }

  private loadMessages(): ChatMessage[] | null {
    if (!this.storageKey) return null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return parsed.filter(
        (m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      );
    } catch {
      return null;
    }
  }

  // ─── Mouth Amplitude (lip-sync) ─────────────────────────────────────────

  getMouthAmplitude(): number {
    if (!this.analyser) return 0;
    if (this.ampBuf.length !== this.analyser.frequencyBinCount) {
      this.ampBuf = new Uint8Array(this.analyser.frequencyBinCount);
    }
    this.analyser.getByteTimeDomainData(this.ampBuf as any);
    let sum = 0;
    const n = this.ampBuf.length;
    for (let i = 0; i < n; i++) {
      const d = (this.ampBuf[i] - 128) / 128;
      sum += d * d;
    }
    const rms = Math.sqrt(sum / n);
    return Math.min(1, rms * 3.2);
  }

  // ─── Emotion ────────────────────────────────────────────────────────────

  getCurrentEmotion(): PatientEmotion {
    return this.currentEmotion;
  }

  private setEmotion(e: PatientEmotion) {
    if (e === this.currentEmotion) return;
    this.currentEmotion = e;
    this.listeners.onEmotion?.(e);
  }

  // ─── Language Detection ─────────────────────────────────────────────────

  private detectLanguageSimple(text: string): string {
    if (/[\u0900-\u097f]/.test(text)) return 'Hindi';
    const words = text.toLowerCase().match(/[a-zA-Z']+/g) || [];
    const HINDI_WORDS = new Set(['haan','nahi','nahin','thoda','raha','rahi','hai','hain','kal','aaj','kyun','aap','mera','mujhe','bhi','aur','ka','ki','ke','se','ko','tha','thi','the','kuch','ab','ji','dard','toh','sath','baad','pehle','kya','kaise','kab','hum','main','mein','yeh','woh','achha','bahut','theek']);
    const count = words.filter(w => HINDI_WORDS.has(w)).length;
    if (words.length <= 3 && count >= 1) return 'Hindi';
    if (words.length > 3 && count / words.length >= 0.15) return 'Hindi';
    return 'English';
  }

  getLastDetectedLanguage(): string {
    return this.lastDetectedLanguage;
  }

  // ─── Audio Context Helpers ──────────────────────────────────────────────

  private handleUserInteraction = () => {
    if (this.room && this.room.state === 'connected') {
      this.room.startAudio().catch(() => {});
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  };

  private attachAnalyser(track: RemoteAudioTrack) {
    try {
      const mst = track.mediaStreamTrack;
      if (!mst) return;
      const stream = new MediaStream([mst]);
      const source = this.audioCtx.createMediaStreamSource(stream);
      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);
      this.analyser = analyser;
      this.ampBuf = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      console.warn('[voice] analyser attach failed:', err);
    }
  }

  private detachAnalyser() {
    this.analyser = null;
  }

  private cleanupAudioElements() {
    for (const el of this.audioElements) {
      try { el.remove(); } catch { /* noop */ }
    }
    this.audioElements.clear();
  }

  // ─── Room Event Wiring ──────────────────────────────────────────────────

  private wireRoomEvents(room: Room) {
    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
      console.log('[voice] Remote track subscribed:', track.sid, 'kind:', track.kind, 'from:', participant.identity);
      if (track.kind === Track.Kind.Audio) {
        this.remoteAudioTrack = track as RemoteAudioTrack;
        this.attachAnalyser(this.remoteAudioTrack);
        const el = (track as RemoteAudioTrack).attach();
        el.style.display = 'none';
        document.body.appendChild(el);
        this.audioElements.add(el);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      if (track === this.remoteAudioTrack) {
        try { (track as RemoteAudioTrack).detach().forEach((el) => el.remove()); } catch { /* noop */ }
        this.remoteAudioTrack = null;
        this.detachAnalyser();
      }
    });

    room.on(RoomEvent.TranscriptionReceived, (segments: TranscriptionSegment[], participant?: Participant) => {
      const isLocal = participant?.identity === room.localParticipant.identity;
      for (const seg of segments) {
        if (isLocal) {
          this.handleUserTranscription(seg);
        } else {
          this.handleAgentTranscription(seg);
        }
      }
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log(`[FSM] Room disconnected. caseId=${this.caseId}`);
      this.logEvent({ type: 'lifecycle', detail: 'Room disconnected' });

      if (this._state === 'disposed') return;

      // Clean up current session resources
      this.room = null;
      this.detachAnalyser();
      this.remoteAudioTrack = null;
      this.cleanupAudioElements();

      // Attempt reconnect with exponential backoff (max 5 attempts)
      if (this.reconnectAttempts >= 5) {
        console.error('[voice] Max reconnect attempts reached. Entering error state.');
        this.transition('error', 'Max reconnect attempts');
        this.listeners.onError?.('Connection lost. Please refresh.');
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16_000);
      this.reconnectAttempts++;

      console.warn(`[voice] Reconnect attempt ${this.reconnectAttempts} in ${delay}ms…`);
      this.logEvent({ type: 'reconnect', detail: `Attempt ${this.reconnectAttempts} in ${delay}ms` });
      this.transition('loading', 'reconnecting');

      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (this._state !== 'disposed') {
          this.performInit().catch((err) => {
            console.error('[voice] Reconnect failed:', err);
          });
        }
      }, delay);
    });
  }

  // ─── Transcription Handlers ─────────────────────────────────────────────

  private handleUserTranscription(seg: TranscriptionSegment) {
    if (!seg.text) return;

    if (!seg.final) {
      this.listeners.onSubtitle?.({ who: 'you', text: seg.text, partial: true });
      if (this._state === 'speaking') {
        this.transition('interrupted', 'user speaking');
      }
      this.transition('listening', 'user speaking');
      return;
    }

    const final = seg.text.trim();
    if (!final) return;

    // Start a new correlation ID for this turn
    this.currentCorrelationId = nextCorrelationId();

    this.lastDetectedLanguage = this.detectLanguageSimple(final);
    this.logEvent({ type: 'transcription', detail: `user: ${final.slice(0, 80)}` });
    this.listeners.onSubtitle?.({ who: 'you', text: final });
    this.messages.push({ role: 'user', content: final });
    this.saveMessages();
    this.emitMessages();
    this.transition('processing', 'user turn complete');
  }

  private handleAgentTranscription(seg: TranscriptionSegment) {
    if (!seg.text) return;

    if (!seg.final) {
      this.setEmotion(detectEmotion(seg.text));
      this.listeners.onSubtitle?.({ who: 'patient', text: seg.text, partial: true });
      this.transition('speaking', 'agent speaking');
      return;
    }

    const final = seg.text.trim();
    if (!final) return;

    this.setEmotion(detectEmotion(final));
    this.logEvent({ type: 'transcription', detail: `agent: ${final.slice(0, 80)}` });
    this.listeners.onSubtitle?.({ who: 'patient', text: final });
    this.messages.push({ role: 'assistant', content: final });
    this.saveMessages();
    this.emitMessages();
    this.transition('idle', 'agent turn complete');
  }

  // ─── Heartbeat ──────────────────────────────────────────────────────────

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this._state === 'disposed') {
        this.stopHeartbeat();
        return;
      }
      if (this.room && this.room.state !== 'connected') {
        console.warn('[voice] Heartbeat: room state is', this.room.state, '— triggering reconnect');
        this.logEvent({ type: 'lifecycle', detail: `Heartbeat detected room state: ${this.room.state}` });
        // Force a disconnect event to trigger reconnect logic
        try { this.room.disconnect(); } catch { /* noop */ }
      }
    }, 5_000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ─── Mic Mute (soft mute — session stays alive) ─────────────────────────

  async toggleMicMute(): Promise<boolean> {
    if (!this.room || this._state === 'disposed') return this._micMuted;
    this._micMuted = !this._micMuted;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(!this._micMuted);
    } catch (err) {
      console.warn('[voice] mic toggle failed:', err);
    }
    console.log(`[voice] Mic ${this._micMuted ? 'muted' : 'unmuted'}`);
    return this._micMuted;
  }

  // ─── Init (with mutex) ──────────────────────────────────────────────────

  async init() {
    // Mutex — if init is already running, wait for it
    if (this.initLock) {
      console.log('[voice] init() already in progress, waiting…');
      await this.initLock;
      return;
    }

    // Only allow init from disposed (fresh) or error (reconnect) states
    if (this._state !== 'disposed' && this._state !== 'error') {
      console.log('[voice] init() skipped — current state:', this._state);
      return;
    }

    let resolve: () => void;
    this.initLock = new Promise<void>((r) => { resolve = r; });

    try {
      await this.performInit();
    } finally {
      this.initLock = null;
      resolve!();
    }
  }

  private async performInit() {
    console.log(`[voice] init() starting. caseId=${this.caseId}, gender=${this.voiceGender}`);
    this.logEvent({ type: 'lifecycle', detail: `Init starting for caseId=${this.caseId}` });

    // Force state to loading (bypass FSM for bootstrap)
    this._state = 'loading';
    this._prevState = 'disposed';
    this.listeners.onStatus?.('loading');

    try {
      if (!hasOpenAIKey()) {
        throw new Error('Patient backend unavailable.');
      }

      this.listeners.onProgress?.('Requesting voice session…');
      const initialLine = this.initialMessage.content;

      let tok: VoiceTokenResponse;
      try {
        tok = await fetchVoiceToken({
          caseId: this.caseId,
          systemPrompt: this.systemPrompt,
          initialLine,
          gender: this.voiceGender,
          age: this.age,
          severity: this.severity,
        });
      } catch (err: any) {
        const errMsg = err?.message ?? String(err);
        if (errMsg.includes('503') || errMsg.includes('not configured')) {
          console.warn('[voice] LiveKit not configured. Text-only mode.');
          this.voiceDisabled = true;
          this.transition('idle', 'text-only mode');

          const restored = this.loadMessages();
          if (!restored || restored.length <= 1) {
            this.listeners.onSubtitle?.({ who: 'patient', text: initialLine });
            this.setEmotion(detectEmotion(initialLine));
          } else {
            const lastAssistant = [...this.messages].reverse().find((m) => m.role === 'assistant');
            if (lastAssistant) {
              this.listeners.onSubtitle?.({ who: 'patient', text: lastAssistant.content });
              this.setEmotion(detectEmotion(lastAssistant.content));
            }
          }
          return;
        }
        throw err;
      }

      this.listeners.onProgress?.('Connecting to voice room…');

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        reconnectPolicy: { nextRetryDelayInMs: () => null },
      });
      this.wireRoomEvents(room);

      await room.connect(tok.url, tok.token);
      console.log('[voice] Room connected:', room.name);

      // Reset reconnect counter on success
      this.reconnectAttempts = 0;
      this.room = room;

      // Register interaction listener for audio context resume
      document.addEventListener('click', this.handleUserInteraction);

      // Start audio playback
      try {
        await room.startAudio();
      } catch {
        console.warn('[voice] startAudio() failed, waiting for user click');
      }

      // Resume audio context
      if (this.audioCtx.state === 'suspended') {
        try { await this.audioCtx.resume(); } catch { /* noop */ }
      }

      // Enable mic
      this.listeners.onProgress?.('Enabling microphone…');
      await room.localParticipant.setMicrophoneEnabled(true);

      // Start heartbeat monitoring
      this.startHeartbeat();

      // Transition to idle — fully operational
      this.transition('idle', 'connected');
      this.listeners.onProgress?.('Live.');

      // Initial subtitle placeholder
      this.listeners.onSubtitle?.({ who: 'patient', text: '…' });
      this.setEmotion(detectEmotion(initialLine));

      this.logEvent({ type: 'lifecycle', detail: 'Init complete. Voice live.' });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.error('[voice] Init failed:', err);
      this.logEvent({ type: 'error', detail: `Init failed: ${msg}` });
      this.transition('error', msg);
      this.listeners.onError?.(msg);
      throw err;
    }
  }

  // ─── Back-compat no-ops ─────────────────────────────────────────────────

  /** Back-compat: mic is always live in real-time mode. */
  async startListening() {
    if (this._state === 'disposed') return;
    if (this.room && this._micMuted) {
      this._micMuted = false;
      try { await this.room.localParticipant.setMicrophoneEnabled(true); } catch { /* noop */ }
    }
  }

  /** Back-compat: agent decides turn boundaries via VAD. */
  async stopListeningAndRespond() { /* no-op */ }

  cancel() {
    if (this.room) {
      this.room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
    }
    this.transition('idle', 'cancelled');
  }

  // ─── Farewell (Promise-based, no busy-wait) ─────────────────────────────

  async sayFarewell(): Promise<void> {
    this.transition('processing', 'farewell');
    this.listeners.onSubtitle?.({ who: 'patient', text: '…' });

    // Mute doctor's mic to prevent echo during farewell
    if (this.room) {
      try { await this.room.localParticipant.setMicrophoneEnabled(false); } catch { /* noop */ }
    }

    if (this.room && this.room.state === 'connected' && !this.voiceDisabled) {
      try {
        // RPC to agent for farewell
        const remotes = Array.from(this.room.remoteParticipants.values());
        const agent = remotes.find((p) => p.identity.startsWith('agent-')) ?? remotes[0];

        if (agent) {
          console.log('[farewell] RPC to', agent.identity);
          await this.room.localParticipant.performRpc({
            destinationIdentity: agent.identity,
            method: 'farewell',
            payload: '',
          });
        }
      } catch (err) {
        console.error('[farewell] RPC failed:', err);
      }

      // Wait for speaking to start, then wait for it to end
      // Promise-based — no busy-wait loop
      try {
        await this.waitForState(['speaking'], 5_000);
        await this.waitForState(['idle', 'disposed', 'error'], 8_000);
        // Tail flush — audio stream lags transcription by ~0.5s
        await new Promise((r) => setTimeout(r, 800));
      } catch {
        // Timeout waiting for farewell speech — proceed anyway
        console.warn('[farewell] Timed out waiting for farewell audio');
      }

      // Clear persisted history
      if (this.storageKey) {
        try { localStorage.removeItem(this.storageKey); } catch { /* noop */ }
      }
      this.transition('idle', 'farewell complete');
      return;
    }

    // Text-only fallback
    const farewellPrompt =
      "Okay, we're all done. Take care of yourself. Goodbye. " +
      "[This is your final reply. Say a short goodbye — thanks, okay, bye — " +
      "and NOTHING ELSE. Do NOT ask any questions. No follow-ups. " +
      "One or two short sentences, then silence.]";
    this.messages.push({ role: 'user', content: farewellPrompt });
    this.emitMessages();

    const controller = new AbortController();
    let assistantText = '';
    try {
      for await (const token of streamPatientResponse(this.systemPrompt, this.messages, controller.signal)) {
        assistantText += token;
        if (this.voiceDisabled) {
          this.listeners.onSubtitle?.({ who: 'patient', text: assistantText, partial: true });
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Farewell LLM error:', err);
    }
    const trimmed = assistantText.trim();
    if (trimmed) {
      this.setEmotion(detectEmotion(trimmed));
      this.listeners.onSubtitle?.({ who: 'patient', text: trimmed });
      this.messages.push({ role: 'assistant', content: trimmed });
      this.saveMessages();
      this.emitMessages();
    }
    this.transition('idle', 'farewell complete');
  }

  // ─── Text Chat ──────────────────────────────────────────────────────────

  async sendTextMessage(text: string, _opts?: { speak?: boolean }): Promise<void> {
    const clean = text.trim();
    if (!clean) return;
    if (this._state !== 'idle') return;

    this.currentCorrelationId = nextCorrelationId();
    this.listeners.onSubtitle?.({ who: 'you', text: clean });
    this.messages.push({ role: 'user', content: clean });
    this.saveMessages();
    this.emitMessages();
    this.transition('processing', 'text input');

    const controller = new AbortController();
    let assistantText = '';
    try {
      for await (const token of streamPatientResponse(this.systemPrompt, this.messages, controller.signal)) {
        assistantText += token;
        if (this.voiceDisabled) {
          this.listeners.onSubtitle?.({ who: 'patient', text: assistantText, partial: true });
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Text-chat LLM error:', err);
        this.listeners.onError?.(`AI patient stream failed: ${err?.message ?? err}`);
        this.transition('idle', 'text error');
        return;
      }
    }

    const trimmed = assistantText.trim();
    if (trimmed) {
      this.setEmotion(detectEmotion(trimmed));
      this.listeners.onSubtitle?.({ who: 'patient', text: trimmed });
      this.messages.push({ role: 'assistant', content: trimmed });
      this.saveMessages();
      this.emitMessages();
    }
    this.transition('idle', 'text response complete');
  }

  // ─── Reset & Dispose ────────────────────────────────────────────────────

  reset() {
    this.cancel();
    this.messages = [this.initialMessage];
    this.emitMessages();
    if (this.storageKey) {
      try { localStorage.removeItem(this.storageKey); } catch { /* noop */ }
    }
  }

  dispose() {
    this.logEvent({ type: 'lifecycle', detail: `Disposing conversation for caseId=${this.caseId}` });
    this.transition('disposed', 'explicit dispose');

    // Stop heartbeat
    this.stopHeartbeat();

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }

    // Remove interaction listener
    document.removeEventListener('click', this.handleUserInteraction);

    // Disconnect room
    if (this.room) {
      const roomName = this.room.name;
      if (roomName) {
        fetch('/voice/close-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName }),
        }).catch((err) => console.warn('[voice] close-room call failed:', err));
      }
      try { this.room.disconnect(); } catch { /* noop */ }
      this.room = null;
    }

    // Cleanup audio resources
    this.detachAnalyser();
    this.remoteAudioTrack = null;
    this.cleanupAudioElements();

    // Clear all subscribers
    this.stateSubscribers.clear();
    this.messageSubscribers.clear();
  }
}
