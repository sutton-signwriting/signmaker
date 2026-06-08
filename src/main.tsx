import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { installBridge, applyState } from './lib/bridge';
import { installTooltip } from './lib/tooltip';
import { parseHash } from './lib/url';
import { UI_DEFAULTS } from './store/uiStore';

installBridge();
installTooltip();
applyState({ ...UI_DEFAULTS, ...parseHash() });

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
