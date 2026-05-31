// Atrium GameAudioManager — Nintendo / Animal Crossing Style
// Single authoritative audio source for all game sounds and background music.
// Uses Web Audio API exclusively — no external MP3 files for UI sounds.

// ─── SINGLETON AUDIO CONTEXT ─────────────────────────────────────────
let globalAudioCtx: AudioContext | null = null;
let musicSequencer: PlayfulSequencer | null = null;

// Debounce tracking: WeakMap from element → last hover timestamp
const hoverCooldownMap = new WeakMap<EventTarget, number>();
const HOVER_DEBOUNCE_MS = 120;

export function getAudioContext(): AudioContext {
  if (!globalAudioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AudioContextClass();
  }
  return globalAudioCtx!;
}

// ─── BACKGROUND MUSIC SYNTHESIZER ────────────────────────────────────
class PlayfulSequencer {
  private ctx: AudioContext;
  private isPlaying = false;
  private timerId: any = null;
  private stepIntervalMs = 280; // Eighth note at ~107 BPM
  private currentStep = 0;
  private masterGain: GainNode;

  // Progression: Fmaj7 → G6 → Em7 → Am7
  private chords = [
    [53, 57, 60, 64], // F3, A3, C4, E4
    [55, 59, 62, 64], // G3, B3, D4, E4
    [52, 55, 59, 62], // E3, G3, B3, D4
    [57, 60, 64, 67], // A3, C4, E4, G4
  ];

  // Cute, warm Animal Crossing / Pokémon pentatonic melody loop
  private melodySeq = [
    64, 0, 67, 69, 72, 0, 69, 67,
    0, 64, 62, 0, 60, 64, 67, 0,
    69, 0, 72, 74, 76, 0, 74, 72,
    0, 74, 76, 79, 76, 72, 69, 0,
  ];

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.0; // Start faded out
    this.masterGain.connect(ctx.destination);
  }

  public start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.ctx.resume().then(() => {
      this.currentStep = 0;
      // Smooth fade in — volume raised for richer presence
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.26, this.ctx.currentTime + 1.2);
      this.timerId = setInterval(() => this.scheduleNextStep(), this.stepIntervalMs);
    });
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    // Smooth fade out
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.35);
    setTimeout(() => {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    }, 400);
  }

  public setVolume(vol: number) {
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1);
  }

  private scheduleNextStep() {
    const time = this.ctx.currentTime;
    const chordIndex = Math.floor(this.currentStep / 8) % this.chords.length;
    const chord = this.chords[chordIndex];
    const stepInChord = this.currentStep % 8;

    // 1. Backing arpeggios (warm triangle wave = soft marimba)
    if (stepInChord % 2 === 0) {
      const arpeggioNote = chord[stepInChord / 2 % chord.length];
      this.playSynthNote(arpeggioNote - 12, time, 0.45, 'triangle', 0.22);
    } else {
      const arpeggioNote = chord[stepInChord % chord.length];
      this.playSynthNote(arpeggioNote, time, 0.28, 'triangle', 0.15);
    }

    // 2. Lead melody (sine = cozy flute/bells) with occasional rests
    const melodyNote = this.melodySeq[this.currentStep % this.melodySeq.length];
    if (melodyNote > 0 && Math.random() < 0.85) {
      this.playSynthNote(melodyNote, time, 0.55, 'sine', 0.16, true);
    }

    this.currentStep += 1;
  }

  private playSynthNote(
    midiNote: number,
    time: number,
    duration: number,
    type: OscillatorType,
    gainVal: number,
    addVibrato = false,
  ) {
    const freq = Math.pow(2, (midiNote - 69) / 12) * 440;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    if (addVibrato) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 5.5;
      lfoGain.gain.value = 4.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(time);
      lfo.stop(time + duration);
    }

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gainVal, time + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration);
  }
}

// ─── CENTRALIZED GAME AUDIO MANAGER ──────────────────────────────────
// All UI sounds live here. Never attach sounds directly to components —
// always call soundSystem.playHover(target), soundSystem.playClick(), etc.

export const soundSystem = {
  /**
   * Debounced hover pop — safe to call on onMouseEnter on any element.
   * Pass `target` (event.currentTarget) to debounce per element.
   */
  playHover(target?: EventTarget | null) {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') return;

      // Debounce: skip if same element was hovered within HOVER_DEBOUNCE_MS
      if (target) {
        const now = performance.now();
        const last = hoverCooldownMap.get(target) ?? 0;
        if (now - last < HOVER_DEBOUNCE_MS) return;
        hoverCooldownMap.set(target, now);
      }

      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, time);
      osc.frequency.exponentialRampToValueAtTime(580, time + 0.06);

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.09, time + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.07);
    } catch {
      /* browser audio gated — ignore */
    }
  },

  /**
   * Satisfying Nintendo click/snap — call in onClick handlers.
   */
  playClick() {
    try {
      const ctx = getAudioContext();
      const time = ctx.currentTime;
      ctx.resume();

      // Transient tick (high-pass filtered noise)
      const bufferSize = Math.floor(ctx.sampleRate * 0.02);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1400;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.018);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(time);

      // Bell chime (C5 & G5 triangle tones)
      [523.25, 783.99].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, time);
        osc.frequency.setValueAtTime(f + idx * 5, time + 0.01);
        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.linearRampToValueAtTime(0.045, time + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.13);
      });
    } catch {
      /* ignore */
    }
  },

  /**
   * Ascending sweet chord chime — call on success / level completion.
   */
  playSuccess() {
    try {
      const ctx = getAudioContext();
      const time = ctx.currentTime;
      ctx.resume();

      // C5 → E5 → G5 → C6 cascade
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const noteTime = time + i * 0.075;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, noteTime);
        gainNode.gain.setValueAtTime(0.0001, noteTime);
        gainNode.gain.linearRampToValueAtTime(0.08, noteTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.38);
      });
    } catch {
      /* ignore */
    }
  },

  /**
   * Soft card rustle tick — debounced, safe on card onMouseEnter.
   */
  playCardHover(target?: EventTarget | null) {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') return;

      if (target) {
        const now = performance.now();
        const last = hoverCooldownMap.get(target) ?? 0;
        if (now - last < HOVER_DEBOUNCE_MS) return;
        hoverCooldownMap.set(target, now);
      }

      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(60, time + 0.05);
      gainNode.gain.setValueAtTime(0.052, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.06);
    } catch {
      /* ignore */
    }
  },

  /**
   * Soft whoosh transition sound — call on screen navigation.
   */
  playTransition() {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') return;
      ctx.resume();
      const time = ctx.currentTime;

      // Filtered noise swoosh
      const bufferSize = Math.floor(ctx.sampleRate * 0.18);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + 0.18);
      filter.Q.value = 0.8;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.linearRampToValueAtTime(0.04, time + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      noise.start(time);
    } catch {
      /* ignore */
    }
  },
};

// ─── BACKGROUND MUSIC BRIDGE ──────────────────────────────────────────
// Only ONE sequencer ever exists. BackgroundMusic.tsx is the sole owner.

export function startBackgroundMusic() {
  try {
    const ctx = getAudioContext();
    if (!musicSequencer) {
      musicSequencer = new PlayfulSequencer(ctx);
    }
    musicSequencer.start();
  } catch {
    /* ignore */
  }
}

export function stopBackgroundMusic() {
  if (musicSequencer) {
    musicSequencer.stop();
  }
}

export function setBackgroundMusicVolume(vol: number) {
  if (musicSequencer) {
    musicSequencer.setVolume(vol);
  }
}

// ─── REACT HOOK: useSound ─────────────────────────────────────────────
// Returns pre-built event handler props for hover + click sounds.
// Usage: const { hoverProps, clickProps, cardHoverProps } = useSound();
//        <button {...hoverProps} {...clickProps}>…</button>

export function useSound() {
  return {
    /** onMouseEnter that plays a debounced bubble pop */
    hoverProps: {
      onMouseEnter: (e: React.MouseEvent) => soundSystem.playHover(e.currentTarget),
    },
    /** onMouseEnter that plays a debounced card tick */
    cardHoverProps: {
      onMouseEnter: (e: React.MouseEvent) => soundSystem.playCardHover(e.currentTarget),
    },
    /** onClick that plays a Nintendo snap click */
    clickProps: {
      onClick: () => soundSystem.playClick(),
    },
  };
}
