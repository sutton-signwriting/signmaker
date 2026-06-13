import { create } from 'zustand';
import en from '../i18n/locales/en';
import { loadLocale, loadedLocale, type Messages } from '../i18n';

interface I18nState {
  lang: string;
  dict: Messages;
  /** Switch UI language; loads the locale on demand and falls back to English until ready. */
  setLang: (code: string) => void;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  lang: 'en',
  dict: en,
  setLang: (code) => {
    if (code === get().lang) return;
    set({ lang: code, dict: loadedLocale(code) });
    void loadLocale(code).then((dict) => {
      if (get().lang === code) set({ dict });
    });
  },
}));
