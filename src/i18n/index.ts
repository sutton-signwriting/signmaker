import type { Messages } from './locales/types';
import en from './locales/en';

export type { Messages };

/** UI languages offered in the picker. `english`/`native` build the label "English - Native". */
export interface UiLanguage {
  code: string;
  english: string;
  native: string;
}

export const UI_LANGUAGES: UiLanguage[] = [
  { code: 'en', english: 'English', native: 'English' },
  { code: 'ase', english: 'American Sign Language', native: '' },
  { code: 'ar', english: 'Arabic', native: 'العربيّة' },
  { code: 'de', english: 'German', native: 'Deutsch' },
  { code: 'es', english: 'Spanish', native: 'Español' },
  { code: 'fr', english: 'French', native: 'Français' },
  { code: 'no', english: 'Norwegian', native: 'Norsk' },
  { code: 'ptBR', english: 'Portuguese (Brazil)', native: 'Português Brasileiro' },
  { code: 'ru', english: 'Russian', native: 'Русский' },
];

/** "German - Deutsch", or just the English name when native is missing/identical (English, ASL). */
export const languageLabel = ({ english, native }: UiLanguage): string =>
  !native || native === english ? english : `${english} - ${native}`;

const loaders: Record<string, () => Promise<{ default: Partial<Messages> }>> = {
  ase: () => import('./locales/ase'),
  ar: () => import('./locales/ar'),
  de: () => import('./locales/de'),
  es: () => import('./locales/es'),
  fr: () => import('./locales/fr'),
  no: () => import('./locales/no'),
  ptBR: () => import('./locales/ptBR'),
  ru: () => import('./locales/ru'),
};

const cache: Record<string, Messages> = { en };

/** Synchronously available dictionary for an already-loaded locale (English until loaded). */
export const loadedLocale = (code: string): Messages => cache[code] ?? en;

/** Lazily fetch a locale, merging it over English so missing keys fall back gracefully. */
export async function loadLocale(code: string): Promise<Messages> {
  if (cache[code]) return cache[code];
  const loader = loaders[code];
  if (!loader) return en;
  const merged: Messages = { ...en, ...(await loader()).default };
  cache[code] = merged;
  return merged;
}
