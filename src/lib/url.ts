import { UI_DEFAULTS } from '../store/uiStore';

const KEYS = ['ui', 'alphabet', 'fsw', 'charsets', 'swu', 'styling', 'grid', 'skin', 'tab'] as const;
const DEFAULTS = UI_DEFAULTS as Record<string, string>;

export function parseHash(): Record<string, string> {
  const out: Record<string, string> = {};
  const i = window.location.href.indexOf('#?');
  if (i > -1) {
    for (const pair of decodeURI(window.location.href.slice(i + 2)).split('&')) {
      const eq = pair.indexOf('=');
      if (eq > 0) out[pair.slice(0, eq)] = pair.slice(eq + 1);
      else if (pair) out[pair] = '';
    }
  }
  return out;
}

export function buildHash(params: Record<string, string>): string {
  const query = KEYS.map((key) => {
    const value = params[key];
    return value && DEFAULTS[key] !== value ? `${key}=${value}` : undefined;
  })
    .filter((item): item is string => item !== undefined)
    .join('&');
  return `?${query}`;
}

export function pushHash(params: Record<string, string>): void {
  history.pushState(null, '', `${window.location.pathname}#${buildHash(params)}`);
}
