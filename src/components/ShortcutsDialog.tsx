import { useEffect, useState, type RefObject } from 'react';
import { useUiStore } from '../store/uiStore';
import { useShortcutStore } from '../store/shortcutStore';
import { useTranslation } from '../hooks/useTranslation';
import { useLightDismiss } from '../hooks/useLightDismiss';
import { SHORTCUTS, shortcutKeys, isCustomizable, eventToBinding } from '../lib/shortcuts';

/** Remap any shortcut to a key combo of your choice, with a per-action reset to the default. Opened
 *  from the hold-⌘ sheet's Edit button and from Settings. */
export function ShortcutsDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  useLightDismiss(dialogRef);
  const { t } = useTranslation();
  const set = useUiStore((s) => s.set);
  useShortcutStore((s) => s.overrides); // re-render when a binding changes
  const [recording, setRecording] = useState<string | null>(null);

  // While recording, capture the next key combo for the chosen action. Capture phase + stopPropagation
  // so the combo is recorded rather than triggering its (or another) shortcut.
  useEffect(() => {
    if (!recording) return;
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') return setRecording(null);
      const binding = eventToBinding(event);
      if (!binding) return; // lone modifier — keep waiting
      useShortcutStore.getState().setBinding(recording, [binding]);
      setRecording(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recording]);

  return (
    <dialog
      ref={dialogRef}
      className="shortcuts-dialog"
      onClose={() => {
        setRecording(null);
        set({ shortcutsOpen: false });
      }}
    >
      <header className="export-header">
        <h2>{t('keyboardShortcuts')}</h2>
        <div className="shortcuts-head-actions">
          <button type="button" className="shortcuts-reset-all" onClick={() => useShortcutStore.getState().resetAll()}>
            {t('resetAll')}
          </button>
          <button type="button" className="dialog-close" aria-label={t('cancel')} onClick={() => dialogRef.current?.close()}>
            ✕
          </button>
        </div>
      </header>
      <div className="shortcuts-list">
        {SHORTCUTS.map((sc) => {
          const editable = isCustomizable(sc.id);
          return (
            <div key={sc.id} className="shortcut-edit-row">
              <span className="shortcut-edit-label">{t(sc.label)}</span>
              <button
                type="button"
                className={`shortcut-key-btn${recording === sc.id ? ' recording' : ''}`}
                disabled={!editable}
                onClick={() => editable && setRecording(sc.id)}
              >
                {recording === sc.id ? t('pressKeys') : shortcutKeys(sc.id) || '—'}
              </button>
              <button
                type="button"
                className="shortcut-reset"
                aria-label={t('reset')}
                disabled={!editable}
                onClick={() => useShortcutStore.getState().reset(sc.id)}
              >
                ↺
              </button>
            </div>
          );
        })}
      </div>
    </dialog>
  );
}
