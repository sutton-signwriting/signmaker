import { useSignStore } from '../store/signStore';
import { symbolSvg } from '../lib/sign';
import { useDrag, seqPosition } from '../hooks/useDrag';

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
  const sort = useSignStore((s) => s.sort);
  return (
    <div id="sequence">
      {[...sort, ''].map((key, i) => (
        <SortItem key={`${key}-${i}`} symbolKey={key} />
      ))}
    </div>
  );
}
