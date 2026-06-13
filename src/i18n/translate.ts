import type { Messages } from './locales/types';

export type Replacements = Record<string, string | number>;

export interface Translator {
  t: (key: string, replacements?: Replacements) => string;
}

/** Build a lookup over a resolved dictionary, with {placeholder} interpolation. */
export function buildTranslator(dict: Messages): Translator {
  const table = dict as unknown as Record<string, string>;
  const t = (key: string, replacements: Replacements = {}): string => {
    const found = table[key];
    if (found == null) return `@@${key}@@`;
    return found.replace(/\{(\w*)\}/g, (_match, name: string) =>
      Object.prototype.hasOwnProperty.call(replacements, name) ? String(replacements[name]) : `{${name}}`,
    );
  };
  return { t };
}
