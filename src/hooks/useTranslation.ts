import { useMemo } from 'react';
import { useUiStore } from '../store/uiStore';
import { buildTranslator, type Translator } from '../i18n/translate';

export function useTranslation(): Translator {
  const ui = useUiStore((s) => s.ui);
  return useMemo(() => buildTranslator(ui), [ui]);
}
