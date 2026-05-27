import { Conversation, type ConversationListeners } from './conversation';
import { buildPersona, buildInitialLine, isPediatric, parentGenderFor } from './patientPersona';
import type { PatientCase } from '../game/types';

let sharedCtx: AudioContext | null = null;

export function ensureAudioContext(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => undefined);
  }
  return sharedCtx;
}

/** Cached conversation, keyed by bedIndex. `caseId` is carried alongside so
 *  we can detect when a bed (or the polyclinic sentinel -10) receives a
 *  different patient — in that case the old conversation is disposed and a
 *  fresh one is built for the new persona. Without this, the polyclinic's
 *  single sentinel bedIndex caused new patients to inherit the previous
 *  patient's name, history, and voice. */
interface CachedConversation {
  conv: Conversation;
  caseId: string;
}

const store = new Map<number, CachedConversation>();

/** Per-bedIndex creation lock to prevent concurrent getOrCreate calls
 *  from React's StrictMode double-mount creating duplicate conversations. */
const creationLocks = new Map<number, boolean>();

/** Peek at an existing conversation without creating one. */
export function getExistingConversation(bedIndex: number): Conversation | null {
  const cached = store.get(bedIndex);
  if (!cached) return null;

  // Health check: if the conversation is in a permanently dead state
  // (disposed externally, room disconnected with max retries), evict it
  // so the next call creates a fresh one.
  const state = cached.conv.getState();
  if (state === 'disposed') {
    console.warn(`[ConversationStore] Evicting dead conversation for bed ${bedIndex} (state=disposed)`);
    store.delete(bedIndex);
    return null;
  }

  return cached.conv;
}

export function getOrCreatePatientConversation(
  bedIndex: number,
  patientCase: PatientCase,
  listeners: ConversationListeners
): Conversation {
  // Check for existing conversation with matching caseId
  const existing = store.get(bedIndex);
  if (existing && existing.caseId === patientCase.id) {
    // Health check before returning cached conversation
    const state = existing.conv.getState();
    if (state === 'disposed') {
      // Dead conversation — dispose and recreate
      console.warn(`[ConversationStore] Cached conversation for bed ${bedIndex} is disposed. Recreating.`);
      store.delete(bedIndex);
    } else {
      existing.conv.setListeners(listeners);
      return existing.conv;
    }
  }

  // A different patient now occupies this slot — tear down the old
  // conversation so the new persona isn't poisoned by prior history.
  if (existing) {
    existing.conv.dispose();
    store.delete(bedIndex);
  }

  // Creation lock — prevent concurrent creation from React StrictMode.
  // The first caller creates; subsequent callers within the same tick
  // will find the conversation already in the store.
  if (creationLocks.get(bedIndex)) {
    console.warn(`[ConversationStore] Creation lock active for bed ${bedIndex}. Waiting…`);
    // If the lock is set but there's already a conversation (from the
    // first call), return it. Otherwise we're in a race — the first
    // call hasn't finished synchronously, but the Conversation constructor
    // is synchronous, so the store entry should already exist.
    const justCreated = store.get(bedIndex);
    if (justCreated && justCreated.caseId === patientCase.id) {
      justCreated.conv.setListeners(listeners);
      return justCreated.conv;
    }
    // Fall through to creation — the lock was set but no conversation
    // was actually created (shouldn't happen, but be defensive).
  }

  creationLocks.set(bedIndex, true);

  try {
    const setting: 'polyclinic' | 'er' = bedIndex === -10 ? 'polyclinic' : 'er';
    const ctx = ensureAudioContext();
    // Speaker gender: pediatric → parent's gender, adult → patient's gender.
    const speakerGender: 'M' | 'F' = isPediatric(patientCase)
      ? parentGenderFor(patientCase)
      : patientCase.gender;
    const conv = new Conversation(ctx, listeners, {
      systemPrompt: buildPersona(patientCase, setting),
      initialMessage: buildInitialLine(patientCase),
      voiceGender: speakerGender,
      caseId: patientCase.id,
      age: patientCase.age,
      severity: patientCase.severity as 'stable' | 'urgent' | 'critical',
      storageKey: `conv_history_${patientCase.id}`,
    });
    store.set(bedIndex, { conv, caseId: patientCase.id });
    return conv;
  } finally {
    creationLocks.delete(bedIndex);
  }
}

export function disposePatientConversation(bedIndex: number) {
  const entry = store.get(bedIndex);
  if (entry) {
    entry.conv.dispose();
    store.delete(bedIndex);
  }
}

export function clearAllPatientConversations() {
  for (const entry of store.values()) entry.conv.dispose();
  store.clear();
  creationLocks.clear();
  if (sharedCtx) {
    try { sharedCtx.close(); } catch { /* noop */ }
    sharedCtx = null;
  }
}

/** Wipe ALL persisted patient chat history from localStorage so that on the
 *  next shift, every patient starts a fresh conversation. */
export function clearAllConversationStorage() {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('conv_history_')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage may be blocked — non-fatal
  }
}
