import { create } from 'zustand';
import type { Check } from '../lib/shortcuts';

// User-remapped shortcuts, keyed by registry id. Only overridden actions are stored; everything else
// falls back to its default binding (see `effective` in lib/shortcuts). Persisted so customizations
// survive reloads.
const KEY = 'signmaker-shortcuts';

const load = (): Record<string, Check[]> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};

const save = (overrides: Record<string, Check[]>): void => {
  if (Object.keys(overrides).length) localStorage.setItem(KEY, JSON.stringify(overrides));
  else localStorage.removeItem(KEY);
};

interface ShortcutState {
  overrides: Record<string, Check[]>;
  setBinding: (id: string, bindings: Check[]) => void;
  reset: (id: string) => void;
  resetAll: () => void;
}

export const useShortcutStore = create<ShortcutState>((set, get) => ({
  overrides: load(),
  setBinding: (id, bindings) => {
    const overrides = { ...get().overrides, [id]: bindings };
    save(overrides);
    set({ overrides });
  },
  reset: (id) => {
    const overrides = { ...get().overrides };
    delete overrides[id];
    save(overrides);
    set({ overrides });
  },
  resetAll: () => {
    save({});
    set({ overrides: {} });
  },
}));
