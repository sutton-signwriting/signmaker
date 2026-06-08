import { create } from 'zustand';
import type { Alphabet } from '../lib/alphabet';
import { symbolSize } from '../lib/sign';

const hasSize = (key: string): boolean => symbolSize(key)[0] > 0;

interface PaletteState {
  source: Alphabet;
  group: string;
  base: string;
  lower: boolean;
  mirror: boolean;
  grid: string[][];

  init: (source: Alphabet) => void;
  select: (group?: string, base?: string, lower?: boolean) => void;
  click: (key: string) => void;
  top: () => void;
  toggleMirror: () => void;
}

export const usePaletteStore = create<PaletteState>((set, get) => ({
  source: {},
  group: '',
  base: '',
  lower: false,
  mirror: false,
  grid: [],

  init: (source) => {
    set({ source });
    get().select();
  },

  select: (group = '', base = '', lower = false) => {
    const source = get().source;
    let mirror = false;
    let grid: string[][];

    if (base && !lower) {
      mirror = hasSize(`${base.slice(0, 4)}08`) || hasSize(`${base.slice(0, 4)}18`);
      grid = Array.from({ length: 8 }, () => [] as string[]);
      for (let f = 0; f < 6; f++) for (let r = 0; r < 8; r++) grid[r].push(`${base.slice(0, 4)}${f}${r}`);
    } else if (base && lower) {
      mirror = true;
      grid = Array.from({ length: 8 }, () => [] as string[]);
      for (let f = 0; f < 6; f++)
        for (let r = 8; r < 16; r++) grid[r - 8].push(`${base.slice(0, 4)}${f}${r.toString(16)}`);
    } else {
      // Top level lists the groups; a selected group lists its symbols. Same 10-row layout.
      grid = Array.from({ length: 10 }, () => [] as string[]);
      const keys = group ? (source[group] ?? []) : Object.keys(source);
      keys.forEach((key, i) => grid[i % 10].push(key));
      for (let i = keys.length; i < 60; i++) grid[i % 10].push('');
    }

    set({ group, base, lower, mirror, grid });
  },

  click: (key) => {
    const { base, group, select } = get();
    if (base) return;
    if (group) select(group, key);
    else select(key);
  },

  top: () => get().select(),

  toggleMirror: () => {
    const { group, base, lower, select } = get();
    select(group, base, !lower);
  },
}));
