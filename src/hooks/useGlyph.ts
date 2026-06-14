import { useMemo } from 'react';
import { signSvg, symbolSvg } from '../lib/sign';
import { useFontStore } from '../store/fontStore';

// font-ttf returns empty glyph SVG until the SignWriting fonts load. These hooks
// subscribe to font readiness so the SVG recomputes — and the component re-renders,
// even when memoized — as soon as the fonts arrive, instead of staying empty until
// the next unrelated interaction.

/** SVG for a symbol key, recomputed when the SignWriting fonts finish loading. */
export function useSymbolSvg(key: string): string {
  const ready = useFontStore((s) => s.ready);
  return useMemo(() => (ready ? symbolSvg(key) : ''), [ready, key]);
}

/** SVG for an FSW sign, recomputed when the SignWriting fonts finish loading. */
export function useSignSvg(fsw: string): string {
  const ready = useFontStore((s) => s.ready);
  return useMemo(() => (ready ? signSvg(fsw) : ''), [ready, fsw]);
}
