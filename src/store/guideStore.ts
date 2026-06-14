import { create } from 'zustand';
import type { Seg } from '../lib/snap';

/** Active guides (symbol coordinates) shown while dragging or arrow-moving: full-span alignment
 *  lines (x/y) and dotted symmetry connectors (sym). */
interface GuideState {
  x: number[];
  y: number[];
  sym: Seg[];
  set: (g: { x: number[]; y: number[]; sym: Seg[] }) => void;
  clear: () => void;
}

const EMPTY = { x: [], y: [], sym: [] };

export const useGuideStore = create<GuideState>((set) => ({
  ...EMPTY,
  set: (g) => set(g),
  clear: () => set(EMPTY),
}));
