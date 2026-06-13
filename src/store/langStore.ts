import { create } from 'zustand';

const KEY = 'signmaker-languages';

function load(): { signed: string; spoken: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { signed: saved.signed || '', spoken: saved.spoken || '' };
  } catch {
    return { signed: '', spoken: '' };
  }
}

interface LangState {
  /** Signed language code for fingerspelling (e.g. "ase"). */
  signed: string;
  /** Spoken language code for mouthing (e.g. "eng-Latn"). */
  spoken: string;
  set: (patch: Partial<Pick<LangState, 'signed' | 'spoken'>>) => void;
}

export const useLangStore = create<LangState>((set, get) => ({
  ...load(),
  set: (patch) => {
    set(patch);
    const { signed, spoken } = get();
    try {
      localStorage.setItem(KEY, JSON.stringify({ signed, spoken }));
    } catch {
      /* ignore persistence errors */
    }
  },
}));
