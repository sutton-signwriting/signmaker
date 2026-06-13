import signedNamesEn from '@sign-mt/i18n/build/signedLanguages/en.json';
import spokenNamesEn from '@sign-mt/i18n/build/languages/en.json';

const signedNames = signedNamesEn as Record<string, string>;
const spokenNames = spokenNamesEn as Record<string, string>;

let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
} catch {
  displayNames = null;
}

/** Intl.DisplayNames, but null when unavailable or when it just echoes the code back (unknown). */
function intlName(code: string): string | null {
  if (!displayNames) return null;
  try {
    const name = displayNames.of(code);
    return name && name.toLowerCase() !== code.toLowerCase() ? name : null;
  } catch {
    return null;
  }
}

export const signedLanguageName = (code: string): string => intlName(code) ?? signedNames[code] ?? code;
export const spokenLanguageName = (code: string): string => intlName(code) ?? spokenNames[code] ?? code;

/**
 * The mouthing API uses epitran (https://github.com/dmort27/epitran) language-script codes;
 * IANA uses ISO 639-1. This maps ISO 639-1 → an epitran-supported code where one exists.
 * Languages without epitran support are omitted (mouthing returns no result for them).
 */
const SPOKEN_API: Record<string, string> = {
  en: 'eng-Latn', es: 'spa-Latn', fr: 'fra-Latn', de: 'deu-Latn', pt: 'por-Latn', it: 'ita-Latn',
  nl: 'nld-Latn', sv: 'swe-Latn', fi: 'fin-Latn', pl: 'pol-Latn', cs: 'ces-Latn', tr: 'tur-Latn',
  ro: 'ron-Latn', hu: 'hun-Latn', ca: 'cat-Latn', hr: 'hrv-Latn', sl: 'slv-Latn', et: 'est-Latn',
  lv: 'lav-Latn', lt: 'lit-Latn', sq: 'sqi-Latn', id: 'ind-Latn', ms: 'msa-Latn', vi: 'vie-Latn',
  ru: 'rus-Cyrl', uk: 'ukr-Cyrl', sr: 'srp-Cyrl', kk: 'kaz-Cyrl', ky: 'kir-Cyrl', tg: 'tgk-Cyrl',
  ar: 'ara-Arab', fa: 'fas-Arab', ur: 'urd-Arab', ug: 'uig-Arab',
  hi: 'hin-Deva', mr: 'mar-Deva', bn: 'ben-Beng', ta: 'tam-Taml', te: 'tel-Telu', kn: 'kan-Knda',
  ml: 'mal-Mlym', or: 'ori-Orya', pa: 'pan-Guru', si: 'sin-Sinh', th: 'tha-Thai', km: 'khm-Khmr',
  lo: 'lao-Laoo', my: 'mya-Mymr', ka: 'kat-Geor', am: 'amh-Ethi', ti: 'tir-Ethi', ko: 'kor-Hang',
  ha: 'hau-Latn', yo: 'yor-Latn', zu: 'zul-Latn', xh: 'xho-Latn', sn: 'sna-Latn', so: 'som-Latn',
  sw: 'swa-Latn', cy: 'cym-Latn', ga: 'gle-Latn', gl: 'glg-Latn', af: 'afr-Latn',
};

export const spokenApiCode = (iso1: string): string => SPOKEN_API[iso1] ?? iso1;
export const mouthingSupported = (iso1: string): boolean => iso1 in SPOKEN_API;
