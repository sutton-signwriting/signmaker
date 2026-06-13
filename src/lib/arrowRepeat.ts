import { useSignStore } from '../store/signStore';

export type Direction = 'left' | 'right' | 'up' | 'down';

const DELTA: Record<Direction, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

const timers = new Map<Direction, number>();

/**
 * Begin moving the selection in a direction, repeating while held. Movements are coalesced —
 * history is committed once on stop — and the on-screen arrow key is highlighted.
 */
export function startMove(dir: Direction, big = false): void {
  if (timers.has(dir)) return;
  const [dx, dy] = DELTA[dir];
  const step = big ? 10 : 1;
  const tick = () => useSignStore.getState().nudge(dx * step, dy * step);
  tick();
  timers.set(dir, window.setInterval(tick, 60));
  document.getElementById(`arrow-${dir}`)?.classList.add('active');
}

export function stopMove(dir: Direction): void {
  const timer = timers.get(dir);
  if (timer === undefined) return;
  clearInterval(timer);
  timers.delete(dir);
  document.getElementById(`arrow-${dir}`)?.classList.remove('active');
  useSignStore.getState().commit();
}

export function stopAllMoves(): void {
  for (const dir of [...timers.keys()]) stopMove(dir);
}
