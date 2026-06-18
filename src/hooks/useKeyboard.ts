import { useEffect } from 'react';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { useLangStore } from '../store/langStore';
import { useToolStore } from '../store/toolStore';
import { useSelectModeStore } from '../store/selectModeStore';
import { usePaletteStore } from '../store/paletteStore';
import { mouthingSupported } from '../i18n/languageNames';
import { keyDown, keyUp, stopAllMoves, type Direction } from '../lib/arrowRepeat';
import { flashButton } from '../lib/shortcuts';

type Store = ReturnType<typeof useSignStore.getState>;
type Ui = ReturnType<typeof useUiStore.getState>;
type Check = [number, ...string[]];

const keyboard: Record<string, Check | Check[]> = {
  selectBack: [9, 'shiftKey'],
  selectNext: [9],
  escape: [27],
  delete: [[8], [46]],
  redo: [
    [90, 'shiftKey', 'ctrlKey'],
    [90, 'shiftKey', 'metaKey'],
    [89, 'ctrlKey'],
    [89, 'metaKey'],
  ],
  undo: [
    [90, 'ctrlKey'],
    [90, 'metaKey'],
  ],
  rotateBack: [191, 'shiftKey'],
  rotateNext: [191],
  variationBack: [190, 'shiftKey'],
  variationNext: [190],
  paletteMirror: [188, 'shiftKey'],
  mirror: [188],
  fillBack: [78, 'shiftKey'],
  fillNext: [78],
  recenter: [
    [36, 'ctrlKey'],
    [36, 'metaKey'],
  ],
  symmetricDuplicate: [
    [68, 'shiftKey', 'metaKey'],
    [68, 'shiftKey', 'ctrlKey'],
  ],
  duplicate: [
    [68, 'metaKey'],
    [68, 'ctrlKey'],
  ],
  bringFront: [
    [221, 'shiftKey', 'metaKey'],
    [221, 'shiftKey', 'ctrlKey'],
  ],
  sendBack: [
    [219, 'shiftKey', 'metaKey'],
    [219, 'shiftKey', 'ctrlKey'],
  ],
  selectAll: [
    [65, 'metaKey'],
    [65, 'ctrlKey'],
  ],
  export: [
    [83, 'metaKey'],
    [83, 'ctrlKey'],
  ],
  fingerspelling: [70],
  mouthing: [77],
  translate: [84],
};
const PREVENT = [8, 9, 191];
const ARROWS: Record<number, Direction> = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
// Palette-grid cursor deltas for select mode (row, col).
const GRID_MOVE: Record<number, [number, number]> = { 37: [0, -1], 38: [-1, 0], 39: [0, 1], 40: [1, 0] };

/** Map a digit keyCode to a palette row: 1–9 → rows 0–8, 0 → row 9. Returns -1 for non-digits. */
function digitRow(code: number): number {
  if (code >= 49 && code <= 57) return code - 49;
  if (code === 48) return 9;
  return -1;
}

// Order = priority. `tool` is the control button id suffix to flash; null = no button.
const ACTIONS: { name: string; tool: string | null; run: (s: Store, ui: Ui) => void }[] = [
  { name: 'selectBack', tool: 'selectPrev', run: (s) => s.select(-1) },
  { name: 'selectNext', tool: 'selectNext', run: (s) => s.select(1) },
  { name: 'escape', tool: null, run: (s) => s.selnone() },
  { name: 'delete', tool: 'delete', run: (s) => s.remove() },
  { name: 'redo', tool: 'redo', run: (s) => s.redo() },
  { name: 'undo', tool: 'undo', run: (s) => s.undo() },
  { name: 'rotateBack', tool: 'rotateCCW', run: (s) => s.rotate(-1) },
  { name: 'rotateNext', tool: 'rotateCW', run: (s) => s.rotate(1) },
  { name: 'variationBack', tool: 'variationPrev', run: (s) => s.variation(-1) },
  { name: 'variationNext', tool: 'variationNext', run: (s) => s.variation(1) },
  {
    name: 'paletteMirror',
    tool: null,
    run: () => {
      const p = usePaletteStore.getState();
      if (p.mirror) p.toggleMirror();
    },
  },
  { name: 'mirror', tool: 'mirror', run: (s) => s.mirror() },
  { name: 'fillBack', tool: 'fillPrev', run: (s) => s.fill(-1) },
  { name: 'fillNext', tool: 'fillNext', run: (s) => s.fill(1) },
  { name: 'recenter', tool: 'center', run: (s) => s.center() },
  { name: 'symmetricDuplicate', tool: 'symmetric', run: (s) => s.symmetricDuplicate() },
  { name: 'duplicate', tool: 'copy', run: (s) => s.copy() },
  { name: 'bringFront', tool: 'over', run: (s) => s.over() },
  { name: 'sendBack', tool: null, run: (s) => s.under() },
  { name: 'selectAll', tool: null, run: (s) => s.selectAll() },
  { name: 'export', tool: 'export', run: (_s, ui) => ui.set({ tab: 'png' }) },
  {
    name: 'fingerspelling',
    tool: null,
    run: () => {
      if (useLangStore.getState().signed) useToolStore.getState().setOpen('fingerspelling');
    },
  },
  {
    name: 'mouthing',
    tool: null,
    run: () => {
      const { spoken } = useLangStore.getState();
      if (spoken && mouthingSupported(spoken)) useToolStore.getState().setOpen('mouthing');
    },
  },
  {
    name: 'translate',
    tool: null,
    run: () => {
      const { signed, spoken } = useLangStore.getState();
      if (signed && spoken) useToolStore.getState().setOpen('translate');
    },
  },
];

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

function matches(event: KeyboardEvent, name: string): boolean {
  if (isTyping(event.target)) return false;
  const code = event.keyCode;
  let checks = keyboard[name];
  if (!Array.isArray(checks[0])) checks = [checks as Check];
  for (const check of checks as Check[]) {
    if (check[0] !== code) continue;
    const mods = check.slice(1) as string[];
    if (mods.every((mod) => (event as unknown as Record<string, boolean>)[mod])) return true;
  }
  return false;
}

export function useKeyboard(): void {
  useEffect(() => {
    // Actions run on keydown — keyup doesn't fire for keys held with ⌘ on macOS, which broke
    // ⌘-shortcuts like recenter/undo/redo. Arrows repeat (startMove dedupes); others ignore repeats.
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      // A modal dialog owns its keys — let Escape close it natively, and don't run shortcuts behind it.
      if (document.querySelector('dialog[open]')) return;

      const select = useSelectModeStore.getState();
      if (select.active) {
        // Select mode: the arrow keys drive the palette cursor; other shortcuts are suppressed.
        const grid = GRID_MOVE[event.keyCode];
        if (grid) {
          select.move(grid[0], grid[1]);
          event.preventDefault();
          return;
        }
        if (event.repeat) return;
        if (event.keyCode === 13 || event.keyCode === 32) select.press(); // Enter / Space
        else if (event.keyCode === 8) select.back(); // Backspace steps up a level
        else if (event.keyCode === 27 || event.keyCode === 83) select.exit(); // Escape / S toggles off
        else if (event.keyCode === 188 && event.shiftKey) {
          const p = usePaletteStore.getState(); // Shift+, flips the palette, same as outside select mode
          if (p.mirror) p.toggleMirror();
        } else {
          const row = digitRow(event.keyCode);
          if (row >= 0) select.enterRow(row);
        }
        event.preventDefault();
        return;
      }

      const dir = ARROWS[event.keyCode];
      if (dir) {
        // Arrows nudge the selection; the OS drives the repeat cadence (one move, pause, then fast).
        // With nothing selected the pad is inert (but still no page scroll).
        if (useSignStore.getState().list.some((s) => s.selected)) keyDown(dir, event.shiftKey);
        event.preventDefault();
        return;
      }
      if (event.repeat) return;
      if (event.keyCode === 83 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        useSelectModeStore.getState().start();
        event.preventDefault();
        return;
      }
      for (const action of ACTIONS) {
        if (!matches(event, action.name)) continue;
        action.run(useSignStore.getState(), useUiStore.getState());
        if (action.tool) flashButton(`tool-${action.tool}`);
        event.preventDefault();
        return;
      }
      if (PREVENT.includes(event.keyCode)) event.preventDefault();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      // Process arrow keyups unconditionally — gating on focus could drop a keyup (e.g. refocused
      // into an input mid-press) and leave a key marked held.
      const dir = ARROWS[event.keyCode];
      if (dir) {
        keyUp(dir);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', stopAllMoves);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', stopAllMoves);
    };
  }, []);
}
