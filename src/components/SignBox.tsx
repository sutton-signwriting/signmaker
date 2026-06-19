import { memo, useCallback, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { useGuideStore } from '../store/guideStore';
import { useSelectModeStore } from '../store/selectModeStore';
import { extent, symbolSize, type Sym } from '../lib/sign';
import { unionBox, staticBoxes, shift, type Box } from '../lib/snap';
import { snapToGuides, clearGuides } from '../lib/guides';
import { useSymbolSvg } from '../hooks/useGlyph';
import { useFontStore } from '../store/fontStore';
import { useDrag, pointInElement, seqPosition } from '../hooks/useDrag';
import { CanvasControls } from './CanvasControls';
import { CanvasTooling } from './CanvasTooling';

interface Mid {
  w: number;
  h: number;
  clientW: number;
  clientH: number;
}

/** Compute the signbox center offset, panning to keep large signs in view (legacy signmaker.view). */
function useMid(boxRef: RefObject<HTMLDivElement | null>, symbols: Sym[]): Mid {
  const [mid, setMid] = useState<Mid>({ w: 0, h: 0, clientW: 0, clientH: 0 });
  const fontsReady = useFontStore((s) => s.ready);
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  const measure = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;
    const clientW = el.clientWidth;
    const clientH = el.clientHeight;
    let w = Math.round(clientW / 2);
    let h = Math.round(clientH / 2);
    const box = extent(symbolsRef.current);
    if (box) {
      if (box[0] < 510 - w || box[1] > 490 + w) w = w + 500 - Math.round((box[0] + box[1]) / 2);
      if (box[2] < 510 - h || box[3] > 490 + h) h = h + 500 - Math.round((box[2] + box[3]) / 2);
    }
    // Bail when nothing changed so an unrelated store update doesn't trigger a re-render.
    setMid((prev) => (prev.w === w && prev.h === h && prev.clientW === clientW && prev.clientH === clientH ? prev : { w, h, clientW, clientH }));
  }, [boxRef]);

  // Observe the box once; the ResizeObserver outlives symbol/font changes instead of churning per edit.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // Symbol sizes come from the SignWriting fonts, so re-measure when symbols change or the fonts load.
  useLayoutEffect(() => {
    measure();
  }, [symbols, fontsReady, measure]);

  return mid;
}

/** A placed symbol — drags itself (or, if part of a multi-selection, the whole group).
 *  Memoized: the store keeps unchanged symbols' references stable, so only symbols that actually
 *  changed (moved/selected/transformed) re-render on a given interaction. */
const DraggableSymbol = memo(function DraggableSymbol({ sym, index, mid }: { sym: Sym; index: number; mid: Mid }) {
  // Captured at drag start so snapping measures the moving group and the stationary symbols once.
  const startBox = useRef<Box | null>(null);
  const boxes = useRef<Box[]>([]);
  // The DOM nodes of the selected group, moved by transform during the drag (no React re-render,
  // no left/top layout) and committed to the store only on drop — this is what keeps dragging smooth.
  const nodes = useRef<HTMLElement[]>([]);

  const paint = (x: number, y: number) => {
    const t = `translate3d(${x}px, ${y}px, 0)`;
    for (const n of nodes.current) n.style.transform = t;
  };

  const drag = useDrag({
    onStart: () => {
      useSelectModeStore.getState().exit(); // grabbing a canvas symbol leaves keyboard select mode
      const store = useSignStore.getState();
      if (!store.list[index]?.selected) store.selectOnly(index);
      const list = useSignStore.getState().list;
      startBox.current = unionBox(list.filter((s) => s.selected));
      boxes.current = staticBoxes(list.filter((s) => !s.selected));
      // Selection just changed in the store; the .selected class lands on the next render, so map by
      // index instead. The nodes already exist in the DOM with their data-index.
      const root = document.getElementById('signbox');
      nodes.current = list
        .map((s, i) => (s.selected ? root?.querySelector<HTMLElement>(`.signbox-symbol[data-index="${i}"]`) : null))
        .filter((n): n is HTMLElement => !!n);
    },
    onMove: ({ dx, dy }) => {
      const box = startBox.current;
      if (!box) return;
      const desiredX = Math.round(dx);
      const desiredY = Math.round(dy);
      const { dx: sdx, dy: sdy } = snapToGuides(shift(box, desiredX, desiredY), boxes.current);
      paint(Math.round(desiredX + sdx), Math.round(desiredY + sdy));
    },
    onEnd: ({ clientX, clientY, dx, dy, moved }) => {
      const box = startBox.current;
      for (const n of nodes.current) n.style.transform = '';
      nodes.current = [];
      const store = useSignStore.getState();
      if (!moved || !box) {
        clearGuides();
        store.selectOnly(index);
      } else if (pointInElement('sequence', clientX, clientY)) {
        clearGuides();
        store.addSeq(sym.key, seqPosition(clientY)); // stays in the signbox; transform already reset
      } else {
        // Recompute from the release delta so the drop is exact even if the last frame's flush was
        // coalesced away by pointerup.
        const { dx: sdx, dy: sdy } = snapToGuides(shift(box, Math.round(dx), Math.round(dy)), boxes.current);
        clearGuides();
        store.nudge(Math.round(dx + sdx), Math.round(dy + sdy));
        store.commit();
      }
    },
  });

  return (
    <div
      className={`signbox-symbol${sym.selected ? ' selected' : ''}`}
      data-index={index}
      style={{ left: `${sym.x - 500 + mid.w}px`, top: `${sym.y - 500 + mid.h}px` }}
      onPointerDown={(e) => {
        e.stopPropagation();
        drag(e);
      }}
      dangerouslySetInnerHTML={{ __html: useSymbolSvg(sym.key) }}
    />
  );
});

function Grid({ level, mid }: { level: string; mid: Mid }) {
  const { clientW, clientH, w, h } = mid;
  if (level === '0' || !clientW) return null;
  const fine: React.ReactNode[] = [];
  if (level === '2') {
    // Fine grid only inside the valid 500×500 lane (coordinates 250–749).
    const left = w - 250;
    const right = w + 250;
    const top = h - 250;
    const bottom = h + 250;
    for (let x = left; x <= right; x += 10)
      fine.push(<line key={`fx${x}`} x1={x} y1={top} x2={x} y2={bottom} stroke="lightgray" strokeWidth={1} />);
    for (let y = top; y <= bottom; y += 10)
      fine.push(<line key={`fy${y}`} x1={left} y1={y} x2={right} y2={y} stroke="lightgray" strokeWidth={1} />);
  }
  return (
    <svg width={clientW} height={clientH} viewBox={`0 0 ${clientW} ${clientH}`} xmlns="http://www.w3.org/2000/svg">
      <g>{fine}</g>
      <g stroke="gray">
        <line x1={0} y1={h} x2={clientW} y2={h} strokeWidth={1} />
        <line x1={w} y1={0} x2={w} y2={clientH} strokeWidth={1} />
      </g>
    </svg>
  );
}

/** Dashed alignment guides + dotted symmetry connectors drawn while dragging or arrow-moving. */
function Guides({ mid }: { mid: Mid }) {
  const x = useGuideStore((g) => g.x);
  const y = useGuideStore((g) => g.y);
  const sym = useGuideStore((g) => g.sym);
  if (!mid.clientW || (!x.length && !y.length && !sym.length)) return null;
  const px = (v: number) => v - 500 + mid.w;
  const py = (v: number) => v - 500 + mid.h;
  return (
    <svg className="snap-guides" width={mid.clientW} height={mid.clientH} viewBox={`0 0 ${mid.clientW} ${mid.clientH}`} xmlns="http://www.w3.org/2000/svg">
      {x.map((vx) => <line key={`gx${vx}`} x1={px(vx)} y1={0} x2={px(vx)} y2={mid.clientH} />)}
      {y.map((vy) => <line key={`gy${vy}`} x1={0} y1={py(vy)} x2={mid.clientW} y2={py(vy)} />)}
      {sym.map((s, i) => (
        <line key={`gs${i}`} className="snap-symmetry" x1={px(s.x1)} y1={py(s.y1)} x2={px(s.x2)} y2={py(s.y2)} />
      ))}
    </svg>
  );
}

const CONTROL_SELECTOR = '.canvas-tools, .arrow-pad, .canvas-tooling, .tool-popover, dialog';

export function SignBox() {
  const list = useSignStore((s) => s.list);
  const selnone = useSignStore((s) => s.selnone);
  const selectIndices = useSignStore((s) => s.selectIndices);
  const grid = useUiStore((s) => s.grid);
  const boxRef = useRef<HTMLDivElement>(null);
  const mid = useMid(boxRef, list);
  const [rubber, setRubber] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Rubber-band selection on the empty canvas (symbols stop propagation; controls are skipped).
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(CONTROL_SELECTOR)) return;
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const sizes = list.map((s) => symbolSize(s.key));
    selnone();

    // Coalesce to one update per frame — the hit-test + selection store write shouldn't run on
    // every queued pointermove (see useDrag for the same reasoning).
    let cx = sx;
    let cy = sy;
    let raf = 0;
    const flush = () => {
      raf = 0;
      const x0 = Math.min(sx, cx);
      const y0 = Math.min(sy, cy);
      const x1 = Math.max(sx, cx);
      const y1 = Math.max(sy, cy);
      setRubber({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      const indices: number[] = [];
      list.forEach((s, i) => {
        const left = s.x - 500 + mid.w;
        const top = s.y - 500 + mid.h;
        const [w, h] = sizes[i];
        if (!(left + w < x0 || left > x1 || top + h < y0 || top > y1)) indices.push(i);
      });
      selectIndices(indices);
      if (indices.length) useSelectModeStore.getState().exit(); // rubber-band selection leaves select mode
    };
    const move = (ev: PointerEvent) => {
      cx = ev.clientX - r.left;
      cy = ev.clientY - r.top;
      if (raf === 0) raf = requestAnimationFrame(flush);
    };
    const up = () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setRubber(null);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
  };

  return (
    <div id="signbox" ref={boxRef} onPointerDown={onPointerDown}>
      <div>
        <Grid level={grid} mid={mid} />
      </div>
      {mid.clientW > 0 && (
        <div className="valid-range" style={{ left: mid.w - 250, top: mid.h - 250, width: 500, height: 500 }} />
      )}
      {list.map((sym, index) => (
        // Key on the symbol value too: changing the glyph (mirror/rotate/…) remounts the
        // element, giving a clean repaint instead of leaving a faint artifact of the old glyph.
        <DraggableSymbol key={`${index}:${sym.key}`} sym={sym} index={index} mid={mid} />
      ))}
      {rubber && <div className="rubber-band" style={{ left: rubber.x, top: rubber.y, width: rubber.w, height: rubber.h }} />}
      <Guides mid={mid} />
      <CanvasControls />
      <CanvasTooling />
    </div>
  );
}
