import { symbolSize, type Sym } from './sign';

/** Distance (symbol units == screen px, the signbox is 1:1) within which a moving edge snaps. */
export const SNAP_THRESHOLD = 3;

/** The signbox's center axis, in symbol coordinates. */
const AXIS = 500;

export interface Box {
  left: number;
  cx: number;
  right: number;
  top: number;
  cy: number;
  bottom: number;
}

export interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function box(s: Sym): Box {
  const [w, h] = symbolSize(s.key);
  return { left: s.x, cx: s.x + w / 2, right: s.x + w, top: s.y, cy: s.y + h / 2, bottom: s.y + h };
}

export function unionBox(syms: Sym[]): Box | null {
  if (!syms.length) return null;
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const s of syms) {
    const b = box(s);
    left = Math.min(left, b.left);
    right = Math.max(right, b.right);
    top = Math.min(top, b.top);
    bottom = Math.max(bottom, b.bottom);
  }
  return { left, right, cx: (left + right) / 2, top, bottom, cy: (top + bottom) / 2 };
}

export const staticBoxes = (others: Sym[]): Box[] => others.map(box);

export const boxOf = (anchorX: number, anchorY: number, w: number, h: number): Box => ({
  left: anchorX,
  cx: anchorX + w / 2,
  right: anchorX + w,
  top: anchorY,
  cy: anchorY + h / 2,
  bottom: anchorY + h,
});

export interface SnapResult {
  dx: number;
  dy: number;
  guidesX: number[];
  guidesY: number[];
  symmetry: Seg[];
}

/** Nearest of `lines` to any of `anchors`, within threshold; returns the offset to apply (0 if none). */
function nearest(anchors: number[], lines: number[], threshold: number): number {
  let offset = 0;
  let best = threshold;
  for (const a of anchors) {
    for (const l of lines) {
      if (Math.abs(l - a) <= best) {
        best = Math.abs(l - a);
        offset = l - a;
      }
    }
  }
  return offset;
}

/** Edge of a box facing the center axis, and its distance from it; null if the box straddles the axis. */
function innerEdge(b: Box): { edge: number; dist: number; right: boolean } | null {
  if (b.left >= AXIS) return { edge: b.left, dist: b.left - AXIS, right: true };
  if (b.right <= AXIS) return { edge: b.right, dist: AXIS - b.right, right: false };
  return null;
}

const shiftBox = (b: Box, dx: number, dy: number): Box => ({
  left: b.left + dx,
  cx: b.cx + dx,
  right: b.right + dx,
  top: b.top + dy,
  cy: b.cy + dy,
  bottom: b.bottom + dy,
});

/**
 * Snap a moving box to the stationary boxes and the center axis. Y snaps to edges/centers;
 * X snaps to edges/centers *and* to mirror-symmetric positions (a box on the opposite side of
 * the axis at the same height). Returns the offset to apply, the alignment guides, and the
 * symmetry connectors to draw.
 */
export function snap(moving: Box, boxes: Box[], threshold = SNAP_THRESHOLD): SnapResult {
  const ys: number[] = [AXIS];
  const xs: number[] = [AXIS];
  for (const b of boxes) {
    xs.push(b.left, b.cx, b.right);
    ys.push(b.top, b.cy, b.bottom);
  }

  const dy = nearest([moving.top, moving.cy, moving.bottom], ys, threshold);
  const cy = moving.cy + dy;

  // X candidates: alignment offsets, plus symmetry targets for opposite-side boxes at the same height.
  // Pick the single nearest within threshold (alignment and symmetry compete on the same axis).
  let dx = 0;
  let bestX = threshold + 1;
  const considerX = (offset: number) => {
    const d = Math.abs(offset);
    if (d <= threshold && d < bestX) {
      bestX = d;
      dx = offset;
    }
  };
  for (const a of [moving.left, moving.cx, moving.right]) for (const l of xs) considerX(l - a);

  const m = innerEdge(moving);
  const mirrors: { staticEdge: number; staticCy: number }[] = [];
  if (m) {
    for (const b of boxes) {
      const o = innerEdge(b);
      if (!o || o.right === m.right || Math.abs(b.cy - cy) > threshold) continue;
      mirrors.push({ staticEdge: o.edge, staticCy: b.cy });
      considerX((m.right ? AXIS + o.dist : AXIS - o.dist) - m.edge); // mirror of the static inner edge
    }
  }

  const moved = shiftBox(moving, dx, dy);

  const guidesX = new Set<number>();
  for (const a of [moved.left, moved.cx, moved.right]) for (const l of xs) if (Math.abs(l - a) < 0.5) guidesX.add(l);
  const guidesY = new Set<number>();
  for (const a of [moved.top, moved.cy, moved.bottom]) for (const l of ys) if (Math.abs(l - a) < 0.5) guidesY.add(l);

  const symmetry: Seg[] = [];
  if (m) {
    const innerNow = m.right ? moved.left : moved.right;
    for (const mir of mirrors) {
      // Symmetric once the moving inner edge is equidistant from the axis as the static one.
      if (Math.abs(Math.abs(innerNow - AXIS) - Math.abs(mir.staticEdge - AXIS)) < 0.5) {
        const y = Math.round((mir.staticCy + moved.cy) / 2);
        symmetry.push({ x1: innerNow, y1: y, x2: mir.staticEdge, y2: y });
      }
    }
  }

  return { dx, dy, guidesX: [...guidesX], guidesY: [...guidesY], symmetry };
}

export const shift = shiftBox;
