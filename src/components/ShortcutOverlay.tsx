import { useLayoutEffect, useState } from 'react';
import { useUiStore } from '../store/uiStore';

interface Badge {
  text: string;
  left: number;
  top: number;
}

// Tool tooltips already embed their shortcut as a trailing "(…)", e.g. "Undo (⌘Z)" or "Move up (↑)".
// We surface just that part, centered over each control, so the overlay teaches shortcuts at a glance.
const SHORTCUT = /\(([^()]+)\)\s*$/;

function collect(): Badge[] {
  const badges: Badge[] = [];
  document.querySelectorAll<HTMLElement>('[data-tip]').forEach((el) => {
    if (el.offsetParent === null) return; // skip hidden controls (folded toolbar, closed drawer)
    const match = el.getAttribute('data-tip')?.match(SHORTCUT);
    if (!match) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    badges.push({ text: match[1], left: r.left + r.width / 2, top: r.top + r.height / 2 });
  });
  return badges;
}

/** Shortcut-learning overlay: while active (hold ⌘/Ctrl), badge every tool with its keyboard shortcut. */
export function ShortcutOverlay() {
  const active = useUiStore((s) => s.learnShortcuts);
  const [badges, setBadges] = useState<Badge[]>([]);

  useLayoutEffect(() => {
    setBadges(active ? collect() : []);
  }, [active]);

  if (!active) return null;
  return (
    <div className="shortcut-overlay" aria-hidden>
      {badges.map((b, i) => (
        <span key={i} className="shortcut-badge" style={{ left: b.left, top: b.top }}>
          {b.text}
        </span>
      ))}
    </div>
  );
}
