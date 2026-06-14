import type { Translator } from '../i18n/translate';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl+';

/** Display strings for the keyboard shortcut bound to each control (by action key). */
export const HINTS: Record<string, string> = {
  undo: `${MOD}Z`,
  redo: isMac ? '⌘⇧Z' : 'Ctrl+Shift+Z',
  delete: '⌫',
  center: `${MOD}Home`,
  mirror: ',',
  rotateCCW: '?',
  rotateCW: '/',
  variationPrev: '>',
  variationNext: '.',
  fillPrev: '⇧N',
  fillNext: 'N',
  selectPrev: '⇧⇥',
  selectNext: '⇥',
  copy: `${MOD}D`,
  symmetricDuplicate: isMac ? '⌘⇧D' : 'Ctrl+Shift+D',
  over: `${MOD}⇧]`,
  fingerspelling: 'F',
  mouthing: 'M',
  translate: 'T',
};

/** Tooltip text: the translated label plus its shortcut hint, e.g. "Undo (⌘Z)". */
export const tip = (t: Translator['t'], name: string): string =>
  HINTS[name] ? `${t(name)} (${HINTS[name]})` : t(name);

/** Briefly highlight a control button as if pressed (keyboard-triggered feedback). */
export function flashButton(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('is-pressed');
  window.setTimeout(() => el.classList.remove('is-pressed'), 150);
}
