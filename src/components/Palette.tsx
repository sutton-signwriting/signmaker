import { memo, useEffect, useRef } from 'react';
import { usePaletteStore } from '../store/paletteStore';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { useSelectModeStore } from '../store/selectModeStore';
import { useTranslation } from '../hooks/useTranslation';
import { useDrag, pointInElement, seqPosition } from '../hooks/useDrag';
import { save } from '../lib/bridge';
import { SYMBOL_NAMES } from '../i18n/symbolNames';
import { symbolSvg, symbolSize, mirror as mirrorKey } from '../lib/sign';
import { staticBoxes, boxOf, type Box } from '../lib/snap';
import { snapToGuides, clearGuides } from '../lib/guides';
import { activateSymbol } from '../lib/palette';
import { showTooltip } from '../lib/tooltip';
import { useSymbolSvg } from '../hooks/useGlyph';
import { HomeIcon, SaveIcon } from './icons';

/** A full-size symbol that follows the cursor, centered, while dragging from the palette. */
function makeGhost(symbolKey: string): HTMLDivElement {
  const ghost = document.createElement('div');
  ghost.className = 'palette-ghost';
  ghost.innerHTML = symbolSvg(symbolKey);
  document.body.appendChild(ghost);
  return ghost;
}

/** The symbol-space anchor a palette drop at (clientX, clientY) would land on, or null if off the signbox. */
function dropAnchor(symbolKey: string, clientX: number, clientY: number): { x: number; y: number; w: number; h: number } | null {
  const box = document.getElementById('signbox');
  if (!box || !pointInElement('signbox', clientX, clientY)) return null;
  const r = box.getBoundingClientRect();
  const [w, h] = symbolSize(symbolKey);
  return {
    x: 500 - box.clientWidth / 2 + (clientX - r.left) - w / 2,
    y: 500 - box.clientHeight / 2 + (clientY - r.top) - h / 2,
    w,
    h,
  };
}

const PaletteCell = memo(function PaletteCell({ symbolKey, tooltip, focused }: { symbolKey: string; tooltip: string; focused?: boolean }) {
  const add = useSignStore((s) => s.add);
  const addSeq = useSignStore((s) => s.addSeq);
  const ghost = useRef<HTMLDivElement | null>(null);
  const boxes = useRef<Box[]>([]);
  const snapOffset = useRef({ dx: 0, dy: 0 });

  const positionGhost = (clientX: number, clientY: number) => {
    const [w, h] = symbolSize(symbolKey);
    if (!ghost.current) ghost.current = makeGhost(symbolKey);
    ghost.current.style.left = `${clientX - w / 2}px`;
    ghost.current.style.top = `${clientY - h / 2}px`;
  };

  const onPointerDown = useDrag({
    onStart: () => {
      boxes.current = staticBoxes(useSignStore.getState().list);
      snapOffset.current = { dx: 0, dy: 0 };
    },
    onMove: ({ clientX, clientY, moved }) => {
      if (!symbolKey || !moved) return;
      // First dragging move: collapse the mobile palette drawer so the canvas is exposed for the drop.
      if (!ghost.current) useUiStore.getState().set({ paletteOpen: false });
      const anchor = dropAnchor(symbolKey, clientX, clientY);
      if (anchor) {
        snapOffset.current = snapToGuides(boxOf(anchor.x, anchor.y, anchor.w, anchor.h), boxes.current);
      } else {
        snapOffset.current = { dx: 0, dy: 0 };
        clearGuides();
      }
      positionGhost(clientX + snapOffset.current.dx, clientY + snapOffset.current.dy);
    },
    onEnd: ({ clientX, clientY, moved }) => {
      ghost.current?.remove();
      ghost.current = null;
      clearGuides();
      if (!symbolKey) return;
      if (!moved) {
        activateSymbol(symbolKey); // tap: drill into the submenu, or add a leaf to the canvas center
        return;
      }
      // Drop completed — drop focus from the palette cell so keyboard shortcuts act on the sign.
      (document.activeElement as HTMLElement | null)?.blur();
      const anchor = dropAnchor(symbolKey, clientX, clientY);
      if (anchor) {
        add({ key: symbolKey, x: Math.round(anchor.x + snapOffset.current.dx), y: Math.round(anchor.y + snapOffset.current.dy) });
      } else if (pointInElement('sequence', clientX, clientY)) {
        addSeq(symbolKey, seqPosition(clientY));
      }
    },
  });

  return (
    <button
      type="button"
      className={focused ? 'focused' : undefined}
      data-tip={tooltip || undefined}
      data-tip-pos="between"
      aria-label={tooltip || undefined}
      disabled={!symbolKey}
      onPointerDown={symbolKey ? onPointerDown : undefined}
      dangerouslySetInnerHTML={{ __html: useSymbolSvg(symbolKey) }}
    />
  );
});

function Crumb({ symbolKey, onClick }: { symbolKey: string; onClick?: () => void }) {
  const inner = <span className="crumb-sym" dangerouslySetInnerHTML={{ __html: useSymbolSvg(symbolKey) }} />;
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
  const selectActive = useSelectModeStore((s) => s.active);
  const cursorRow = useSelectModeStore((s) => s.row);
  const cursorCol = useSelectModeStore((s) => s.col);

  const tooltipPrefix = base ? '' : group ? 'base_' : 'group_';
  const atTop = !group && !base;

  // In select mode the cursor is virtual (no real hover/focus), so surface the focused cell's tooltip.
  useEffect(() => {
    if (!selectActive) return;
    showTooltip(document.querySelector<HTMLElement>('#palette .row button.focused'));
    return () => showTooltip(null);
  }, [selectActive, cursorRow, cursorCol, group, base, grid]);

  return (
    <>
      <header className="palette-bar">
        <button
          type="button"
          className={`palette-select-hint${selectActive ? ' active' : ''}`}
          onClick={() => (selectActive ? useSelectModeStore.getState().exit() : useSelectModeStore.getState().start())}
          data-tip={`${t('select')} (S)`}
          aria-label={`${t('select')} (S)`}
          aria-pressed={selectActive}
        >
          S
        </button>
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
          <SaveIcon />
          {t('save')}
        </button>
      </header>

      <div className="palette-grid">
        {grid.map((row, ri) => (
          <div className="row" key={ri}>
            {selectActive && ri < 10 && <span className="palette-num">{ri === 9 ? 0 : ri + 1}</span>}
            {row.map((key, ci) => (
              <PaletteCell
                key={`${ri}-${ci}-${key}`}
                symbolKey={key}
                tooltip={tooltipPrefix && key ? (SYMBOL_NAMES[tooltipPrefix + key.slice(0, 4)] ?? '') : ''}
                focused={selectActive && ri === cursorRow && ci === cursorCol}
              />
            ))}
          </div>
        ))}
      </div>

      {mirror && (
        <footer className="palette-foot">
          <button
            type="button"
            className={`palette-mirror clickable${lower ? ' active' : ''}`}
            onClick={toggleMirror}
            data-tip={`${lower ? 'Un-mirror' : 'Mirror'} (⇧,)`}
          >
            {lower ? 'Un-mirror' : 'Mirror'}
          </button>
        </footer>
      )}
    </>
  );
}
