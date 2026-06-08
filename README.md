# SignMaker

A modern editor for creating and editing signs in **Formal SignWriting in ASCII (FSW)** and
**SignWriting in Unicode (SWU)**. Drag symbols from the palette onto the signbox, fine-tune
with the command tools, and export as PNG/SVG. The editor can be used directly, embedded in an
iframe, and driven entirely through URL parameters.

This is a React/Vite/TypeScript/Tailwind rewrite of the original
[sutton-signwriting/signmaker](https://github.com/sutton-signwriting/signmaker) (a mithril.js
app). The original is preserved verbatim under [`legacy/`](./legacy) and a shared end-to-end
suite runs against **both** implementations to guarantee behavioral parity.

## Stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand) for state
- [`@sutton-signwriting/core`](https://www.npmjs.com/package/@sutton-signwriting/core) +
  [`@sutton-signwriting/font-ttf`](https://www.npmjs.com/package/@sutton-signwriting/font-ttf)
  for FSW/SWU parsing, transforms, and SVG/PNG rendering
- [Playwright](https://playwright.dev) for e2e tests

## Develop

```sh
npm install
npm run dev          # modern app at http://localhost:5173 (and /demo.html)
npm run serve:legacy # original app at http://localhost:4983
```

## Test

The Playwright config defines two projects — `legacy` and `modern` — that run the same specs
against each app. Green on both proves the rewrite preserves the original's behavior.

```sh
npm test                          # both implementations
npx playwright test --project=modern
npx playwright test --project=legacy
```

## Build & typecheck

```sh
npm run build       # tsc + vite build → dist/
npm run typecheck
```

## Repository layout

```
src/             # the React app (engine wrapper, stores, components, i18n)
index.html       # editor entry      demo.html  # iframe demo harness
public/          # vendored Sutton SignWriting TTF fonts + palette alphabet data
tests/           # shared e2e suite (runs against both apps)
legacy/          # the original mithril app, unchanged and still runnable
```

## URL parameters

State lives in the URL hash query, e.g.
`#?ui=ase&fsw=AS10011S10019…M525x535…&skin=colorful`:

| key | meaning |
|-----|---------|
| `ui` | language code for the user interface |
| `alphabet` | sign-language code for the palette symbol set |
| `fsw` | the sign value in Formal SignWriting in ASCII |
| `swu` | the sign value in SignWriting in Unicode |
| `styling` | style string for image creation |
| `grid` | grid detail: `0`, `1`, or `2` |
| `skin` | `inverse` or `colorful` |
| `tab` | active tab: ``, `more`, `png`, `svg` |

## iframe messaging

Embed the editor in an `<iframe>` and communicate with `postMessage`:

- **Load** a sign by posting `{ fsw }`, `{ swu }`, or `{ signmaker: 'load', swu }`. The same
  keys as URL parameters are accepted.
- **Save** posts `{ signmaker: 'save', fsw, swu }` back to the parent window.

See [`demo.html`](./demo.html) for a working harness.

## License

MIT — original work copyright © Steve Slevinski. See [`legacy/`](./legacy) for the upstream project.
