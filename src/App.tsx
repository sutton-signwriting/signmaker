import { useEffect } from 'react';
import { SignMaker } from './components/SignMaker';
import { Palette } from './components/Palette';
import { useUiStore } from './store/uiStore';
import { useSignStore } from './store/signStore';
import { usePaletteStore } from './store/paletteStore';
import { useKeyboard } from './hooks/useKeyboard';
import { useTranslation } from './hooks/useTranslation';
import { ChevronLeft } from './components/icons';
import { loadAlphabet } from './lib/alphabet';
import { isIframe, currentParams } from './lib/bridge';
import { pushHash } from './lib/url';

export function App() {
  useKeyboard();
  const { t } = useTranslation();
  const skin = useUiStore((s) => s.skin);
  const alphabet = useUiStore((s) => s.alphabet);
  const paletteOpen = useUiStore((s) => s.paletteOpen);
  const set = useUiStore((s) => s.set);

  useEffect(() => {
    document.body.className = skin;
  }, [skin]);

  useEffect(() => {
    let cancelled = false;
    loadAlphabet(alphabet)
      .then((source) => {
        if (!cancelled) usePaletteStore.getState().init(source);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [alphabet]);

  useEffect(() => {
    if (isIframe) return;
    return useSignStore.subscribe((state, prev) => {
      if (state.revision !== prev.revision) pushHash(currentParams());
    });
  }, []);

  return (
    <>
      <SignMaker />
      {paletteOpen && <div className="palette-scrim" onClick={() => set({ paletteOpen: false })} />}
      <button
        type="button"
        className="palette-toggle"
        aria-label={t('symbols')}
        aria-expanded={paletteOpen}
        aria-controls="palette"
        onClick={() => set({ paletteOpen: true })}
      >
        <ChevronLeft />
      </button>
      <div id="palette" className={paletteOpen ? 'open' : ''}>
        <Palette />
      </div>
    </>
  );
}
