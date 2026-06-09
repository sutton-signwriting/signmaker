import { useRef, type ComponentType, type PointerEvent, type ReactNode, type SVGProps } from 'react';
import { useSignStore } from '../store/signStore';
import { useTranslation } from '../hooks/useTranslation';
import { startMove, stopMove, type Direction } from '../lib/arrowRepeat';
import { tip, HINTS } from '../lib/shortcuts';
import { useLightDismiss } from '../hooks/useLightDismiss';
import { SettingsDialog } from './SettingsDialog';
import { ExportDialog } from './ExportDialog';
import {
  UndoIcon,
  RedoIcon,
  CenterIcon,
  MirrorIcon,
  DeleteIcon,
  TrashIcon,
  DuplicateIcon,
  BringToFrontIcon,
  SettingsIcon,
  ExportIcon,
  SelectPrevIcon,
  SelectNextIcon,
  RotateCwIcon,
  RotateCcwIcon,
  VariationIcon,
  FillIcon,
  MinusIcon,
  PlusIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from './icons';

function IconButton({
  id,
  label,
  onClick,
  disabled,
  tipPos,
  children,
}: {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tipPos?: 'right';
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      className="canvas-btn"
      data-tip={label}
      data-tip-pos={tipPos}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StepSection({
  Icon,
  section,
  minusId,
  plusId,
  minusTip,
  plusTip,
  onMinus,
  onPlus,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  section: string;
  minusId: string;
  plusId: string;
  minusTip: string;
  plusTip: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="edit-section">
      <IconButton id={minusId} label={minusTip} tipPos="right" onClick={onMinus}>
        <MinusIcon />
      </IconButton>
      <span className="edit-section-icon" data-tip={section} data-tip-pos="right">
        <Icon />
      </span>
      <IconButton id={plusId} label={plusTip} tipPos="right" onClick={onPlus}>
        <PlusIcon />
      </IconButton>
    </div>
  );
}

function ArrowKey({ dir, label, children }: { dir: Direction; label: string; children: ReactNode }) {
  const press = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startMove(dir, e.shiftKey);
  };
  return (
    <button
      type="button"
      id={`arrow-${dir}`}
      className="arrow-key"
      data-tip={label}
      aria-label={label}
      onPointerDown={press}
      onPointerUp={() => stopMove(dir)}
      onPointerCancel={() => stopMove(dir)}
    >
      {children}
    </button>
  );
}

export function CanvasControls() {
  const { t } = useTranslation();
  const s = useSignStore();
  const confirmRef = useRef<HTMLDialogElement>(null);
  const settingsRef = useRef<HTMLDialogElement>(null);
  const exportRef = useRef<HTMLDialogElement>(null);
  useLightDismiss(confirmRef);

  return (
    <>
      <div className="canvas-tools canvas-tools-left">
        <IconButton id="tool-undo" label={tip(t, 'undo')} onClick={s.undo} disabled={s.cursor <= 0}>
          <UndoIcon />
        </IconButton>
        <IconButton id="tool-redo" label={tip(t, 'redo')} onClick={s.redo} disabled={s.cursor + 1 >= s.history.length}>
          <RedoIcon />
        </IconButton>
        <span className="canvas-divider" />
        <IconButton id="tool-selectPrev" label={tip(t, 'selectPrev')} onClick={() => s.select(-1)}>
          <SelectPrevIcon />
        </IconButton>
        <IconButton id="tool-selectNext" label={tip(t, 'selectNext')} onClick={() => s.select(1)}>
          <SelectNextIcon />
        </IconButton>
        <span className="canvas-divider" />
        <IconButton id="tool-copy" label={`${t('duplicate')} (${HINTS.copy})`} onClick={s.copy}>
          <DuplicateIcon />
        </IconButton>
        <IconButton id="tool-over" label={`${t('bringToFront')} (${HINTS.over})`} onClick={s.over}>
          <BringToFrontIcon />
        </IconButton>
        <IconButton id="tool-center" label={tip(t, 'center')} onClick={s.center}>
          <CenterIcon />
        </IconButton>
        <IconButton id="tool-mirror" label={tip(t, 'mirror')} onClick={s.mirror}>
          <MirrorIcon />
        </IconButton>
      </div>

      <div className="canvas-tools canvas-tools-right">
        <IconButton id="tool-delete" label={tip(t, 'delete')} onClick={s.remove}>
          <DeleteIcon />
        </IconButton>
        <IconButton id="tool-clearAll" label={t('clearAll')} onClick={() => confirmRef.current?.showModal()}>
          <TrashIcon />
        </IconButton>
        <span className="canvas-divider" />
        <IconButton id="tool-settings" label={t('settings')} onClick={() => settingsRef.current?.showModal()}>
          <SettingsIcon />
        </IconButton>
        <IconButton id="tool-export" label={t('export')} onClick={() => exportRef.current?.showModal()}>
          <ExportIcon />
        </IconButton>
      </div>

      <div className="canvas-tools canvas-edit">
        <div className="edit-section">
          <IconButton id="tool-rotateCCW" label={tip(t, 'rotateCCW')} tipPos="right" onClick={() => s.rotate(-1)}>
            <RotateCcwIcon />
          </IconButton>
          <IconButton id="tool-rotateCW" label={tip(t, 'rotateCW')} tipPos="right" onClick={() => s.rotate(1)}>
            <RotateCwIcon />
          </IconButton>
        </div>
        <StepSection
          Icon={VariationIcon}
          section={t('variation')}
          minusId="tool-variationPrev"
          plusId="tool-variationNext"
          minusTip={tip(t, 'variationPrev')}
          plusTip={tip(t, 'variationNext')}
          onMinus={() => s.variation(-1)}
          onPlus={() => s.variation(1)}
        />
        <StepSection
          Icon={FillIcon}
          section={t('fill')}
          minusId="tool-fillPrev"
          plusId="tool-fillNext"
          minusTip={tip(t, 'fillPrev')}
          plusTip={tip(t, 'fillNext')}
          onMinus={() => s.fill(-1)}
          onPlus={() => s.fill(1)}
        />
      </div>

      <div className="arrow-pad">
        <ArrowKey dir="up" label={`${t('moveUp')} (↑)`}>
          <ChevronUp />
        </ArrowKey>
        <ArrowKey dir="left" label={`${t('moveLeft')} (←)`}>
          <ChevronLeft />
        </ArrowKey>
        <ArrowKey dir="down" label={`${t('moveDown')} (↓)`}>
          <ChevronDown />
        </ArrowKey>
        <ArrowKey dir="right" label={`${t('moveRight')} (→)`}>
          <ChevronRight />
        </ArrowKey>
      </div>

      <dialog ref={confirmRef} className="confirm-dialog">
        <p>{t('clearAll')}?</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-cancel" onClick={() => confirmRef.current?.close()}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="confirm-ok"
            onClick={() => {
              s.clear();
              confirmRef.current?.close();
            }}
          >
            {t('clearAll')}
          </button>
        </div>
      </dialog>

      <SettingsDialog dialogRef={settingsRef} />
      <ExportDialog dialogRef={exportRef} />
    </>
  );
}
