// Live captions: browser speech recognition + a small "heard=correct" word list.
// Used by the EventCam camera (painted onto photos/video) and the big-screen view.

export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'pt-BR', label: 'Portuguese' },
  { code: 'nl-NL', label: 'Dutch' },
  { code: 'hi-IN', label: 'Hindi' },
];

// One rule per line. "heard=Correct" fixes a mis-heard phrase; a single word fixes its spelling/capitals.
export const DEFAULT_WORDS = [
  'so car=soca', 'soka=soca', 'sokka=soca', 'fay tay=fete', 'fet=fete',
  'joo vay=J’ouvert', 'jew vay=J’ouvert', 'jouvay=J’ouvert',
  'rid dim=riddim', 'riddum=riddim', 'back a nal=bacchanal',
  'carnival', 'Trinidad', 'Tobago', 'Jamaica', 'Barbados', 'Grenada', 'Guyana', 'Port of Spain',
  'calypso', 'chutney', 'steelpan', 'bacchanal', 'soca', 'fete', 'riddim',
  'Riddim Room',
].join('\n');

export interface CaptionState {
  supported: boolean;
  running: boolean;
  error: string;
  lang: string;
  words: string;
  interim: string;
  lines: string[]; // recent finished sentences, newest last
  updatedAt: number;
}

const KEY = 'rr-captions-v1';
let state: CaptionState = {
  supported: typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
  running: false, error: '', lang: 'en-US', words: DEFAULT_WORDS, interim: '', lines: [], updatedAt: 0,
};
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (typeof saved.lang === 'string') state.lang = saved.lang;
  if (typeof saved.words === 'string') state.words = saved.words;
} catch { /* storage may be unavailable */ }

const subs = new Set<() => void>();
function set(patch: Partial<CaptionState>) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
}
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getState = () => state;

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ lang: state.lang, words: state.words })); } catch { /* ignore */ }
}
export function setLang(lang: string) {
  set({ lang }); persist();
  if (rec) { restart = true; try { rec.stop(); } catch { /* ignore */ } }
}
export function setWords(words: string) { set({ words }); persist(); }
export function resetWords() { setWords(DEFAULT_WORDS); }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function applyWords(text: string, rules = state.words): string {
  let out = text;
  for (const raw of rules.split('\n')) {
    const line = raw.trim(); if (!line) continue;
    const eq = line.indexOf('=');
    const heard = (eq > 0 ? line.slice(0, eq) : line).trim();
    const right = (eq > 0 ? line.slice(eq + 1) : line).trim();
    if (!heard || !right) continue;
    try { out = out.replace(new RegExp('(^|[^\\p{L}\\p{N}])' + esc(heard) + '(?![\\p{L}\\p{N}])', 'giu'), (_m, pre) => pre + right); } catch { /* bad rule */ }
  }
  return out;
}

let rec: any = null;
let restart = false;

export function startCaptions() {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) { set({ supported: false, error: 'This browser has no speech recognition. Try Chrome or Edge.' }); return; }
  if (rec) return;
  const r = new SR();
  r.continuous = true; r.interimResults = true; r.lang = state.lang;
  r.onresult = (e: any) => {
    let interim = ''; const finals: string[] = [];
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finals.push(t); else interim += t;
    }
    const lines = finals.length ? [...state.lines, ...finals.map((t) => applyWords(t.trim()))].slice(-8) : state.lines;
    set({ interim: applyWords(interim.trim()), lines, updatedAt: Date.now(), error: '' });
  };
  r.onerror = (e: any) => {
    const code = e && e.error;
    if (code === 'not-allowed' || code === 'service-not-allowed') { set({ error: 'Microphone permission was blocked.', running: false }); rec = null; }
    else if (code && code !== 'no-speech' && code !== 'aborted') set({ error: 'Captions problem: ' + code });
  };
  r.onend = () => {
    if (!rec) return;
    if (state.running || restart) { restart = false; try { r.lang = state.lang; r.start(); } catch { /* already started */ } }
  };
  rec = r;
  set({ running: true, error: '', interim: '' });
  try { r.start(); } catch { /* ignore */ }
}

export function stopCaptions() {
  const r = rec; rec = null;
  set({ running: false, interim: '' });
  try { r && r.stop(); } catch { /* ignore */ }
}
export const toggleCaptions = () => (state.running ? stopCaptions() : startCaptions());

// Text to show right now (current sentence), empty after a few quiet seconds.
export function currentText(now = Date.now(), holdMs = 5000): string {
  if (!state.running && !state.updatedAt) return '';
  if (now - state.updatedAt > holdMs) return '';
  return (state.interim || state.lines[state.lines.length - 1] || '').trim();
}

// Paint captions onto a canvas (called every frame by EventCam, so photos and videos include them).
export function drawCaption(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  if (!state.running) return;
  drawCaptionText(ctx, canvas, currentText());
}

// bottomFrac = where the caption box ends, as a fraction of the height (0.94 = near the bottom).
export function drawCaptionText(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string, bottomFrac = 0.94) {
  if (!text) return;
  const w = canvas.width, h = canvas.height;
  const size = Math.round(Math.min(w, h) * 0.05);
  ctx.save();
  ctx.font = `800 ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const maxW = w * 0.86; const words = text.split(/\s+/); const lines: string[] = []; let cur = '';
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; } else cur = test;
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(-3); const lh = size * 1.25; const boxH = shown.length * lh + size * 0.6;
  const boxW = Math.min(maxW + size, Math.max(...shown.map((l) => ctx.measureText(l).width)) + size * 1.2);
  const cx = w / 2; const bottom = h * bottomFrac; const top = bottom - boxH;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  const r = size * 0.4; const x = cx - boxW / 2;
  ctx.beginPath(); ctx.moveTo(x + r, top); ctx.arcTo(x + boxW, top, x + boxW, bottom, r); ctx.arcTo(x + boxW, bottom, x, bottom, r);
  ctx.arcTo(x, bottom, x, top, r); ctx.arcTo(x, top, x + boxW, top, r); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.lineWidth = size * 0.08; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  shown.forEach((l, i) => { const y = top + size * 0.3 + lh * (i + 0.5); ctx.strokeText(l, cx, y); ctx.fillText(l, cx, y); });
  ctx.restore();
}

if (typeof window !== 'undefined') {
  (window as any).__rrDrawCaption = drawCaption;
  // Small helper so the display can be checked without a microphone.
  (window as any).__rrCaptions = {
    inject: (t: string) => set({ running: true, lines: [...state.lines, applyWords(t)].slice(-8), interim: '', updatedAt: Date.now() }),
  };
}
