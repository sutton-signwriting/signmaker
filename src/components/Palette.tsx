import { memo, useRef } from 'react';
import { usePaletteStore } from '../store/paletteStore';
import { useSignStore } from '../store/signStore';
import { useTranslation } from '../hooks/useTranslation';
import { useDrag, pointInElement, seqPosition } from '../hooks/useDrag';
import { save } from '../lib/bridge';
import { SYMBOL_NAMES } from '../i18n/symbolNames';
import { symbolSvg, symbolSize, mirror as mirrorKey } from '../lib/sign';
import { HomeIcon } from './icons';

/** A full-size symbol that follows the cursor, centered, while dragging from the palette. */
function makeGhost(symbolKey: string): HTMLDivElement {
  const ghost = document.createElement('div');
  ghost.className = 'palette-ghost';
  ghost.innerHTML = symbolSvg(symbolKey);
  document.body.appendChild(ghost);
  return ghost;
}

const PaletteCell = memo(function PaletteCell({ symbolKey, tooltip }: { symbolKey: string; tooltip: string }) {
  const click = usePaletteStore((s) => s.click);
  const add = useSignStore((s) => s.add);
  const addSeq = useSignStore((s) => s.addSeq);
  const ghost = useRef<HTMLDivElement | null>(null);

  const positionGhost = (clientX: number, clientY: number) => {
    const [w, h] = symbolSize(symbolKey);
    if (!ghost.current) ghost.current = makeGhost(symbolKey);
    ghost.current.style.left = `${clientX - w / 2}px`;
    ghost.current.style.top = `${clientY - h / 2}px`;
  };

  const onPointerDown = useDrag({
    onMove: ({ clientX, clientY, moved }) => {
      if (symbolKey && moved) positionGhost(clientX, clientY);
    },
    onEnd: ({ clientX, clientY, moved }) => {
      ghost.current?.remove();
      ghost.current = null;
      if (!symbolKey) return;
      if (!moved) {
        click(symbolKey);
        return;
      }
      // Drop completed — drop focus from the palette cell so keyboard shortcuts act on the sign.
      (document.activeElement as HTMLElement | null)?.blur();
      const box = document.getElementById('signbox');
      if (box && pointInElement('signbox', clientX, clientY)) {
        const r = box.getBoundingClientRect();
        const [w, h] = symbolSize(symbolKey);
        add({
          key: symbolKey,
          x: Math.round(500 - box.clientWidth / 2 + (clientX - r.left) - w / 2),
          y: Math.round(500 - box.clientHeight / 2 + (clientY - r.top) - h / 2),
        });
      } else if (pointInElement('sequence', clientX, clientY)) {
        addSeq(symbolKey, seqPosition(clientY));
      }
    },
  });

  return (
    <button
      type="button"
      data-tip={tooltip || undefined}
      aria-label={tooltip || undefined}
      disabled={!symbolKey}
      onPointerDown={symbolKey ? onPointerDown : undefined}
      dangerouslySetInnerHTML={{ __html: symbolSvg(symbolKey) }}
    />
  );
});

function Crumb({ symbolKey, onClick }: { symbolKey: string; onClick?: () => void }) {
  const inner = <span className="crumb-sym" dangerouslySetInnerHTML={{ __html: symbolSvg(symbolKey) }} />;
  return onClick ? (
    <button type="button" className="crumb crumb-link" onClick={onClick}>
      {inner}
    </button>
  ) : (
    <span className="crumb">{inner}</span>
  );
}

export function Palette() {
  const { t } = useTranslation();
  const { grid, group, base, lower, mirror, top, select, toggleMirror } = usePaletteStore();

  const tooltipPrefix = base ? '' : group ? 'base_' : 'group_';
  const atTop = !group && !base;

  return (
    <>
      <header className="palette-bar">
        <nav className="palette-crumbs" aria-label="symbol navigation">
          {!atTop && (
            <button type="button" className="crumb crumb-link" onClick={top} data-tip={t('top')} aria-label={t('top')}>
              <HomeIcon />
            </button>
          )}
          {group && (
            <>
              <span className="crumb-sep">›</span>
              <Crumb symbolKey={group} onClick={base ? () => select(group) : undefined} />
            </>
          )}
          {base && (
            <>
              <span className="crumb-sep">›</span>
              <Crumb symbolKey={lower ? mirrorKey(base) : base} />
            </>
          )}
        </nav>
        <button type="button" className="palette-save" onClick={save}>
          {t('save')}
        </button>
      </header>

      <div className="palette-grid">
        {grid.map((row, ri) => (
          <div className="row" key={ri}>
            {row.map((key, ci) => (
              <PaletteCell key={`${ri}-${ci}-${key}`} symbolKey={key} tooltip={tooltipPrefix && key ? (SYMBOL_NAMES[tooltipPrefix + key.slice(0, 4)] ?? '') : ''} />
            ))}
          </div>
        ))}
      </div>

      {mirror && (
        <footer className="palette-foot">
          <button type="button" className={`palette-mirror clickable${lower ? ' active' : ''}`} onClick={toggleMirror}>
            {lower ? 'Un-mirror' : 'Mirror'}
          </button>
        </footer>
      )}
    </>
  );
}
