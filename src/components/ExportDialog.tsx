import { useEffect, useState, type RefObject } from 'react';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../hooks/useTranslation';
import { useLightDismiss } from '../hooks/useLightDismiss';
import { signPng, signSvg, withStyle } from '../lib/sign';
import { useSignSvg } from '../hooks/useGlyph';
import { CopyIcon, CheckIcon } from './icons';
import { Sign } from './Sign';

type Format = 'png' | 'svg';

function triggerDownload(href: string, name: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  link.click();
}

async function copyPngToClipboard(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="export-field">
      <span><Sign text={label} /></span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function ExportDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  const { t } = useTranslation();
  const ui = useUiStore();
  const fswnorm = useSignStore((s) => s.fswnorm());
  const swunorm = useSignStore((s) => s.swunorm());
  const [format, setFormat] = useState<Format>('png');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  useLightDismiss(dialogRef);

  useEffect(() => {
    if (ui.tab === 'png' || ui.tab === 'svg') setFormat(ui.tab);
  }, [ui.tab]);

  const styled = withStyle(fswnorm, ui);
  const preview = useSignSvg(styled);
  const seg = (active: boolean) =>
    `export-tab${active ? ' export-tab-active' : ''}`;

  const download = () => {
    if (format === 'png') {
      triggerDownload(signPng(styled), 'sign.png');
    } else {
      const blob = new Blob([signSvg(styled)], { type: 'image/svg+xml' });
      triggerDownload(URL.createObjectURL(blob), 'sign.svg');
    }
  };

  const copy = async () => {
    await copyPngToClipboard(signPng(styled));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setToast(t('copiedToClipboard'));
    window.setTimeout(() => setToast(''), 1500);
  };

  return (
    <dialog ref={dialogRef} className="export-dialog" aria-label={t('download')} onClose={() => ui.set({ tab: '' })}>
      <header className="export-header">
        <div className="export-formats">
          <button type="button" className={seg(format === 'png')} onClick={() => setFormat('png')}>
            <Sign text={t('pngImage')} />
          </button>
          <button type="button" className={seg(format === 'svg')} onClick={() => setFormat('svg')}>
            <Sign text={t('svgImage')} />
          </button>
          <button type="button" className="export-tab export-copy-text" onClick={() => copyText(fswnorm)}>
            <CopyIcon /> FSW
          </button>
          <button type="button" className="export-tab export-copy-text" onClick={() => copyText(swunorm)}>
            <CopyIcon /> SWU
          </button>
        </div>
      </header>

      {toast && (
        <div className="export-toast" role="status">
          {toast}
        </div>
      )}

      <div className="export-body">
        <div className="export-preview">
          <div className="export-preview-img" dangerouslySetInnerHTML={{ __html: preview }} />
          {format === 'png' && (
            <button
              type="button"
              className="export-copy"
              data-tip={copied ? t('copied') : t('copyImage')}
              aria-label={t('copyImage')}
              onClick={copy}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          )}
        </div>
        <div className="export-options">
          <Field label={t('size')} value={ui.size} onChange={(size) => ui.set({ size })} />
          <Field label={t('pad')} value={ui.pad} onChange={(pad) => ui.set({ pad })} />
          <Field label={t('line')} value={ui.line} onChange={(line) => ui.set({ line })} />
          <Field label={t('fill')} value={ui.fill} onChange={(fill) => ui.set({ fill })} />
          <Field label={t('background')} value={ui.back} onChange={(back) => ui.set({ back })} />
          <label className="export-field export-check">
            <span><Sign text={t('colorize')} /></span>
            <input type="checkbox" checked={ui.colorize} onChange={(e) => ui.set({ colorize: e.target.checked })} />
          </label>
          <Field label="Styling" value={ui.styling} onChange={(styling) => ui.set({ styling })} />
        </div>
      </div>

      <footer className="export-actions">
        <button type="button" className="confirm-cancel" onClick={() => dialogRef.current?.close()}>
          <Sign text={t('cancel')} />
        </button>
        <button type="button" className="export-download" onClick={download}>
          <Sign text={t('download')} />
        </button>
      </footer>
    </dialog>
  );
}
