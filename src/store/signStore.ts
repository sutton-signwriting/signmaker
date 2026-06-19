import { create } from 'zustand';
import * as sign from '../lib/sign';
import type { Signbox, Sym } from '../lib/sign';

const INITIAL_HISTORY = '{"list":[],"sort":[]';

/** Valid SignWriting symbol-coordinate range (the 500-unit lane centered on 500). */
export const COORD_MIN = 250;
export const COORD_MAX = 749;

/** Clamp a symbol's anchor so its whole body (anchor + size) stays inside the 250–749 lane. */
function clampPos(key: string, x: number, y: number): { x: number; y: number } {
  const [w, h] = sign.symbolSize(key);
  return {
    x: Math.max(COORD_MIN, Math.min(COORD_MAX - w, Math.round(x))),
    y: Math.max(COORD_MIN, Math.min(COORD_MAX - h, Math.round(y))),
  };
}

const snapshot = (list: Sym[], sort: string[]): string =>
  JSON.stringify({
    list: list.map((s) => ({ key: s.key, x: s.x, y: s.y, selected: false })),
    sort,
  });

interface SignState {
  signbox: Signbox;
  list: Sym[];
  sort: string[];
  history: string[];
  cursor: number;
  /** Bumped whenever a change is committed to history — drives URL sync. */
  revision: number;

  fswlive: () => string;
  fswnorm: () => string;
  swulive: () => string;
  swunorm: () => string;

  addhistory: () => void;
  setFromFsw: (fsw: string) => void;
  setFromSwu: (swu: string) => void;
  addSign: (fsw: string) => void;

  add: (symbol?: { key: string; x: number; y: number }) => void;
  addSeq: (key: string, position: number) => void;
  selnone: () => void;
  selectAll: () => void;
  selectOnly: (index: number) => void;
  selectIndices: (indices: number[]) => void;
  select: (step: number) => void;
  copy: () => void;
  symmetricDuplicate: () => void;
  remove: () => void;
  clear: () => void;
  reorderSeq: (from: number, to: number) => void;
  removeSeq: (index: number) => void;
  variation: (step: number) => void;
  mirror: () => void;
  fill: (step: number) => void;
  rotate: (step: number) => void;
  over: () => void;
  under: () => void;
  move: (x: number, y: number) => void;
  nudge: (x: number, y: number) => void;
  commit: () => void;
  moveSymbol: (index: number, dx: number, dy: number) => void;
  center: () => void;
  undo: () => void;
  redo: () => void;
}

export const useSignStore = create<SignState>((set, get) => ({
  signbox: 'M',
  list: [],
  sort: [],
  history: [INITIAL_HISTORY],
  cursor: 0,
  revision: 0,

  fswlive: () => sign.fswlive(get().signbox, get().sort, get().list),
  fswnorm: () => sign.fswnorm(get().signbox, get().sort, get().list),
  swulive: () => sign.swulive(get().signbox, get().sort, get().list),
  swunorm: () => sign.swunorm(get().signbox, get().sort, get().list),

  addhistory: () => {
    const { list, sort, history, cursor } = get();
    const next = snapshot(list, sort);
    if (next === history[cursor]) return;
    const trimmed = history.slice(0, cursor + 1);
    trimmed.push(next);
    set({ history: trimmed, cursor: cursor + 1, revision: get().revision + 1 });
  },

  setFromFsw: (fsw) => {
    const { signbox, symbols, sort } = sign.parseSign(fsw);
    set({ signbox, list: symbols, sort });
    get().addhistory();
    get().selnone();
  },

  setFromSwu: (swu) => {
    get().setFromFsw(sign.swu2fsw(swu));
  },

  // Merge another sign's symbols into the current one (dropping its box marker) and select them.
  addSign: (fsw) => {
    const { symbols } = sign.parseSign(fsw);
    if (!symbols.length) return;
    const existing = get().list.map((s) => ({ ...s, selected: false }));
    const added = symbols.map((s) => ({ key: s.key, ...clampPos(s.key, s.x, s.y), selected: true }));
    set({ list: [...existing, ...added] });
    get().addhistory();
  },

  add: (symbol) => {
    get().selnone();
    if (symbol) {
      const { x, y } = clampPos(symbol.key, symbol.x, symbol.y);
      set({ list: [...get().list, { key: symbol.key, x, y, selected: true }] });
    }
    get().addhistory();
  },

  addSeq: (key, position) => {
    const sort = [...get().sort];
    sort.splice(position, 0, key);
    set({ sort });
    get().addhistory();
  },

  // Keep the reference of any symbol whose selected flag doesn't change, so memoized symbols that
  // weren't (de)selected skip re-rendering — selection stays O(changed), not O(list).
  selnone: () => set({ list: get().list.map((s) => (s.selected ? { ...s, selected: false } : s)) }),

  selectAll: () => set({ list: get().list.map((s) => (s.selected ? s : { ...s, selected: true })) }),

  selectOnly: (index) =>
    set({ list: get().list.map((s, i) => (s.selected === (i === index) ? s : { ...s, selected: i === index })) }),

  selectIndices: (indices) => {
    const chosen = new Set(indices);
    set({ list: get().list.map((s, i) => (s.selected === chosen.has(i) ? s : { ...s, selected: chosen.has(i) })) });
  },

  select: (step) => {
    const list = get().list;
    if (!list.length) return;
    let sel = 0;
    list.forEach((s, i) => {
      if (s.selected) sel = i;
    });
    sel += step;
    if (sel < 0) sel = list.length - 1;
    if (sel >= list.length) sel = 0;
    get().selectOnly(sel);
  },

  copy: () => {
    const list = get().list;
    const copies = list
      .filter((s) => s.selected)
      .map((s) => ({ key: s.key, ...clampPos(s.key, s.x + 10, s.y + 10), selected: true }));
    if (!copies.length) return;
    // Deselect the originals and select the new copies so they can be moved as a group.
    set({ list: [...list.map((s) => ({ ...s, selected: false })), ...copies] });
    get().addhistory();
  },

  symmetricDuplicate: () => {
    const list = get().list;
    const copies = list
      .filter((s) => s.selected)
      .map((s) => {
        // Mirror the glyph and reflect it across the center axis (x=500), keeping the same height.
        const key = sign.mirror(s.key);
        const [w] = sign.symbolSize(key);
        return { key, ...clampPos(key, 1000 - s.x - w, s.y), selected: true };
      });
    if (!copies.length) return;
    set({ list: [...list.map((s) => ({ ...s, selected: false })), ...copies] });
    get().addhistory();
  },

  remove: () => {
    set({ list: get().list.filter((s) => !s.selected) });
    get().addhistory();
  },

  clear: () => {
    set({ list: [], sort: [] });
    get().addhistory();
  },

  reorderSeq: (from, to) => {
    const sort = [...get().sort];
    if (from >= sort.length) return;
    if (from !== to) {
      sort.splice(to, 0, sort.splice(from, 1)[0]);
    } else {
      sort.splice(from, 1);
    }
    set({ sort });
    get().addhistory();
  },

  removeSeq: (index) => {
    const sort = [...get().sort];
    sort.splice(index, 1);
    set({ sort });
    get().addhistory();
  },

  variation: (step) => {
    set({ list: get().list.map((s) => (s.selected ? { ...s, key: sign.scroll(s.key, step) } : s)) });
    get().addhistory();
  },

  mirror: () => {
    const list = get().list;
    const selected = list.filter((s) => s.selected);
    if (!selected.length) return;
    // Reflect each selected symbol's glyph box across the selection's horizontal center, so a
    // multi-symbol selection mirrors as a group (a single symbol just flips in place).
    let minX = Infinity;
    let maxX = -Infinity;
    for (const s of selected) {
      const [w] = sign.symbolSize(s.key);
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x + w);
    }
    set({
      list: list.map((s) => {
        if (!s.selected) return s;
        const key = sign.mirror(s.key);
        const [w] = sign.symbolSize(s.key);
        return { ...s, key, ...clampPos(key, minX + maxX - s.x - w, s.y) };
      }),
    });
    get().addhistory();
  },

  fill: (step) => {
    set({ list: get().list.map((s) => (s.selected ? { ...s, key: sign.fill(s.key, step) } : s)) });
    get().addhistory();
  },

  rotate: (step) => {
    const list = get().list;
    const selected = list.filter((s) => s.selected);
    if (!selected.length) return;
    // Rotate the selection's bounding box by 45° about its center: each symbol's glyph rotates
    // and (for a multi-symbol selection) its position rotates around the center too.
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of selected) {
      const [w, h] = sign.symbolSize(s.key);
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + w);
      maxY = Math.max(maxY, s.y + h);
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const angle = (step > 0 ? 1 : -1) * (Math.PI / 4);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    set({
      list: list.map((s) => {
        if (!s.selected) return s;
        const [w, h] = sign.symbolSize(s.key);
        const dx = s.x + w / 2 - cx;
        const dy = s.y + h / 2 - cy;
        const key = sign.rotate(s.key, step);
        // Place so the rotated glyph's center lands on the rotated point — use the NEW size,
        // since rotation changes the symbol's dimensions (otherwise it pivots off-center).
        const [nw, nh] = sign.symbolSize(key);
        const nx = cx + dx * cos - dy * sin - nw / 2;
        const ny = cy + dx * sin + dy * cos - nh / 2;
        return { ...s, key, ...clampPos(key, nx, ny) };
      }),
    });
    get().addhistory();
  },

  over: () => {
    const selected = get().list.filter((s) => s.selected);
    const rest = get().list.filter((s) => !s.selected);
    set({ list: [...rest, ...selected.map((s) => ({ ...s, selected: true }))] });
    get().addhistory();
  },

  under: () => {
    const selected = get().list.filter((s) => s.selected);
    const rest = get().list.filter((s) => !s.selected);
    set({ list: [...selected.map((s) => ({ ...s, selected: true })), ...rest] });
    get().addhistory();
  },

  nudge: (x, y) => {
    set({ list: get().list.map((s) => (s.selected ? { ...s, ...clampPos(s.key, s.x + x, s.y + y) } : s)) });
  },

  commit: () => get().addhistory(),

  move: (x, y) => {
    get().nudge(x, y);
    get().addhistory();
  },

  moveSymbol: (index, dx, dy) => {
    set({ list: get().list.map((s, i) => (i === index ? { ...s, ...clampPos(s.key, s.x + dx, s.y + dy) } : s)) });
    get().addhistory();
  },

  center: () => {
    get().setFromFsw(get().fswnorm());
  },

  undo: () => {
    const { cursor, history } = get();
    if (cursor <= 0) return;
    const restored = JSON.parse(history[cursor - 1]) as { list: Sym[]; sort: string[] };
    set({
      cursor: cursor - 1,
      list: restored.list.map((s) => ({ ...s, selected: false })),
      sort: restored.sort,
      revision: get().revision + 1,
    });
  },

  redo: () => {
    const { cursor, history } = get();
    if (cursor + 1 >= history.length) return;
    const restored = JSON.parse(history[cursor + 1]) as { list: Sym[]; sort: string[] };
    set({
      cursor: cursor + 1,
      list: restored.list.map((s) => ({ ...s, selected: false })),
      sort: restored.sort,
      revision: get().revision + 1,
    });
  },
}));
