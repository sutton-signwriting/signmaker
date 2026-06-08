import { useSignStore } from '../store/signStore';
import { useUiStore, UI_DEFAULTS, type Skin, type Tab, type UiState } from '../store/uiStore';
import { parseHash, pushHash } from './url';

export const isIframe = typeof window !== 'undefined' && window.location !== window.parent.location;

/** Apply an incoming state object (URL hash, postMessage, or demo controls) — port of legacy setS. */
export function applyState(obj: Record<string, unknown>): void {
  const sign = useSignStore.getState();
  const patch: Partial<UiState> = {};
  for (const [key, raw] of Object.entries(obj)) {
    const value = raw == null ? '' : String(raw);
    switch (key) {
      case 'ui':
        patch.ui = value || 'en';
        break;
      case 'alphabet':
        patch.alphabet = value;
        break;
      case 'fsw':
        sign.setFromFsw(value);
        break;
      case 'swu':
        sign.setFromSwu(decodeURI(value));
        break;
      case 'styling':
        patch.styling = value;
        break;
      case 'charsets':
        patch.charsets = value;
        break;
      case 'grid':
        patch.grid = value as UiState['grid'];
        break;
      case 'skin':
        patch.skin = value as Skin;
        break;
      case 'tab':
        patch.tab = value as Tab;
        break;
    }
  }
  if (Object.keys(patch).length) useUiStore.getState().set(patch);
}

export function currentParams(): Record<string, string> {
  const ui = useUiStore.getState();
  const sign = useSignStore.getState();
  const params: Record<string, string> = {
    ui: ui.ui,
    alphabet: ui.alphabet,
    fsw: sign.fswnorm(),
    charsets: ui.charsets,
    styling: ui.styling,
    grid: ui.grid,
    skin: ui.skin,
    tab: ui.tab,
  };
  if (ui.charsets) params.swu = sign.swunorm();
  return params;
}

export function save(): void {
  const sign = useSignStore.getState();
  if (isIframe) {
    window.parent.postMessage(
      { signmaker: 'save', swu: sign.swunorm(), fsw: sign.fswnorm() },
      '*',
    );
  } else {
    pushHash(currentParams());
  }
}

export function share(): void {
  if (navigator.share) void navigator.share({ url: document.location.href });
}

/** Wire up postMessage handling and the window.signmaker.vm bridge used by the e2e suite. */
export function installBridge(): void {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data && typeof event.data === 'object') applyState(event.data as Record<string, unknown>);
  });

  // pushState (our own saves) does not fire hashchange — only manual URL edits / link clicks do.
  window.addEventListener('hashchange', () => applyState({ ...UI_DEFAULTS, ...parseHash() }));

  const w = window as unknown as { signmaker?: { vm: Record<string, unknown> } };
  const store = () => useSignStore.getState();
  w.signmaker = {
    vm: {
      add: (symbol: { key: string; x: number; y: number }) => store().add(symbol),
      addSign: (fsw: string) => store().addSign(fsw),
      addSeq: (key: string, position: number) => store().addSeq(key, position),
      delete: () => store().remove(),
      copy: () => store().copy(),
      clear: () => store().clear(),
      mirror: () => store().mirror(),
      rotate: (step: number) => store().rotate(step),
      variation: (step: number) => store().variation(step),
      fill: (step: number) => store().fill(step),
      over: () => store().over(),
      select: (step: number) => store().select(step),
      move: (x: number, y: number) => store().move(x, y),
      center: () => store().center(),
      undo: () => store().undo(),
      redo: () => store().redo(),
      fswlive: () => store().fswlive(),
      fswnorm: () => store().fswnorm(),
      swulive: () => store().swulive(),
      swunorm: () => store().swunorm(),
      save,
    },
  };
}
