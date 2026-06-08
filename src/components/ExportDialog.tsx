import { useState, type RefObject } from 'react';
import { useSignStore } from '../store/signStore';
import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../hooks/useTranslation';
import { useLightDismiss } from '../hooks/useLightDismiss';
import { signPng, signSvg, withStyle } from '../lib/sign';

type Format = 'png' | 'svg';

function triggerDownload(href: string, name: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  link.click();
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="export-field">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function ExportDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  const { t } = useTranslation();
  const ui = useUiStore();
  const fswnorm = useSignStore((s) => s.fswnorm());
  const [format, setFormat] = useState<Format>('png');
  useLightDismiss(dialogRef);

  const styled = withStyle(fswnorm, ui);
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

  return (
    <dialog ref={dialogRef} className="export-dialog">
      <header className="export-header">
        <h2>{t('download')}</h2>
        <div className="export-formats">
          <button type="button" className={seg(format === 'png')} onClick={() => setFormat('png')}>
            {t('pngImage')}
          </button>
          <button type="button" className={seg(format === 'svg')} onClick={() => setFormat('svg')}>
            {t('svgImage')}
          </button>
        </div>
      </header>

      <div className="export-body">
        <div className="export-preview" dangerouslySetInnerHTML={{ __html: signSvg(styled) || '' }} />
        <div className="export-options">
          <Field label={t('size')} value={ui.size} onChange={(size) => ui.set({ size })} />
          <Field label={t('pad')} value={ui.pad} onChange={(pad) => ui.set({ pad })} />
          <Field label={t('line')} value={ui.line} onChange={(line) => ui.set({ line })} />
          <Field label={t('fill')} value={ui.fill} onChange={(fill) => ui.set({ fill })} />
          <Field label={t('background')} value={ui.back} onChange={(back) => ui.set({ back })} />
          <label className="export-field export-check">
            <span>{t('colorize')}</span>
            <input type="checkbox" checked={ui.colorize} onChange={(e) => ui.set({ colorize: e.target.checked })} />
          </label>
          <Field label="Styling" value={ui.styling} onChange={(styling) => ui.set({ styling })} />
        </div>
      </div>

      <footer className="export-actions">
        <button type="button" className="confirm-cancel" onClick={() => dialogRef.current?.close()}>
          {t('cancel')}
        </button>
        <button type="button" className="export-download" onClick={download}>
          {t('download')}
        </button>
      </footer>
    </dialog>
  );
}
