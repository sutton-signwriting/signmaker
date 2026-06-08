import { useEffect } from 'react';
import { SignMaker } from './components/SignMaker';
import { Palette } from './components/Palette';
import { useUiStore } from './store/uiStore';
import { useSignStore } from './store/signStore';
import { usePaletteStore } from './store/paletteStore';
import { useKeyboard } from './hooks/useKeyboard';
import { loadAlphabet } from './lib/alphabet';
import { isIframe, currentParams } from './lib/bridge';
import { pushHash } from './lib/url';

export function App() {
  useKeyboard();
  const skin = useUiStore((s) => s.skin);
  const alphabet = useUiStore((s) => s.alphabet);

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
      <div id="palette">
        <Palette />
      </div>
    </>
  );
}
