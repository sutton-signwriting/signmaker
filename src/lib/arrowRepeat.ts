import { useSignStore } from '../store/signStore';
import { unionBox, staticBoxes } from './snap';
import { snapToGuides, clearGuides } from './guides';

export type Direction = 'left' | 'right' | 'up' | 'down';

const DELTA: Record<Direction, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

const timers = new Map<Direction, number>();

// Arrow moves don't snap, but they surface the same guides so you can see when you reach alignment.
function showGuides(): void {
  const list = useSignStore.getState().list;
  const box = unionBox(list.filter((s) => s.selected));
  if (!box) return clearGuides();
  snapToGuides(box, staticBoxes(list.filter((s) => !s.selected))); // offset ignored — arrows don't snap
}

/**
 * Begin moving the selection in a direction, repeating while held. Movements are coalesced —
 * history is committed once on stop — and the on-screen arrow key is highlighted.
 */
export function startMove(dir: Direction, big = false): void {
  if (timers.has(dir)) return;
  const [dx, dy] = DELTA[dir];
  const step = big ? 10 : 1;
  const tick = () => {
    useSignStore.getState().nudge(dx * step, dy * step);
    showGuides();
  };
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
  if (timers.size === 0) clearGuides();
  useSignStore.getState().commit();
}

export function stopAllMoves(): void {
  for (const dir of [...timers.keys()]) stopMove(dir);
}
