let bubble: HTMLDivElement | null = null;
let current: HTMLElement | null = null;

function closestTip(node: EventTarget | null): HTMLElement | null {
  const el = node as Element | null;
  return el && el.closest ? (el.closest('[data-tip]') as HTMLElement | null) : null;
}

function hide(): void {
  current = null;
  if (bubble) bubble.style.display = 'none';
}

function show(target: HTMLElement): void {
  if (target === current) return; // already shown for this element — avoids flicker across child nodes
  const text = target.getAttribute('data-tip');
  if (!bubble || !text) return hide();
  current = target;
  bubble.textContent = text;
  bubble.style.display = 'block';
  const r = target.getBoundingClientRect();
  let left: number;
  let top: number;
  if (target.getAttribute('data-tip-pos') === 'right') {
    left = r.right + 8;
    top = r.top + r.height / 2 - bubble.offsetHeight / 2;
  } else {
    left = r.left + r.width / 2 - bubble.offsetWidth / 2;
    top = r.top - bubble.offsetHeight - 6;
    if (top < 4) top = r.bottom + 6;
  }
  left = Math.max(4, Math.min(left, window.innerWidth - bubble.offsetWidth - 4));
  top = Math.max(4, Math.min(top, window.innerHeight - bubble.offsetHeight - 4));
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
}

/** Instant, portal-based tooltips: any element with [data-tip] shows its text on hover or focus. */
export function installTooltip(): void {
  bubble = document.createElement('div');
  bubble.className = 'tip-bubble';
  bubble.setAttribute('role', 'tooltip');
  document.body.appendChild(bubble);

  const track = (e: Event) => {
    const target = closestTip(e.target);
    if (target) show(target);
    else hide();
  };
  document.addEventListener('pointerover', track);
  document.addEventListener('focusin', track);
  document.addEventListener('pointerdown', hide);
  document.addEventListener('focusout', hide);
  window.addEventListener('scroll', hide, true);
}
