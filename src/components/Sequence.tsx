import { useSignStore } from '../store/signStore';
import { symbolSvg } from '../lib/sign';
import { useDrag, seqPosition } from '../hooks/useDrag';
import { useTranslation } from '../hooks/useTranslation';
import { save } from '../lib/bridge';
import { SaveIcon } from './icons';

function SortItem({ symbolKey }: { symbolKey: string }) {
  const reorderSeq = useSignStore((s) => s.reorderSeq);
  const onPointerDown = useDrag({
    ghost: true,
    onEnd: ({ dy, clientY, moved }) => {
      if (!moved) return;
      reorderSeq(seqPosition(clientY - dy), seqPosition(clientY));
    },
  });
  return <div className="sort" onPointerDown={onPointerDown} dangerouslySetInnerHTML={{ __html: symbolSvg(symbolKey) }} />;
}

export function Sequence() {
  const { t } = useTranslation();
  const sort = useSignStore((s) => s.sort);
  return (
    <div id="sequence">
      {/* Mobile only (CSS-hidden on desktop): the palette Save is unreachable while the drawer is closed. */}
      <button type="button" className="seq-save" onClick={save} data-tip={t('save')} aria-label={t('save')}>
        <SaveIcon />
      </button>
      {[...sort, ''].map((key, i) => (
        <SortItem key={`${key}-${i}`} symbolKey={key} />
      ))}
    </div>
  );
}
