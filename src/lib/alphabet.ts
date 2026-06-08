export type Alphabet = Record<string, string[]>;

declare global {
  interface Window {
    alphabet?: Alphabet;
  }
}

/** Load a palette symbol set by sign-language code, mirroring the legacy script-injection loader. */
export function loadAlphabet(code: string): Promise<Alphabet> {
  const src = !code || code === 'iswa' ? `/alphabet.js?${code}` : `/alphabet/alphabet-${code}.js?${code}`;
  return new Promise((resolve, reject) => {
    delete window.alphabet;
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      document.head.removeChild(script);
      if (window.alphabet) resolve(window.alphabet);
      else reject(new Error(`alphabet ${code} did not define window.alphabet`));
    };
    script.onerror = () => {
      document.head.removeChild(script);
      reject(new Error(`failed to load alphabet ${code}`));
    };
    document.head.appendChild(script);
  });
}
