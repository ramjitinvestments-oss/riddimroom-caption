import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { LANGUAGES, applyWords, drawCaptionText, getState } from './captions';
import * as gal from './gallery';

// After-the-fact captions: auto-write them from the video's sound, edit them line by line,
// then save a new video with the captions burned in. Runs entirely in the browser.

interface Seg { id: number; start: number; end: number; text: string }
const WHISPER_LANG: Record<string, string> = { 'en-US': 'english', 'en-GB': 'english', 'es-ES': 'spanish', 'fr-FR': 'french', 'pt-BR': 'portuguese', 'nl-NL': 'dutch', 'hi-IN': 'hindi' };
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
const POS: Record<string, number> = { Bottom: 0.94, Middle: 0.58, Top: 0.22 };
let uid = 1;
let asrPromise: Promise<any> | null = null;

const btn: CSSProperties = { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const field: CSSProperties = { background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: 6, fontSize: 13, boxSizing: 'border-box' };

// Break long phrases into short readable lines (max ~6 words), timed in proportion to length.
function splitChunk(text: string, start: number, end: number, maxWords = 6): Seg[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const groups: string[][] = [];
  for (let i = 0; i < words.length; i += maxWords) groups.push(words.slice(i, i + maxWords));
  const total = groups.reduce((n, g) => n + g.join(' ').length, 0) || 1;
  let t = start; const span = Math.max(end - start, 0.8);
  return groups.map((g) => { const len = g.join(' ').length; const d = (len / total) * span; const seg = { id: uid++, start: +t.toFixed(2), end: +(t + d).toFixed(2), text: g.join(' ') }; t += d; return seg; });
}

async function decodeMono(blob: Blob): Promise<Float32Array> {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx({ sampleRate: 16000 });
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const n = buf.length; const out = new Float32Array(n);
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) out[i] += d[i] / buf.numberOfChannels; }
    return out;
  } finally { try { ctx.close(); } catch { /* ignore */ } }
}

async function getAsr(onStatus: (s: string) => void) {
  if (!asrPromise) {
    asrPromise = (async () => {
      const lib: any = await import(/* @vite-ignore */ LIB);
      lib.env.allowLocalModels = false;
      const progress_callback = (p: any) => { if (p && p.status === 'progress') onStatus(`Downloading the speech model (first time only): ${Math.round(p.progress || 0)}%`); };
      try { return await lib.pipeline('automatic-speech-recognition', 'onnx-community/whisper-base', { dtype: 'q8', device: 'wasm', progress_callback }); }
      catch { return await lib.pipeline('automatic-speech-recognition', 'onnx-community/whisper-base', { device: 'wasm', progress_callback }); }
    })();
    asrPromise.catch(() => { asrPromise = null; });
  }
  return asrPromise;
}

async function transcribe(blob: Blob, lang: string, onStatus: (s: string) => void): Promise<Seg[]> {
  onStatus('Reading the sound…');
  const audio = await decodeMono(blob);
  let peak = 0; for (let i = 0; i < audio.length; i += 50) peak = Math.max(peak, Math.abs(audio[i]));
  if (peak < 0.004) throw new Error('This video has no sound, so there is nothing to caption. Record again with the microphone on and allowed, or add lines by hand.');
  const asr = await getAsr(onStatus);
  onStatus('Writing the captions… this can take a little while.');
  const out: any = await asr(audio, { language: WHISPER_LANG[lang] || 'english', task: 'transcribe', return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 });
  const dur = audio.length / 16000;
  const chunks: any[] = out.chunks && out.chunks.length ? out.chunks : [{ text: out.text || '', timestamp: [0, dur] }];
  const segs = chunks.flatMap((c) => { const s = c.timestamp?.[0] ?? 0; const e = c.timestamp?.[1] ?? Math.min(dur, s + 3); return splitChunk(applyWords(String(c.text || '').trim()), s, e); });
  if (!segs.length) throw new Error('No speech was found in this video.');
  return segs;
}

async function burn(blob: Blob, segs: Seg[], bottom: number, onProgress: (p: number) => void): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  const v = document.createElement('video'); v.src = url; v.playsInline = true; v.preload = 'auto';
  await new Promise<void>((res, rej) => { v.onloadedmetadata = () => res(); v.onerror = () => rej(new Error('Could not open the video.')); });
  if (!isFinite(v.duration)) { v.currentTime = 1e101; await new Promise((r) => v.addEventListener('timeupdate', r, { once: true })); v.currentTime = 0; }
  const w = v.videoWidth, h = v.videoHeight; const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  const AC = window.AudioContext || (window as any).webkitAudioContext; const ac = new AC();
  const dest = ac.createMediaStreamDestination(); ac.createMediaElementSource(v).connect(dest);
  const stream = c.captureStream(30); dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  const mime = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000, audioBitsPerSecond: 128000 });
  const chunks: Blob[] = []; rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise<Blob>((res) => { rec.onstop = () => res(new Blob(chunks, { type: rec.mimeType || mime })); });
  let raf = 0;
  const draw = () => {
    x.drawImage(v, 0, 0, w, h); const t = v.currentTime; const s = segs.find((q) => t >= q.start && t <= q.end);
    if (s) drawCaptionText(x, c, s.text, bottom); onProgress(Math.min(1, t / (v.duration || 1))); raf = requestAnimationFrame(draw);
  };
  const ended = new Promise<void>((res) => { v.onended = () => res(); });
  rec.start(500); await ac.resume(); await v.play(); draw(); await ended;
  cancelAnimationFrame(raf); await new Promise((r) => setTimeout(r, 400)); rec.stop();
  const out = await done; try { ac.close(); } catch { /* ignore */ } URL.revokeObjectURL(url); return out;
}

export default function CaptionStudio({ item, onClose }: { item: gal.GalleryItem; onClose: () => void }) {
  const url = useMemo(() => URL.createObjectURL(item.blob), [item]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const vref = useRef<HTMLVideoElement>(null);
  const [segs, setSegs] = useState<Seg[]>([]);
  const [t, setT] = useState(0);
  const [lang, setLang] = useState(getState().lang);
  const [pos, setPos] = useState('Bottom');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const upd = (id: number, patch: Partial<Seg>) => setSegs((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const cur = segs.find((s) => t >= s.start && t <= s.end);

  const auto = async () => {
    setErr(''); setMsg(''); setBusy('auto');
    try { const r = await transcribe(item.blob, lang, setMsg); setSegs(r); setMsg(`Done: ${r.length} lines. Check and fix any words below.`); }
    catch (e: any) { setErr(e?.message || 'Could not write the captions.'); setMsg(''); }
    setBusy('');
  };
  const save = async () => {
    setErr(''); setMsg('Saving… 0%'); setBusy('save');
    try {
      const out = await burn(item.blob, segs, POS[pos], (p) => setMsg(`Saving the captioned video… ${Math.round(p * 100)}%`));
      await gal.addCapture(out, 'video');
      const a = document.createElement('a'); a.href = URL.createObjectURL(out); a.download = `riddimroom_captioned_${Date.now()}.${out.type.includes('mp4') ? 'mp4' : 'webm'}`; a.click();
      setMsg('Saved. The captioned video is in your Gallery and was downloaded.');
    } catch (e: any) { setErr(e?.message || 'Could not save the video.'); setMsg(''); }
    setBusy('');
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button style={btn} onClick={onClose}>Back to gallery</button>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Captions are made on this device.</span>
      </div>
      <div style={{ position: 'relative', background: '#000', borderRadius: 10, overflow: 'hidden' }}>
        <video ref={vref} src={url} controls playsInline onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} style={{ width: '100%', maxHeight: '36vh', display: 'block' }} />
        {cur && <div style={{ position: 'absolute', left: 8, right: 8, bottom: 48, textAlign: 'center', pointerEvents: 'none' }}><span style={{ background: 'rgba(0,0,0,0.65)', padding: '3px 8px', borderRadius: 6, fontSize: 15, fontWeight: 700 }}>{cur.text}</span></div>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={field} value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
        <button style={{ ...btn, background: '#15803d' }} disabled={!!busy} onClick={auto}>{busy === 'auto' ? 'Working…' : 'Auto-write captions'}</button>
        <button style={btn} disabled={!!busy} onClick={() => { const s = vref.current?.currentTime ?? 0; setSegs((l) => [...l, { id: uid++, start: +s.toFixed(1), end: +(s + 2).toFixed(1), text: '' }].sort((a, b) => a.start - b.start)); }}>Add a line here</button>
        <button style={btn} disabled={!!busy || !segs.length} onClick={() => setSegs((l) => l.map((s) => ({ ...s, text: applyWords(s.text) })))}>Apply word list</button>
      </div>
      {msg && <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div>}
      {err && <div style={{ fontSize: 13, color: '#fca5a5' }}>{err}</div>}
      <div style={{ display: 'grid', gap: 6, maxHeight: '30vh', overflow: 'auto' }}>
        {!segs.length && <div style={{ fontSize: 13, opacity: 0.6 }}>No captions yet. Press "Auto-write captions", or play the video and use "Add a line here".</div>}
        {segs.map((s) => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '58px 58px 1fr auto', gap: 4, alignItems: 'center', background: cur?.id === s.id ? 'rgba(21,128,61,0.25)' : 'transparent', borderRadius: 8 }}>
            <input style={field} type="number" step="0.1" min="0" value={s.start} onChange={(e) => upd(s.id, { start: Number(e.target.value) })} aria-label="Start seconds" />
            <input style={field} type="number" step="0.1" min="0" value={s.end} onChange={(e) => upd(s.id, { end: Number(e.target.value) })} aria-label="End seconds" />
            <input style={field} value={s.text} onFocus={() => { if (vref.current) vref.current.currentTime = s.start; }} onChange={(e) => upd(s.id, { text: e.target.value })} aria-label="Caption text" />
            <button style={{ ...btn, padding: '4px 8px' }} onClick={() => setSegs((l) => l.filter((q) => q.id !== s.id))} aria-label="Delete line">{'✕'}</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>Position <select style={field} value={pos} onChange={(e) => setPos(e.target.value)}>{Object.keys(POS).map((p) => <option key={p}>{p}</option>)}</select></label>
        <button style={{ ...btn, background: '#1d4ed8' }} disabled={!!busy || !segs.length} onClick={save}>{busy === 'save' ? 'Saving…' : 'Save captioned video'}</button>
      </div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>Saving plays the video once at normal speed to record it with the captions, so it takes as long as the video.</div>
    </div>
  );
}
