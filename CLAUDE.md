# SignMaker

React + Vite + Tailwind v4 + Zustand rewrite of the SignWriting editor.

## Performance

Any change that can affect runtime performance — especially hot paths like
dragging, rendering the symbol list, or anything that runs per `pointermove` /
per frame — **must be profiled before and after.** Don't eyeball it.

- **Drag/render hot paths:** symbols move via a direct `translate3d` transform
  during a drag and commit to the store only on drop (`SignBox.tsx`). Never
  drive per-frame motion through the Zustand store or animate `left`/`top` — that
  re-renders the whole list and forces layout every frame.
- **Profile commits with React's `<Profiler>`.** Its `onRender` only fires in a
  **dev build** — `vite preview` (what the e2e suite uses) ships production React
  where Profiler is a no-op. Run `npx vite` and drive it to measure real commit
  counts. Correct pattern for a drag: **0 commits during the drag, 1 on drop.**
- **Guard regressions in `tests/perf.spec.ts`.** The ResizeObserver-churn check
  works on any build (it patches the global), so it belongs in the e2e suite;
  Profiler-based checks need the dev server and are run ad hoc.
