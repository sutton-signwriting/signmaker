import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

export interface DragInfo {
  dx: number;
  dy: number;
  clientX: number;
  clientY: number;
  moved: boolean;
}

interface DragHandlers {
  onStart?: () => void;
  onMove?: (info: DragInfo) => void;
  onEnd?: (info: DragInfo) => void;
  /** When true, translate the dragged element to follow the pointer, then reset on drop. */
  ghost?: boolean;
}

const THRESHOLD = 3;

/** Minimal Pointer Events drag, replacing Draggabilly. Returns an onPointerDown handler. */
export function useDrag(handlers: DragHandlers): (e: ReactPointerEvent) => void {
  const state = useRef<{ x: number; y: number; el: HTMLElement; moved: boolean } | null>(null);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    state.current = { x: e.clientX, y: e.clientY, el, moved: false };
    handlers.onStart?.();

    // Coalesce moves to one flush per frame: pointermove can fire many times between paints
    // (high-Hz pointers, or events queued while the main thread is busy — e.g. over a playing
    // video in an iframe). Doing the snap + render work once per frame keeps dragging smooth.
    let lastX = e.clientX;
    let lastY = e.clientY;
    let raf = 0;

    const flush = () => {
      raf = 0;
      const s = state.current;
      if (!s) return;
      const dx = lastX - s.x;
      const dy = lastY - s.y;
      if (handlers.ghost && s.moved) s.el.style.transform = `translate(${dx}px, ${dy}px)`;
      handlers.onMove?.({ dx, dy, clientX: lastX, clientY: lastY, moved: s.moved });
    };

    const move = (ev: PointerEvent) => {
      const s = state.current;
      if (!s) return;
      lastX = ev.clientX;
      lastY = ev.clientY;
      // The threshold flip is cheap and must be exact (it decides click vs drag), so do it eagerly.
      if (!s.moved && Math.abs(lastX - s.x) + Math.abs(lastY - s.y) > THRESHOLD) {
        s.moved = true;
        if (handlers.ghost) s.el.classList.add('dragging');
      }
      if (raf === 0) raf = requestAnimationFrame(flush);
    };

    const up = (ev: PointerEvent) => {
      const s = state.current;
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      state.current = null;
      if (!s) return;
      if (handlers.ghost) {
        s.el.style.transform = '';
        s.el.classList.remove('dragging');
      }
      handlers.onEnd?.({
        dx: ev.clientX - s.x,
        dy: ev.clientY - s.y,
        clientX: ev.clientX,
        clientY: ev.clientY,
        moved: s.moved,
      });
    };

    // Passive: these handlers never call preventDefault (touch-action:none on the targets stops
    // scroll), so the browser needn't block on them — lower input latency.
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    // Touch browsers fire pointercancel when they reclaim the gesture (e.g. for scrolling);
    // treat it as a drop so listeners and ghosts don't leak.
    window.addEventListener('pointercancel', up, { passive: true });
  };

  return onPointerDown;
}

/** Hit-test a client point against an element id (the legacy overlap check, simplified). */
export function pointInElement(id: string, clientX: number, clientY: number): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

/** The sequence column has 20 vertical drop slots — which one is the pointer over.
 *  Slots start below the mobile save button; offsetTop (unlike getBoundingClientRect)
 *  ignores the translate applied to an item mid-drag. */
export const seqPosition = (clientY: number): number => {
  const first = document.querySelector<HTMLElement>('#sequence .sort');
  return Math.max(0, Math.floor((clientY - (first?.offsetTop ?? 0)) / (window.innerHeight / 20)));
};
