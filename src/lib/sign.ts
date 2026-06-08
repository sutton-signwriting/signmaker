import { fsw as fontFsw } from '@sutton-signwriting/font-ttf';
import { convert, style as coreStyle } from '@sutton-signwriting/core';

export type Signbox = 'M' | 'L' | 'R' | 'B';

export interface Sym {
  key: string;
  x: number;
  y: number;
  selected: boolean;
}

const SYMBOL_SPATIAL = /S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g;
const COORD = /[0-9]{3}x[0-9]{3}/g;

// font-ttf measures glyphs via canvas, which throws until the SignWriting fonts have loaded.
// Guard every render/measure entry point so the app still mounts before fonts are ready.
const strOr = (fn: () => string | undefined, fallback: string): string => {
  try {
    return fn() || fallback;
  } catch {
    return fallback;
  }
};

export const signSvg = (fsw: string): string => strOr(() => fontFsw.signSvg(fsw), '');
export const symbolSvg = (key: string): string => (key ? strOr(() => fontFsw.symbolSvg(key), '') : '');
export const signPng = (fsw: string): string => strOr(() => fontFsw.signPng(fsw), '');
export const signNormalize = (fsw: string): string => strOr(() => fontFsw.signNormalize(fsw), fsw);
export const symbolSize = (key: string): [number, number] => {
  try {
    const size = fontFsw.symbolSize(key) as [number, number] | undefined;
    return Array.isArray(size) ? size : [0, 0];
  } catch {
    return [0, 0];
  }
};
export const fsw2swu = (text: string): string => convert.fsw2swu(text);
export const swu2fsw = (text: string): string => convert.swu2fsw(text);

/** font-ttf transforms can throw at a symbol's variant boundary; keep the key on failure. */
const safe = (fn: () => string, key: string): string => {
  try {
    return fn() || key;
  } catch {
    return key;
  }
};

export const scroll = (key: string, step: number): string => safe(() => fontFsw.symbolScroll(key, step > 0), key);
export const rotate = (key: string, step: number): string => safe(() => fontFsw.symbolRotate(key, step > 0), key);
export const mirror = (key: string): string => safe(() => fontFsw.symbolMirror(key), key);

/**
 * Cycle a symbol's fill digit (0-5), matching legacy ssw.fill. font-ttf's symbolFill is a
 * glyph fetch, not a key transform, so this is direct arithmetic on the fill nibble.
 */
export function fill(key: string, step: number): string {
  if (!/^S[1-3][0-9a-f]{2}[0-5][0-9a-f]$/.test(key)) return key;
  const next = (((parseInt(key[4], 10) + step) % 6) + 6) % 6;
  return key.slice(0, 4) + next + key.slice(5);
}

/** Extract the box marker (M/L/R/B) and spatial symbols from any FSW/SWU sign string. */
export function parseSign(input: string): { signbox: Signbox; symbols: Sym[]; sort: string[] } {
  let fsw = input;
  if (fsw && !/[SMLRB]/.test(fsw.slice(0, 1)) && /[\u{1D800}-\u{1DAAF}]/u.test(fsw)) {
    fsw = swu2fsw(fsw);
  }
  const boxMatch = fsw.match(/[LMRB]/);
  const signbox = (boxMatch ? boxMatch[0] : 'M') as Signbox;

  const symbols: Sym[] = (fsw.match(SYMBOL_SPATIAL) || []).map((token) => ({
    key: token.slice(0, 6),
    x: parseInt(token.slice(6, 9), 10),
    y: parseInt(token.slice(10, 13), 10),
    selected: false,
  }));

  const sortMatch = fsw.match(/A(S[1-3][0-9a-f]{2}[0-5][0-9a-f])+/);
  const sort = sortMatch ? (sortMatch[0].slice(1).match(/.{6}/g) ?? []) : [];

  return { signbox, symbols, sort };
}

/** Bounding box [minX, maxX, minY, maxY] over every coordinate token in an FSW string. */
function bbox(fsw: string): [number, number, number, number] | null {
  const coords = fsw.match(COORD);
  if (!coords) return null;
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  coords.forEach((coord, i) => {
    const x = parseInt(coord.slice(0, 3), 10);
    const y = parseInt(coord.slice(4, 7), 10);
    if (i === 0) {
      minX = maxX = x;
      minY = maxY = y;
    } else {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  });
  return [minX, maxX, minY, maxY];
}

/** Expand each symbol with its bottom-right corner so bbox() captures the full extent. */
function maxExpand(symbols: Sym[]): string {
  return symbols
    .map((s) => {
      const [w, h] = symbolSize(s.key);
      return `${s.x}x${s.y}${s.x + w}x${s.y + h}`;
    })
    .join('');
}

const pad3 = (n: number): string => String(n).padStart(3, '0');

/**
 * The live FSW for the current symbols, with the box marker positioned at the sign's
 * max extent — a faithful port of legacy signmaker.vm.fswlive (index.js:240-251).
 */
export function fswlive(signbox: Signbox, sort: string[], symbols: Sym[]): string {
  const placeholder = `${signbox}500x500`;
  let fsw = placeholder;
  if (sort.length) fsw = `A${sort.join('')}${fsw}`;
  if (symbols.length) {
    for (const s of symbols) fsw += `${s.key}${pad3(s.x)}x${pad3(s.y)}`;
    const box = bbox(`${placeholder}${maxExpand(symbols)}`);
    if (box) fsw = fsw.replace(placeholder, `${signbox}${pad3(box[1])}x${pad3(box[3])}`);
  }
  return fsw === placeholder ? '' : fsw;
}

export const fswnorm = (signbox: Signbox, sort: string[], symbols: Sym[]): string => {
  const live = fswlive(signbox, sort, symbols);
  return live ? signNormalize(live) : '';
};

export const swunorm = (signbox: Signbox, sort: string[], symbols: Sym[]): string =>
  fsw2swu(fswnorm(signbox, sort, symbols));

export const swulive = (signbox: Signbox, sort: string[], symbols: Sym[]): string =>
  fsw2swu(fswlive(signbox, sort, symbols));

export interface StyleOptions {
  size: string;
  pad: string;
  line: string;
  fill: string;
  back: string;
  colorize: boolean;
  styling: string;
}

/** Compose the FSW + style string consumed by signSvg/signPng for the PNG/SVG tabs. */
export function withStyle(fsw: string, opts: StyleOptions): string {
  if (!fsw) return fsw;
  const composed = coreStyle.compose({
    colorize: opts.colorize || undefined,
    padding: opts.pad ? parseInt(opts.pad, 10) : undefined,
    background: opts.back || undefined,
    detail: opts.line || opts.fill ? [opts.line || 'black', opts.fill || 'white'] : undefined,
    zoom: opts.size && opts.size !== '1' ? parseFloat(opts.size) : undefined,
  });
  return `${fsw}${composed ?? ''}${opts.styling ?? ''}`;
}

/** Pixel/unit extent [minX, maxX, minY, maxY] of the placed symbols, for auto-panning the view. */
export function extent(symbols: Sym[]): [number, number, number, number] | null {
  if (!symbols.length) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const s of symbols) {
    const [w, h] = symbolSize(s.key);
    minX = Math.min(minX, s.x);
    maxX = Math.max(maxX, s.x + w);
    minY = Math.min(minY, s.y);
    maxY = Math.max(maxY, s.y + h);
  }
  return [minX, maxX, minY, maxY];
}
