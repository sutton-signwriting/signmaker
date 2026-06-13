import { useMemo } from 'react';
import { useI18nStore } from '../store/i18nStore';
import { buildTranslator, type Translator } from '../i18n/translate';

export function useTranslation(): Translator {
  const dict = useI18nStore((s) => s.dict);
  return useMemo(() => buildTranslator(dict), [dict]);
}
