import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { extent, symbolSize, symbolSvg, type Sym } from '../lib/sign';
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

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const clientW = el.clientWidth;
      const clientH = el.clientHeight;
      let w = Math.round(clientW / 2);
      let h = Math.round(clientH / 2);
      const box = extent(symbols);
      if (box) {
        if (box[0] < 510 - w || box[1] > 490 + w) w = w + 500 - Math.round((box[0] + box[1]) / 2);
        if (box[2] < 510 - h || box[3] > 490 + h) h = h + 500 - Math.round((box[2] + box[3]) / 2);
      }
      setMid({ w, h, clientW, clientH });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Symbol sizes come from the SignWriting fonts; re-measure once they finish loading.
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [boxRef, symbols]);

  return mid;
}

/** A placed symbol — drags itself (or, if part of a multi-selection, the whole group). */
function DraggableSymbol({ sym, index, mid }: { sym: Sym; index: number; mid: Mid }) {
  const last = useRef({ x: 0, y: 0 });

  const drag = useDrag({
    onStart: () => {
      last.current = { x: 0, y: 0 };
      if (!useSignStore.getState().list[index]?.selected) useSignStore.getState().selectOnly(index);
    },
    onMove: ({ dx, dy }) => {
      const ix = Math.round(dx);
      const iy = Math.round(dy);
      useSignStore.getState().nudge(ix - last.current.x, iy - last.current.y);
      last.current = { x: ix, y: iy };
    },
    onEnd: ({ clientX, clientY, moved }) => {
      const store = useSignStore.getState();
      if (!moved) {
        store.selectOnly(index);
      } else if (pointInElement('sequence', clientX, clientY)) {
        store.nudge(-last.current.x, -last.current.y); // snap back into the signbox
        store.addSeq(sym.key, seqPosition(clientY));
      } else {
        store.commit();
      }
    },
  });

  return (
    <div
      className={`signbox-symbol${sym.selected ? ' selected' : ''}`}
      style={{ left: `${sym.x - 500 + mid.w}px`, top: `${sym.y - 500 + mid.h}px` }}
      onPointerDown={(e) => {
        e.stopPropagation();
        drag(e);
      }}
      dangerouslySetInnerHTML={{ __html: symbolSvg(sym.key) }}
    />
  );
}

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

    const move = (ev: PointerEvent) => {
      const cx = ev.clientX - r.left;
      const cy = ev.clientY - r.top;
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
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setRubber(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
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
        <DraggableSymbol key={index} sym={sym} index={index} mid={mid} />
      ))}
      {rubber && <div className="rubber-band" style={{ left: rubber.x, top: rubber.y, width: rubber.w, height: rubber.h }} />}
      <CanvasControls />
      <CanvasTooling />
    </div>
  );
}
