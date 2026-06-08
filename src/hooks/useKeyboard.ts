import { useEffect } from 'react';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { startMove, stopMove, stopAllMoves, type Direction } from '../lib/arrowRepeat';
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
  mirror: [188],
  fillBack: [78, 'shiftKey'],
  fillNext: [78],
  recenter: [
    [36, 'ctrlKey'],
    [36, 'metaKey'],
  ],
};
const PREVENT = [8, 9, 191];
const ARROWS: Record<number, Direction> = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };

// Order = priority. `tool` is the control button id suffix to flash; null = no button.
const ACTIONS: { name: string; tool: string | null; run: (s: Store, ui: Ui) => void }[] = [
  { name: 'selectBack', tool: 'selectPrev', run: (s) => s.select(-1) },
  { name: 'selectNext', tool: 'selectNext', run: (s) => s.select(1) },
  { name: 'escape', tool: null, run: (_s, ui) => ui.set({ tab: ui.tab === 'more' ? '' : 'more' }) },
  { name: 'delete', tool: 'delete', run: (s) => s.remove() },
  { name: 'redo', tool: 'redo', run: (s) => s.redo() },
  { name: 'undo', tool: 'undo', run: (s) => s.undo() },
  { name: 'rotateBack', tool: 'rotateCCW', run: (s) => s.rotate(-1) },
  { name: 'rotateNext', tool: 'rotateCW', run: (s) => s.rotate(1) },
  { name: 'variationBack', tool: 'variationPrev', run: (s) => s.variation(-1) },
  { name: 'variationNext', tool: 'variationNext', run: (s) => s.variation(1) },
  { name: 'mirror', tool: 'mirror', run: (s) => s.mirror() },
  { name: 'fillBack', tool: 'fillPrev', run: (s) => s.fill(-1) },
  { name: 'fillNext', tool: 'fillNext', run: (s) => s.fill(1) },
  { name: 'recenter', tool: 'center', run: (s) => s.center() },
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
      const dir = ARROWS[event.keyCode];
      if (dir) {
        startMove(dir, event.shiftKey);
        event.preventDefault();
        return;
      }
      if (event.repeat) return;
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
      const dir = ARROWS[event.keyCode];
      if (dir && !isTyping(event.target)) {
        stopMove(dir);
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
