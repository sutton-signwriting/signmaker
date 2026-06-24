import { type RefObject } from 'react';
import { useSignStore } from '../store/signStore';
import { useUiStore, type Skin } from '../store/uiStore';
import { useTranslation } from '../hooks/useTranslation';
import { useLightDismiss } from '../hooks/useLightDismiss';
import { UI_LANGUAGES, languageLabel } from '../i18n';
import { signedLanguageName } from '../i18n/languageNames';
import { ALPHABETS } from '../i18n/alphabets';
import { applyState, setUiLang, share } from '../lib/bridge';
import { Sign } from './Sign';

// Selection is shown with a border (not a dark fill) so the background stays light enough to
// read ASL SignWriting labels. Both states use border-2 to avoid a layout shift on selection.
const PILL = 'rounded-md border-2 border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-100';
const PILL_ACTIVE = 'rounded-md border-2 border-slate-800 bg-white px-3 py-1.5 text-sm font-semibold';

export function SettingsDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  useLightDismiss(dialogRef);
  const ui = useUiStore();
  const sign = useSignStore();
  const { t } = useTranslation();
  const alpha = ALPHABETS.map((code) => ({ code, name: signedLanguageName(code) })).sort((a, b) => a.name.localeCompare(b.name));
  const gridSeg = (g: string) => (ui.grid === g ? PILL_ACTIVE : PILL);
  const skinSeg = (sk: Skin) => (ui.skin === sk || (sk === '' && !ui.skin) ? PILL_ACTIVE : PILL);

  return (
    <dialog ref={dialogRef} className="settings-dialog" onClose={() => ui.set({ tab: '' })}>
      <header className="export-header">
        <h2><Sign text={t('settings')} /></h2>
        <button type="button" className="dialog-close" aria-label={t('cancel')} onClick={() => dialogRef.current?.close()}>
          ✕
        </button>
      </header>
      <div className="more-grid">
        <label className="more-row">
          <span><Sign text={t('userInterface')} /></span>
          <select value={ui.ui} onChange={(e) => setUiLang(e.target.value)}>
            {UI_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {languageLabel(lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="more-row">
          <span><Sign text={t('alphabet')} /></span>
          <select value={ui.alphabet} onChange={(e) => applyState({ alphabet: e.target.value })}>
            <option value="iswa">{t('iswa2010')}</option>
            {alpha.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <div className="more-row">
          <span><Sign text={t('grid')} /></span>
          <div className="seg-group">
            <button type="button" className={gridSeg('0')} onClick={() => ui.set({ grid: '0' })}>
              <Sign text={t('grid0')} />
            </button>
            <button type="button" className={gridSeg('1')} onClick={() => ui.set({ grid: '1' })}>
              <Sign text={t('grid1')} />
            </button>
            <button type="button" className={gridSeg('2')} onClick={() => ui.set({ grid: '2' })}>
              <Sign text={t('grid2')} />
            </button>
          </div>
        </div>
        <div className="more-row">
          <span><Sign text={t('skin')} /></span>
          <div className="seg-group">
            <button type="button" className={skinSeg('')} onClick={() => ui.set({ skin: '' })}>
              <Sign text={t('blackOnWhite')} />
            </button>
            <button type="button" className={skinSeg('inverse')} onClick={() => ui.set({ skin: 'inverse' })}>
              <Sign text={t('whiteOnBlack')} />
            </button>
            <button type="button" className={skinSeg('colorful')} onClick={() => ui.set({ skin: 'colorful' })}>
              <Sign text={t('colorful')} />
            </button>
          </div>
        </div>
        <label className="more-row">
          <span>FSW</span>
          <input id="fsw" value={sign.fswlive()} onInput={(e) => sign.setFromFsw((e.target as HTMLInputElement).value)} />
        </label>
        <label className="more-row">
          <span>SWU</span>
          <input id="swu" value={sign.swulive()} onInput={(e) => sign.setFromSwu((e.target as HTMLInputElement).value)} />
        </label>
        <label className="more-row">
          <span>Styling</span>
          <input value={ui.styling} onInput={(e) => ui.set({ styling: (e.target as HTMLInputElement).value })} />
        </label>
        <button
          type="button"
          className={PILL}
          onClick={() => {
            dialogRef.current?.close();
            ui.set({ shortcutsOpen: true });
          }}
        >
          <Sign text={t('keyboardShortcuts')} />
        </button>
        {'share' in navigator ? (
          <button type="button" className={PILL} onClick={share}>
            <Sign text={t('share')} />
          </button>
        ) : null}
      </div>
    </dialog>
  );
}
