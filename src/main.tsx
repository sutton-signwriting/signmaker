import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { installBridge, applyState, storedUiLang } from './lib/bridge';
import { installTooltip } from './lib/tooltip';
import { parseHash } from './lib/url';
import { UI_DEFAULTS } from './store/uiStore';
import { ensureSignWritingFonts } from './store/fontStore';

installBridge();
installTooltip();

// Start loading the SignWriting fonts now (non-blocking); glyph components render
// reactively once they are ready. Nothing else requests these fonts.
void ensureSignWritingFonts();

const hash = parseHash();
// UI language priority: explicit URL request → saved choice (localStorage) → English.
const ui = hash.ui || storedUiLang() || UI_DEFAULTS.ui;
applyState({ ...UI_DEFAULTS, ...hash, ui });

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
