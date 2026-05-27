import { useSyncExternalStore } from 'react';

export function create<T>(getSnapshot: () => T, subscribe: (fn: () => void) => () => void) {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
