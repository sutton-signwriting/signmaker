import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../hooks/useTranslation';
import { SHORTCUTS, shortcutKeys } from '../lib/shortcuts';

/** Temporary shortcut sheet: while ⌘/Ctrl is held (see useKeyboard), list every shortcut from the
 *  central registry. Releasing the modifier hides it. The Edit button opens the remapping dialog. */
export function ShortcutOverlay() {
  const active = useUiStore((s) => s.learnShortcuts);
  const set = useUiStore((s) => s.set);
  const { t } = useTranslation();
  if (!active) return null;
  return (
    <div className="shortcut-overlay" aria-hidden>
      <div className="shortcut-sheet">
        <header className="shortcut-sheet-head">
          <h2>{t('keyboardShortcuts')}</h2>
          <button type="button" className="shortcut-edit" onClick={() => set({ shortcutsOpen: true, learnShortcuts: false })}>
            {t('edit')}
          </button>
        </header>
        <dl>
          {SHORTCUTS.map((sc) => (
            <div key={sc.id} className="shortcut-row">
              <dt>{t(sc.label)}</dt>
              <dd>
                <kbd>{shortcutKeys(sc.id)}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
