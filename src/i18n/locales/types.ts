/** The UI string keys the app renders. English (en.ts) is the source of truth and the
 *  fallback for every other locale, so a locale only needs to override what it translates. */
export interface Messages {
  /** Native name of this language, shown in the language picker. */
  language: string;

  undo: string;
  redo: string;
  selectPrev: string;
  selectNext: string;
  center: string;
  mirror: string;
  delete: string;
  clearAll: string;
  rotateCCW: string;
  rotateCW: string;
  variationPrev: string;
  variationNext: string;
  fillPrev: string;
  fillNext: string;
  top: string;
  save: string;
  symbols: string;
  download: string;
  pngImage: string;
  svgImage: string;
  size: string;
  pad: string;
  line: string;
  fill: string;
  background: string;
  colorize: string;
  cancel: string;
  userInterface: string;
  alphabet: string;
  iswa2010: string;
  grid0: string;
  grid1: string;
  grid2: string;
  blackOnWhite: string;
  whiteOnBlack: string;
  colorful: string;
  share: string;
  clear: string;

  duplicate: string;
  bringToFront: string;
  settings: string;
  export: string;
  grid: string;
  skin: string;
  variation: string;
  languages: string;
  fingerspelling: string;
  mouthing: string;
  translate: string;
  pickSignedLanguage: string;
  pickSpokenLanguage: string;
  mouthingUnavailable: string;
  textToTranslate: string;
  addToCanvas: string;
  noResult: string;
  wordToFingerspell: string;
  wordToMouth: string;
  spoken: string;
  signed: string;
  copyImage: string;
  copied: string;
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
}
