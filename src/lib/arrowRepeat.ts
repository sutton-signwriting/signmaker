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

// On-screen buttons have no OS key-repeat, so they get a text-cursor-style hold: one move, a pause,
// then a fast repeat. The keyboard is driven by the OS's own repeat instead (see step vs startMove).
const HOLD_DELAY = 300;
const HOLD_INTERVAL = 50;

const timers = new Map<Direction, number>(); // active on-screen-button holds
const held = new Set<Direction>(); // keys physically held on the keyboard

// Arrow moves don't snap, but they surface the same guides so you can see when you reach alignment.
function showGuides(): void {
  const list = useSignStore.getState().list;
  const box = unionBox(list.filter((s) => s.selected));
  if (!box) return clearGuides();
  snapToGuides(box, staticBoxes(list.filter((s) => !s.selected))); // offset ignored — arrows don't snap
}

/** One discrete move in a direction. */
function step(dir: Direction, big: boolean): void {
  const [dx, dy] = DELTA[dir];
  const stepSize = big ? 10 : 1;
  useSignStore.getState().nudge(dx * stepSize, dy * stepSize);
  showGuides();
  document.getElementById(`arrow-${dir}`)?.classList.add('active');
}

// Once nothing is moving, commit the coalesced run to history and drop the guides.
function maybeFinish(): void {
  if (held.size || timers.size) return;
  clearGuides();
  useSignStore.getState().commit();
}

/** Keyboard keydown — the OS repeats it (initial delay, then fast), so we just move once per event. */
export function keyDown(dir: Direction, big = false): void {
  held.add(dir);
  step(dir, big);
}

/** Keyboard keyup — always safe to call (even refocused into an input) so movement can't get stuck. */
export function keyUp(dir: Direction): void {
  held.delete(dir);
  document.getElementById(`arrow-${dir}`)?.classList.remove('active');
  maybeFinish();
}

/** On-screen button press: move once, then after a pause repeat quickly while held. */
export function startMove(dir: Direction, big = false): void {
  if (timers.has(dir)) return;
  step(dir, big);
  const delay = window.setTimeout(() => {
    timers.set(dir, window.setInterval(() => step(dir, big), HOLD_INTERVAL));
  }, HOLD_DELAY);
  timers.set(dir, delay);
}

export function stopMove(dir: Direction): void {
  const timer = timers.get(dir);
  if (timer === undefined) return;
  clearTimeout(timer); // the id is either the delay timeout or the repeat interval — clear both kinds
  clearInterval(timer);
  timers.delete(dir);
  document.getElementById(`arrow-${dir}`)?.classList.remove('active');
  maybeFinish();
}

export function stopAllMoves(): void {
  for (const dir of [...timers.keys()]) stopMove(dir);
  for (const dir of [...held]) keyUp(dir);
}
