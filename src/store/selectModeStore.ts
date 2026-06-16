import { create } from 'zustand';
import { usePaletteStore } from './paletteStore';
import { useSignStore } from './signStore';
import { activateSymbol } from '../lib/palette';

/**
 * Keyboard "select" mode (toggled with S): a cursor roams the symbol palette with the arrow keys,
 * Enter (or a digit) activates a cell — drilling into a category or, on a leaf, dropping it at the
 * canvas center and exiting. Left at the first column / Up at the first row steps back a level.
 */
interface SelectModeState {
  active: boolean;
  row: number;
  col: number;

  start: () => void;
  exit: () => void;
  move: (dr: number, dc: number) => void;
  back: () => void;
  enterRow: (row: number) => void;
  press: () => void;
}

export const useSelectModeStore = create<SelectModeState>((set, get) => ({
  active: false,
  row: 0,
  col: 0,

  start: () => {
    useSignStore.getState().selnone(); // entering select mode clears the canvas selection
    set({ active: true, row: 0, col: 0 }); // continue from wherever the palette already is
  },

  exit: () => set({ active: false }),

  move: (dr, dc) => {
    const palette = usePaletteStore.getState();
    const grid = palette.grid;
    if (!grid.length) return;
    const { row, col } = get();
    const notTop = !!(palette.group || palette.base);
    // At the top/left edge, an outward move steps back up the palette hierarchy instead.
    if (notTop && ((dc === -1 && col === 0) || (dr === -1 && row === 0))) {
      get().back();
      return;
    }
    const nr = Math.max(0, Math.min(grid.length - 1, row + dr));
    const nc = Math.max(0, Math.min((grid[nr]?.length ?? 1) - 1, col + dc));
    set({ row: nr, col: nc });
  },

  back: () => {
    const { group, base, select } = usePaletteStore.getState();
    if (base) select(group);
    else if (group) select();
    else return;
    set({ row: 0, col: 0 });
  },

  // A digit jumps to that category and activates it — same as moving there and pressing Enter.
  enterRow: (row) => {
    if (row < 0 || row >= usePaletteStore.getState().grid.length) return;
    set({ row, col: 0 });
    get().press();
  },

  press: () => {
    const key = usePaletteStore.getState().grid[get().row]?.[get().col];
    if (!key) return;
    if (activateSymbol(key)) {
      // Leaf added — return the palette to the top and leave select mode.
      usePaletteStore.getState().top();
      set({ active: false, row: 0, col: 0 });
    } else {
      set({ row: 0, col: 0 }); // drilled into a submenu — reset the cursor
    }
  },
}));
