import { create } from 'zustand';

export type Tab = '' | 'more' | 'png' | 'svg';
export type Skin = '' | 'inverse' | 'colorful';

export interface UiState {
  ui: string;
  alphabet: string;
  styling: string;
  charsets: string;
  grid: '0' | '1' | '2';
  skin: Skin;
  tab: Tab;

  size: string;
  pad: string;
  line: string;
  fill: string;
  back: string;
  colorize: boolean;

  set: (patch: Partial<UiState>) => void;
}

export const UI_DEFAULTS = { ui: 'en', alphabet: 'iswa', grid: '1', tab: '' } as const;

export const useUiStore = create<UiState>((set) => ({
  ui: 'en',
  alphabet: 'iswa',
  styling: '',
  charsets: '',
  grid: '1',
  skin: '',
  tab: '',

  size: '1',
  pad: '0',
  line: 'black',
  fill: 'white',
  back: '',
  colorize: false,

  set: (patch) => set(patch),
}));
