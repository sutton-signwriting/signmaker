import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../hooks/useTranslation';
import { SHORTCUTS, shortcutKeys } from '../lib/shortcuts';

/** Temporary shortcut sheet: while ⌘/Ctrl is held (see useKeyboard), list every shortcut from the
 *  central registry. Releasing the modifier hides it. Read-only — a peek, not a focusable dialog. */
export function ShortcutOverlay() {
  const active = useUiStore((s) => s.learnShortcuts);
  const { t } = useTranslation();
  if (!active) return null;
  return (
    <div className="shortcut-overlay" aria-hidden>
      <div className="shortcut-sheet">
        <h2>{t('keyboardShortcuts')}</h2>
        <dl>
          {SHORTCUTS.map((sc) => (
            <div key={sc.id} className="shortcut-row">
              <dt>{t(sc.label)}</dt>
              <dd>
                <kbd>{shortcutKeys(sc)}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
