import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { useSignStore } from '../store/signStore';
import { useLangStore } from '../store/langStore';
import { useToolStore, type Tool } from '../store/toolStore';
import { useTranslation } from '../hooks/useTranslation';
import { IANASignedLanguages } from '../i18n/ianaLanguages';
import { signedLanguageName, spokenLanguageName, spokenApiCode, mouthingSupported } from '../i18n/languageNames';
import { signSvg } from '../lib/sign';
import { LanguageIcon, HandIcon, MouthIcon, TranslateIcon } from './icons';

const API = 'https://signwriting.nagish.io';
const DEBOUNCE_MS = 300;

// Ping /health the first time fingerspelling/mouthing opens: confirms the server is up and
// warms the machine so the first real request isn't slow. Retries on a future open if it fails.
let warmed = false;
function warmUp(): void {
  if (warmed) return;
  warmed = true;
  fetch(`${API}/health`).catch(() => {
    warmed = false;
  });
}
const SPOKEN_CODES = [...new Set(IANASignedLanguages.map((l) => l.spoken).filter(Boolean))];
const SIGNED_TO_SPOKEN = new Map(IANASignedLanguages.map((l) => [l.signed, l.spoken]));
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

function LanguagePopover() {
  const { signed, spoken, set } = useLangStore();
  const { t } = useTranslation();

  const spokenOptions = useMemo(() => SPOKEN_CODES.map((code) => ({ code, name: spokenLanguageName(code) })).sort(byName), []);
  // Cross-filter: when a spoken language is chosen, only its paired sign languages are offered.
  const signedOptions = useMemo(() => {
    const seen = new Set<string>();
    return IANASignedLanguages.filter((l) => l.signed && (!spoken || l.spoken === spoken))
      .filter((l) => (seen.has(l.signed) ? false : (seen.add(l.signed), true)))
      .map((l) => ({ code: l.signed, name: signedLanguageName(l.signed) }))
      .sort(byName);
  }, [spoken]);

  return (
    <div className="tool-popover">
      <label className="tool-field">
        <span>{t('spoken')}</span>
        <select value={spoken} onChange={(e) => set({ spoken: e.target.value, signed: SIGNED_TO_SPOKEN.get(signed) === e.target.value ? signed : '' })}>
          <option value="">—</option>
          {spokenOptions.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="tool-field">
        <span>{t('signed')}</span>
        <select value={signed} onChange={(e) => set({ signed: e.target.value, spoken: SIGNED_TO_SPOKEN.get(e.target.value) || spoken })}>
          <option value="">—</option>
          {signedOptions.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="tool-clear" onClick={() => set({ signed: '', spoken: '' })}>
        {t('clear')}
      </button>
    </div>
  );
}

function GeneratePopover({ tool, onClose }: { tool: 'fingerspelling' | 'mouthing'; onClose: () => void }) {
  const [text, setText] = useState('');
  const [fsw, setFsw] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const addSign = useSignStore((s) => s.addSign);
  const { signed, spoken } = useLangStore();
  const { t } = useTranslation();

  useEffect(() => {
    inputRef.current?.focus();
    warmUp();
  }, []);

  useEffect(() => {
    if (!text.trim()) {
      setFsw('');
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('loading');
      const url =
        tool === 'fingerspelling'
          ? `${API}/fingerspelling?text=${encodeURIComponent(text)}&signed_language=${signed}`
          : `${API}/mouthing?text=${encodeURIComponent(text)}&spoken_language=${spokenApiCode(spoken)}`;
      try {
        const res = await fetch(url, { signal: controller.signal });
        const data = (await res.json()) as { fsw?: string };
        setFsw(data.fsw || '');
        setStatus(data.fsw ? 'idle' : 'empty');
      } catch {
        if (!controller.signal.aborted) {
          setFsw('');
          setStatus('empty');
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, tool, signed, spoken]);

  const accept = () => {
    if (!fsw) return;
    addSign(fsw);
    onClose();
  };

  return (
    <div className="tool-popover">
      <input
        ref={inputRef}
        className="tool-input"
        placeholder={tool === 'fingerspelling' ? t('wordToFingerspell') : t('wordToMouth')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            accept();
          }
        }}
      />
      <div className="tool-result">
        {status === 'loading' && <span className="tool-hint">…</span>}
        {status === 'empty' && <span className="tool-hint">{t('noResult')}</span>}
        {status === 'idle' && fsw && (
          <button
            type="button"
            className="tool-use"
            data-tip={t('addToCanvas')}
            aria-label={t('addToCanvas')}
            onClick={accept}
            dangerouslySetInnerHTML={{ __html: signSvg(fsw) }}
          />
        )}
      </div>
    </div>
  );
}

function ToolButton({
  tool,
  label,
  Icon,
  disabled,
  open,
  onToggle,
}: {
  tool: Tool;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`canvas-btn${open ? ' is-pressed' : ''}`}
      data-tip={label}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      data-tool={tool}
    >
      <Icon />
    </button>
  );
}

export function CanvasTooling() {
  const { open, setOpen } = useToolStore();
  const ref = useRef<HTMLDivElement>(null);
  const { signed, spoken } = useLangStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const toggle = (tool: Tool) => setOpen(open === tool ? null : tool);

  return (
    <div className="canvas-tooling" ref={ref}>
      {open === 'language' && <LanguagePopover />}
      {(open === 'fingerspelling' || open === 'mouthing') && (
        <GeneratePopover tool={open} onClose={() => setOpen(null)} />
      )}
      {open === 'translate' && (
        <div className="tool-popover">
          <p className="tool-soon">{t('comingSoon')}</p>
        </div>
      )}
      <div className="tooling-buttons">
        <ToolButton tool="language" label={t('languages')} Icon={LanguageIcon} open={open === 'language'} onToggle={() => toggle('language')} />
        <ToolButton
          tool="fingerspelling"
          label={signed ? `${t('fingerspelling')} (F)` : `${t('fingerspelling')} — ${t('pickSignedLanguage')}`}
          Icon={HandIcon}
          disabled={!signed}
          open={open === 'fingerspelling'}
          onToggle={() => toggle('fingerspelling')}
        />
        <ToolButton
          tool="mouthing"
          label={
            !spoken
              ? `${t('mouthing')} — ${t('pickSpokenLanguage')}`
              : !mouthingSupported(spoken)
                ? t('mouthingUnavailable')
                : `${t('mouthing')} (M)`
          }
          Icon={MouthIcon}
          disabled={!spoken || !mouthingSupported(spoken)}
          open={open === 'mouthing'}
          onToggle={() => toggle('mouthing')}
        />
        <ToolButton
          tool="translate"
          label={signed || spoken ? `${t('translate')} (T)` : t('translate')}
          Icon={TranslateIcon}
          disabled={!signed && !spoken}
          open={open === 'translate'}
          onToggle={() => toggle('translate')}
        />
      </div>
    </div>
  );
}
