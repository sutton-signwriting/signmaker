import { isFsw, signSvg } from '../lib/sign';

/** Render a translated label: plain text, or — when it's an FSW string (ASL) — as SignWriting. */
export function Sign({ text }: { text: string }) {
  if (!isFsw(text)) return <>{text}</>;
  return <span className="inline-sign" dangerouslySetInnerHTML={{ __html: signSvg(text) }} />;
}
