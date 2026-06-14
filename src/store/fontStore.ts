import { create } from 'zustand';

/** The SignWriting fonts font-ttf needs loaded before it can render glyphs. */
export const SIGNWRITING_FONTS = [
  'SuttonSignWritingLine',
  'SuttonSignWritingFill',
  'SuttonSignWritingOneD',
] as const;

interface FontState {
  /** Whether the SignWriting fonts have loaded. Glyph SVG is empty until then. */
  ready: boolean;
}

const allLoaded = (): boolean =>
  !!document.fonts && SIGNWRITING_FONTS.every((family) => document.fonts.check(`1em "${family}"`));

export const useFontStore = create<FontState>(() => ({ ready: allLoaded() }));

/**
 * Request the SignWriting fonts and flip `ready` once they resolve.
 *
 * font-ttf renders glyphs as empty until these fonts are available, but nothing
 * requests them on its own: glyph measuring goes through a canvas, which never
 * triggers @font-face loading, and the empty glyph output means no DOM text
 * triggers it either. So we load them explicitly. `ready` is seeded from the
 * font cache so returning visitors render immediately without a placeholder flash,
 * and is flipped in `finally` so a failed font load degrades to the fallback glyph
 * rather than leaving the UI blank.
 */
export async function ensureSignWritingFonts(): Promise<void> {
  if (useFontStore.getState().ready || !document.fonts) {
    useFontStore.setState({ ready: true });
    return;
  }
  try {
    await Promise.all(SIGNWRITING_FONTS.map((family) => document.fonts.load(`1em "${family}"`)));
  } finally {
    useFontStore.setState({ ready: true });
  }
}
