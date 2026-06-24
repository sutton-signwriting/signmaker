import { useEffect } from 'react';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { useSelectModeStore } from '../store/selectModeStore';
import { usePaletteStore } from '../store/paletteStore';
import { keyDown, keyUp, stopAllMoves, type Direction } from '../lib/arrowRepeat';
import { SHORTCUTS, flashButton, type Check } from '../lib/shortcuts';

// Suppress the browser default for keys that would otherwise act (Backspace → back nav, Tab → focus).
// The '/' default (Firefox quick-find) is already prevented by the rotate action, which matches it.
const PREVENT = [8, 9];
const ARROWS: Record<number, Direction> = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
// Palette-grid cursor deltas for select mode (row, col).
const GRID_MOVE: Record<number, [number, number]> = { 37: [0, -1], 38: [-1, 0], 39: [0, 1], 40: [1, 0] };

/** Map a digit keyCode to a palette row: 1–9 → rows 0–8, 0 → row 9. Returns -1 for non-digits. */
function digitRow(code: number): number {
  if (code >= 49 && code <= 57) return code - 49;
  if (code === 48) return 9;
  return -1;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

/** True when the event satisfies any of a shortcut's bindings (trigger char/keyCode + required modifiers). */
function matches(event: KeyboardEvent, bindings: Check[]): boolean {
  for (const check of bindings) {
    const trigger = check[0];
    const hit = typeof trigger === 'string' ? event.key === trigger : event.keyCode === trigger;
    if (!hit) continue;
    const mods = check.slice(1) as string[];
    if (mods.every((mod) => (event as unknown as Record<string, boolean>)[mod])) return true;
  }
  return false;
}

export function useKeyboard(): void {
  useEffect(() => {
    // Hold ⌘/Ctrl alone for a beat to reveal every tool's shortcut (a way to learn them).
    let learnTimer: number | undefined;
    const cancelLearn = () => {
      if (learnTimer !== undefined) {
        clearTimeout(learnTimer);
        learnTimer = undefined;
      }
      if (useUiStore.getState().learnShortcuts) useUiStore.getState().set({ learnShortcuts: false });
    };

    // Actions run on keydown — keyup doesn't fire for keys held with ⌘ on macOS, which broke
    // ⌘-shortcuts like center/undo/redo. Arrows repeat (the OS drives the cadence); others ignore repeats.
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      // A modal dialog owns its keys — let Escape close it natively, and don't run shortcuts behind it.
      if (document.querySelector('dialog[open]')) return;

      if (event.key === 'Meta' || event.key === 'Control') {
        // The modifier alone: arm the reveal. Any other key (below) cancels it and runs normally.
        if (!event.repeat && !event.shiftKey && !event.altKey && learnTimer === undefined) {
          learnTimer = window.setTimeout(() => {
            learnTimer = undefined;
            useUiStore.getState().set({ learnShortcuts: true });
          }, 1000);
        }
        return;
      }
      cancelLearn();

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
        else if (event.key === '<') {
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
      for (const sc of SHORTCUTS) {
        if (!sc.run || !matches(event, sc.bindings)) continue;
        sc.run(useSignStore.getState(), useUiStore.getState());
        if (sc.tool) flashButton(`tool-${sc.tool}`);
        event.preventDefault();
        return;
      }
      if (PREVENT.includes(event.keyCode)) event.preventDefault();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Meta' || event.key === 'Control') cancelLearn(); // releasing ⌘ hides the reveal
      // Process arrow keyups unconditionally — gating on focus could drop a keyup (e.g. refocused
      // into an input mid-press) and leave a key marked held.
      const dir = ARROWS[event.keyCode];
      if (dir) {
        keyUp(dir);
        event.preventDefault();
      }
    };

    const onBlur = () => {
      cancelLearn();
      stopAllMoves();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      cancelLearn();
    };
  }, []);
}
