import { usePaletteStore } from '../store/paletteStore';
import { useSignStore } from '../store/signStore';
import { symbolSize } from './sign';

/**
 * Activate a palette cell: drill into its submenu, or — if it's a leaf (a base-level symbol with
 * no further menu) — drop it centered on the canvas, selected. Returns true if a symbol was added.
 */
export function activateSymbol(key: string): boolean {
  if (!key) return false;
  const palette = usePaletteStore.getState();
  if (palette.base) {
    const [w, h] = symbolSize(key);
    useSignStore.getState().add({ key, x: Math.round(500 - w / 2), y: Math.round(500 - h / 2) });
    return true;
  }
  palette.click(key);
  return false;
}
