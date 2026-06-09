import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { installBridge, applyState, storedUiLang } from './lib/bridge';
import { installTooltip } from './lib/tooltip';
import { parseHash } from './lib/url';
import { UI_DEFAULTS } from './store/uiStore';

installBridge();
installTooltip();

const hash = parseHash();
// UI language priority: explicit URL request → saved choice (localStorage) → English.
const ui = hash.ui || storedUiLang() || UI_DEFAULTS.ui;
applyState({ ...UI_DEFAULTS, ...hash, ui });

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
