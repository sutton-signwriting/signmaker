import type { Translator } from '../i18n/translate';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { useLangStore } from '../store/langStore';
import { useToolStore } from '../store/toolStore';
import { usePaletteStore } from '../store/paletteStore';
import { useShortcutStore } from '../store/shortcutStore';
import { mouthingSupported } from '../i18n/languageNames';

type SignState = ReturnType<typeof useSignStore.getState>;
type UiState = ReturnType<typeof useUiStore.getState>;

// A binding is [trigger, ...requiredModifiers]. The trigger is a keyCode (number) for layout-independent
// physical keys (Tab, Enter, arrows, …) or a printed character (string) matched against event.key — see
// the comment in useKeyboard for why punctuation must match the character, not the US keyCode.
export type Check = [number | string, ...string[]];

/**
 * Central registry of every keyboard shortcut. One entry per action is the single source of truth for
 * its bindings, its display label, the toolbar button it flashes, and the action it runs — consumed by
 * the keyboard handler (matching + dispatch), the tooltips (`tip`), and the hold-⌘ shortcut list.
 *
 * Order is matching priority: more specific combos first (e.g. redo before undo, symmetricDuplicate
 * before duplicate), since a check only requires its listed modifiers to be present, not others absent.
 */
export interface Shortcut {
  id: string;
  label: string; // i18n key
  bindings: Check[];
  tool?: string; // toolbar button id suffix to flash (tool-<tool>)
  run?: (s: SignState, ui: UiState) => void; // omitted for entries handled outside the generic matcher
  keys?: string; // explicit display string for shortcuts the matcher doesn't drive (arrows, select mode)
}

export const SHORTCUTS: Shortcut[] = [
  { id: 'selectPrev', label: 'selectPrev', bindings: [[9, 'shiftKey']], tool: 'selectPrev', run: (s) => s.select(-1) },
  { id: 'selectNext', label: 'selectNext', bindings: [[9]], tool: 'selectNext', run: (s) => s.select(1) },
  { id: 'deselect', label: 'deselect', bindings: [[27]], run: (s) => s.selnone() },
  { id: 'delete', label: 'delete', bindings: [[8], [46]], tool: 'delete', run: (s) => s.remove() },
  {
    id: 'redo',
    label: 'redo',
    bindings: [
      [90, 'shiftKey', 'ctrlKey'],
      [90, 'shiftKey', 'metaKey'],
      [89, 'ctrlKey'],
      [89, 'metaKey'],
    ],
    tool: 'redo',
    run: (s) => s.redo(),
  },
  { id: 'undo', label: 'undo', bindings: [[90, 'ctrlKey'], [90, 'metaKey']], tool: 'undo', run: (s) => s.undo() },
  { id: 'rotateCCW', label: 'rotateCCW', bindings: [['?']], tool: 'rotateCCW', run: (s) => s.rotate(-1) },
  { id: 'rotateCW', label: 'rotateCW', bindings: [['/']], tool: 'rotateCW', run: (s) => s.rotate(1) },
  { id: 'variationPrev', label: 'variationPrev', bindings: [['>']], tool: 'variationPrev', run: (s) => s.variation(-1) },
  { id: 'variationNext', label: 'variationNext', bindings: [['.']], tool: 'variationNext', run: (s) => s.variation(1) },
  {
    id: 'paletteMirror',
    label: 'flipPalette',
    bindings: [['<']],
    run: () => {
      const p = usePaletteStore.getState();
      if (p.mirror) p.toggleMirror();
    },
  },
  { id: 'mirror', label: 'mirror', bindings: [[',']], tool: 'mirror', run: (s) => s.mirror() },
  { id: 'fillPrev', label: 'fillPrev', bindings: [['N']], tool: 'fillPrev', run: (s) => s.fill(-1) },
  { id: 'fillNext', label: 'fillNext', bindings: [['n']], tool: 'fillNext', run: (s) => s.fill(1) },
  { id: 'center', label: 'center', bindings: [[36, 'ctrlKey'], [36, 'metaKey']], tool: 'center', run: (s) => s.center() },
  {
    id: 'symmetricDuplicate',
    label: 'symmetricDuplicate',
    bindings: [
      [68, 'shiftKey', 'metaKey'],
      [68, 'shiftKey', 'ctrlKey'],
    ],
    tool: 'symmetric',
    run: (s) => s.symmetricDuplicate(),
  },
  { id: 'copy', label: 'duplicate', bindings: [[68, 'metaKey'], [68, 'ctrlKey']], tool: 'copy', run: (s) => s.copy() },
  {
    id: 'over',
    label: 'bringToFront',
    bindings: [['}', 'metaKey'], ['}', 'ctrlKey']],
    tool: 'over',
    run: (s) => s.over(),
  },
  { id: 'under', label: 'sendToBack', bindings: [['{', 'metaKey'], ['{', 'ctrlKey']], run: (s) => s.under() },
  { id: 'selectAll', label: 'selectAll', bindings: [[65, 'metaKey'], [65, 'ctrlKey']], run: (s) => s.selectAll() },
  { id: 'export', label: 'export', bindings: [[83, 'metaKey'], [83, 'ctrlKey']], tool: 'export', run: (_s, ui) => ui.set({ tab: 'png' }) },
  {
    id: 'fingerspelling',
    label: 'fingerspelling',
    bindings: [[70]],
    run: () => {
      if (useLangStore.getState().signed) useToolStore.getState().setOpen('fingerspelling');
    },
  },
  {
    id: 'mouthing',
    label: 'mouthing',
    bindings: [[77]],
    run: () => {
      const { spoken } = useLangStore.getState();
      if (spoken && mouthingSupported(spoken)) useToolStore.getState().setOpen('mouthing');
    },
  },
  {
    id: 'translate',
    label: 'translate',
    bindings: [[84]],
    run: () => {
      const { signed, spoken } = useLangStore.getState();
      if (signed && spoken) useToolStore.getState().setOpen('translate');
    },
  },
  // Display-only entries: handled by dedicated code in useKeyboard, listed here so the registry is the
  // complete catalogue of shortcuts.
  { id: 'move', label: 'moveSelection', bindings: [], keys: '↑ ↓ ← →' },
  { id: 'select', label: 'select', bindings: [], keys: 'S' },
];

const byId = new Map(SHORTCUTS.map((sc) => [sc.id, sc]));

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const SPECIAL: Record<number, string> = { 8: '⌫', 9: '⇥', 13: '⏎', 27: 'Esc', 32: 'Space', 36: '⌂', 46: 'Del', 37: '←', 38: '↑', 39: '→', 40: '↓' };

const keyLabel = (trigger: number | string): string => {
  if (typeof trigger === 'number') return SPECIAL[trigger] ?? String.fromCharCode(trigger);
  return /^[a-z]$/.test(trigger) ? trigger.toUpperCase() : trigger; // 'n' → 'N'; '?', 'N' kept as-is
};

/** Format one binding for display, e.g. [90,'metaKey'] → "⌘Z", ['?'] → "?", ['N'] → "⇧N". */
function formatBinding(binding: Check): string {
  const trigger = binding[0];
  const mods = new Set(binding.slice(1) as string[]);
  if (typeof trigger === 'string' && /^[A-Z]$/.test(trigger)) mods.add('shiftKey'); // uppercase char ⇒ Shift
  let out = '';
  if (mods.has('metaKey')) out += isMac ? '⌘' : 'Ctrl+';
  else if (mods.has('ctrlKey')) out += isMac ? '⌃' : 'Ctrl+';
  if (mods.has('shiftKey')) out += isMac ? '⇧' : 'Shift+';
  if (mods.has('altKey')) out += isMac ? '⌥' : 'Alt+';
  return out + keyLabel(trigger);
}

/** A shortcut's active bindings: the user's override if set, otherwise the registry default. */
export function effectiveBindings(id: string): Check[] {
  return useShortcutStore.getState().overrides[id] ?? byId.get(id)?.bindings ?? [];
}

/** Whether the registry knows this shortcut and the user can remap it (it drives an action). */
export const isCustomizable = (id: string): boolean => !!byId.get(id)?.run;

/** The display string for a shortcut: an explicit `keys`, or the platform-preferred active binding. */
export function shortcutKeys(id: string): string {
  const sc = byId.get(id);
  if (!sc) return '';
  if (sc.keys !== undefined) return sc.keys;
  const bindings = effectiveBindings(id);
  if (!bindings.length) return '';
  const preferred = bindings.find((b) => b.includes(isMac ? 'metaKey' : 'ctrlKey')) ?? bindings[0];
  return formatBinding(preferred);
}

/** Tooltip text: the translated label plus its shortcut, e.g. "Undo (⌘Z)". */
export function tip(t: Translator['t'], id: string): string {
  const sc = byId.get(id);
  if (!sc) return id;
  const keys = shortcutKeys(id);
  return keys ? `${t(sc.label)} (${keys})` : t(sc.label);
}

/** Convert a recorded keydown into a binding. Returns null for a lone modifier (keep listening).
 *  Printable keys store the character (layout-independent); named keys store their keyCode. */
export function eventToBinding(event: KeyboardEvent): Check | null {
  if (['Meta', 'Control', 'Shift', 'Alt'].includes(event.key)) return null;
  const printable = event.key.length === 1;
  const mods: string[] = [];
  if (event.metaKey) mods.push('metaKey');
  if (event.ctrlKey) mods.push('ctrlKey');
  if (event.shiftKey && !printable) mods.push('shiftKey'); // a printable char already encodes Shift
  if (event.altKey) mods.push('altKey');
  return [printable ? event.key : event.keyCode, ...mods];
}

/** Briefly highlight a control button as if pressed (keyboard-triggered feedback). */
export function flashButton(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('is-pressed');
  window.setTimeout(() => el.classList.remove('is-pressed'), 150);
}
