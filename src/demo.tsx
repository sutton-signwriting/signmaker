import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import './demo.css';

const PARAMS = ['ui', 'alphabet', 'fsw', 'swu', 'styling', 'grid', 'skin', 'tab'] as const;
type Key = 'server' | (typeof PARAMS)[number] | 'view' | 'iframesize';

const LOCAL = window.location.origin + window.location.pathname.replace(/\/demo(\.html)?$/, '/');
const PUBLIC = 'https://sutton-signwriting.github.io/signmaker/';
const OPTIONS: Record<'server' | (typeof PARAMS)[number], Record<string, string>> = {
  server: { local: LOCAL, public: PUBLIC },
  ui: { en: 'English', ase: 'ASL', ptBR: 'Portuguese' },
  alphabet: { iswa: 'ISWA 2010', ase: 'ASL' },
  fsw: { 'AS1f010S10018S20600R519x524S10018485x494S1f010490x494S20600481x476': 'sample sign' },
  swu: {},
  styling: { '-CZ2': 'colorize' },
  grid: { '0': 'off', '1': 'cross', '2': 'fine' },
  skin: { inverse: 'inverse', colorful: 'colorful' },
  tab: { more: 'more', png: 'png', svg: 'svg' },
};
const SERVER_BASE: Record<string, string> = { local: LOCAL, public: PUBLIC };

function parseHash(): Partial<Record<Key, string>> {
  const out: Partial<Record<Key, string>> = {};
  const i = window.location.href.indexOf('#?');
  if (i > -1) {
    for (const pair of decodeURI(window.location.href.slice(i + 2)).split('&')) {
      const eq = pair.indexOf('=');
      if (eq > 0) out[pair.slice(0, eq) as Key] = pair.slice(eq + 1);
    }
  }
  return { server: 'local', ...out };
}

const chip = (active: boolean) =>
  `px-2.5 py-1 rounded-md border text-sm transition-colors ${
    active ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-300 hover:bg-slate-100'
  }`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  options,
  showNone,
  onSelect,
}: {
  label: string;
  value?: string;
  options: Record<string, string>;
  showNone?: boolean;
  onSelect: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-16 shrink-0 font-mono text-xs text-slate-500">{label}</span>
      {showNone && (
        <button className={chip(!value)} onClick={() => onSelect(undefined)}>
          none
        </button>
      )}
      {Object.entries(options).map(([val, name]) => (
        <button key={val} className={chip(value === val)} onClick={() => onSelect(val)}>
          {name}
        </button>
      ))}
    </div>
  );
}

function Demo() {
  const [s, setS] = useState<Partial<Record<Key, string>>>(parseHash);
  const [received, setReceived] = useState<unknown[]>([]);
  const [sent, setSent] = useState<unknown[]>([]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === 'object') setReceived((prev) => [e.data, ...prev].slice(0, 50));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const paramHash = `?${PARAMS.map((k) => (s[k] ? `${k}=${s[k]}` : undefined)).filter(Boolean).join('&')}`;
  const src = (SERVER_BASE[s.server ?? 'local'] ?? LOCAL) + 'index.html#' + paramHash;

  const setKey = (key: Key, value: string | undefined) => {
    const next = { ...s, [key]: value };
    setS(next);
    const hash = `?${(['server', ...PARAMS] as Key[]).map((k) => (next[k] ? `${k}=${next[k]}` : undefined)).filter(Boolean).join('&')}`;
    history.replaceState(null, '', `${window.location.pathname}#${hash}`);
  };

  const send = (key: string, value: string) => {
    const msg = { [key]: value };
    setSent((prev) => [msg, ...prev].slice(0, 50));
    (document.getElementById('signmaker') as HTMLIFrameElement | null)?.contentWindow?.postMessage(msg, '*');
  };

  const Log = ({ title, items, empty }: { title: string; items: unknown[]; empty: string }) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <ul className="swu flex-1 space-y-1 overflow-y-auto text-xs text-slate-600">
        {items.length === 0 && <li className="text-slate-400">{empty}</li>}
        {items.map((msg, i) => (
          <li key={i} className="break-all rounded bg-slate-50 px-2 py-1">
            {JSON.stringify(msg)}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-800">
      <div className="flex min-h-0 flex-1">
        {/* Controls — left, scrollable */}
        <aside className="w-96 shrink-0 space-y-5 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <div>
            <h1 className="text-lg font-bold">SignMaker — iframe demo</h1>
            <p className="text-xs text-slate-500">
              Embed the editor and exchange <code>postMessage</code> events.
            </p>
          </div>

          <Section title="Source">
            <Row label="server" value={s.server} options={OPTIONS.server} onSelect={(v) => setKey('server', v)} />
          </Section>

          <Section title="URL parameters">
            {PARAMS.map((key) => (
              <Row key={key} label={key} value={s[key]} options={OPTIONS[key]} showNone onSelect={(v) => setKey(key, v)} />
            ))}
          </Section>

          <Section title="Send message to iframe">
            {PARAMS.map((key) => (
              <div key={key} className="flex flex-wrap items-center gap-1.5">
                <span className="w-16 shrink-0 font-mono text-xs text-slate-500">{key}</span>
                <button className={chip(false)} onClick={() => send(key, '')}>
                  clear
                </button>
                {Object.entries(OPTIONS[key]).map(([val, name]) => (
                  <button key={val} className={chip(false)} onClick={() => send(key, val)}>
                    {name}
                  </button>
                ))}
              </div>
            ))}
          </Section>

          <Section title="Embed code">
            <a className="text-sm text-blue-600 hover:underline" href={src} target="_blank" rel="noreferrer">
              open in a new tab ↗
            </a>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-2 text-[11px] leading-relaxed text-slate-100">
              {`<iframe src="${src}"></iframe>`}
            </pre>
          </Section>
        </aside>

        {/* Preview — right, large */}
        <main className="min-h-0 flex-1 p-3">
          <iframe id="signmaker" title="signmaker" src={src} className="h-full w-full rounded-lg border border-slate-300 bg-white shadow" />
        </main>
      </div>

      {/* Messages — bottom */}
      <footer className="flex h-44 shrink-0 gap-6 border-t border-slate-200 bg-white p-3">
        <Log title="Messages received" items={received} empty="none yet — try Save in the editor" />
        <Log title="Messages sent" items={sent} empty="none yet" />
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<Demo />);
