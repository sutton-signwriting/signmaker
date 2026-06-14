import { isFsw } from '../lib/sign';
import { useSignSvg } from '../hooks/useGlyph';

/** Render a translated label: plain text, or — when it's an FSW string (ASL) — as SignWriting. */
export function Sign({ text }: { text: string }) {
  const svg = useSignSvg(isFsw(text) ? text : '');
  if (!isFsw(text)) return <>{text}</>;
  return <span className="inline-sign" dangerouslySetInnerHTML={{ __html: svg }} />;
}
