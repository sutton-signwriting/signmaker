import { defmessages, messages } from './messages';

export type Replacements = Record<string, string | number>;

export interface Translator {
  t: (key: string, replacements?: Replacements) => string;
}

const NS = '::';

/** Faithful port of translate.js getTranslationFunction (lookup + {placeholder} + namespace). */
export function buildTranslator(ui: string): Translator {
  const dict: Record<string, string> = { ...defmessages, ...(messages[ui] ?? {}) };

  const lookup = (key: string): string | null => {
    if (dict[key]) return dict[key];
    const [head, tail] = key.split(NS);
    const nested = (dict as Record<string, unknown>)[head];
    if (nested && typeof nested === 'object' && tail) {
      const value = (nested as Record<string, string>)[tail];
      if (value) return value;
    }
    return null;
  };

  const t = (key: string, replacements: Replacements = {}): string => {
    const found = lookup(key);
    if (found === null) return `@@${key}@@`;
    return found.replace(/\{(\w*)\}/g, (_match, name: string) =>
      Object.prototype.hasOwnProperty.call(replacements, name) ? String(replacements[name]) : `{${name}}`,
    );
  };

  return { t };
}

export const languageNames = (): { code: string; name: string }[] =>
  Object.keys(messages).map((code) => ({ code, name: messages[code].language ?? code }));
