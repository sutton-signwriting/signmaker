import { snap, type Box } from './snap';
import { useGuideStore } from '../store/guideStore';

/** Snap a moving box against the stationary boxes, publish the guides, and return the offset to apply. */
export function snapToGuides(box: Box, boxes: Box[]): { dx: number; dy: number } {
  const { dx, dy, guidesX, guidesY, symmetry } = snap(box, boxes);
  useGuideStore.getState().set({ x: guidesX, y: guidesY, sym: symmetry });
  return { dx, dy };
}

export const clearGuides = (): void => useGuideStore.getState().clear();
