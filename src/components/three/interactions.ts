import { create } from './createStore';

export interface Interactable {
  id: string;
  position: [number, number, number];
  radius: number;
  prompt: string;
  kind: 'desk' | 'bed' | 'triage';
  bedIndex?: number;
}

interface InteractionState {
  interactables: Map<string, Interactable>;
  activeId: string | null;
}

const state: InteractionState = {
  interactables: new Map(),
  activeId: null,
};

const subs = new Set<() => void>();
const notify = () => subs.forEach((fn) => fn());

export const interactionBus = {
  register(i: Interactable) {
    state.interactables.set(i.id, i);
  },
  unregister(id: string) {
    state.interactables.delete(id);
    if (state.activeId === id) {
      state.activeId = null;
      notify();
    }
  },
  getAll() {
    return Array.from(state.interactables.values());
  },
  setActive(id: string | null) {
    if (state.activeId !== id) {
      state.activeId = id;
      notify();
    }
  },
  getActive(): Interactable | null {
    return state.activeId ? state.interactables.get(state.activeId) ?? null : null;
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};

export const useActiveInteractable = () => create(() => interactionBus.getActive(), interactionBus.subscribe);
