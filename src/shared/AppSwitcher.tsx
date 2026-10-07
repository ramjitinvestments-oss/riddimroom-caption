import { Suspense, lazy, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import qrcode from 'qrcode-generator';
import type { AppId } from './chooseApp';
import * as cap from './captions';
import * as gal from './gallery';
const CaptionStudio = lazy(() => import('./captionStudio'));

const LABEL: Record<AppId, string> = { caption: 'Live Caption', eventcam: 'EventCam' };
const btn: CSSProperties = { background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', backdropFilter: 'blur(6px)' };
const card: CSSProperties = { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: 16, width: 'min(560px, 94vw)', maxHeight: '88vh', overflow: 'auto', fontFamily: 'Inter, system-ui, sans-serif' };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 17 }}>{title}</strong>
          <button style={{ ...btn, padding: '4px 12px' }} onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function QR({ url }: { url: string }) {
  const svg = useMemo(() => { try { const q = qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch { return ''; } }, [url]);
  return <div style={{ background: '#fff', borderRadius: 8, padding: 6, width: 140, height: 140, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function SharePanel() {
  const o = window.location.origin;
  const links = [
    { name: 'Guest camera (EventCam)', url: `${o}/?app=eventcam&mode=camera` },
    { name: 'Live Caption', url: `${o}/?app=caption` },
    { name: 'Big-screen captions', url: `${o}/?screen=captions` },
  ];
  const [copied, setCopied] = useState('');
  const copy = async (u: string) => { try { await navigator.clipboard.writeText(u); setCopied(u); setTimeout(() => setCopied(''), 1500); } catch { /* ignore */ } };
  const share = async (u: string, n: string) => { try { await (navigator as any).share({ title: n, url: u }); } catch { /* cancelled */ } };
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ fontSize: 13, opacity: 0.75 }}>Guests scan a code to open the app on their phone. No install needed.</div>
      {links.map((l) => (
        <div key={l.url} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <QR url={l.url} />
          <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
            <strong>{l.name}</strong>
            <span style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-all' }}>{l.url}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={btn} onClick={() => copy(l.url)}>{copied === l.url ? 'Copied' : 'Copy link'}</button>
              {typeof navigator !== 'undefined' && (navigator as any).share && <button style={btn} onClick={() => share(l.url, l.name)}>Share</button>}
              <a style={{ ...btn, textDecoration: 'none', display: 'inline-block' }} href={l.url} target="_blank" rel="noreferrer">Open</a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CaptionsPanel() {
  const s = useSyncExternalStore(cap.subscribe, cap.getState, cap.getState);
  const field: CSSProperties = { width: '100%', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: 8, fontSize: 13, boxSizing: 'border-box' };
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 13, opacity: 0.75 }}>When on, captions appear on the camera and are included in photos and videos you capture. Works best in Chrome or Edge.</div>
      <button style={{ ...btn, background: s.running ? '#b91c1c' : '#15803d', borderRadius: 10 }} onClick={cap.toggleCaptions}>{s.running ? 'Turn captions off' : 'Turn captions on'}</button>
      {(s.error || !s.supported) && <div style={{ color: '#fca5a5', fontSize: 13 }}>{s.error || 'This browser has no speech recognition. Try Chrome or Edge.'}</div>}
      {s.running && <div style={{ fontSize: 14, background: '#000', borderRadius: 8, padding: 8, minHeight: 20 }}>{cap.currentText() || 'Listening…'}</div>}
      <label style={{ fontSize: 13 }}>Language
        <select style={{ ...field, marginTop: 4 }} value={s.lang} onChange={(e) => cap.setLang(e.target.value)}>{cap.LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
      </label>
      <label style={{ fontSize: 13 }}>Word list (one per line: <code>heard=Correct</code> or just the right spelling)
        <textarea style={{ ...field, marginTop: 4, height: 150, fontFamily: 'monospace' }} value={s.words} onChange={(e) => cap.setWords(e.target.value)} />
      </label>
      <button style={{ ...btn, borderRadius: 10 }} onClick={cap.resetWords}>Reset word list</button>
      <a style={{ ...btn, borderRadius: 10, textDecoration: 'none', textAlign: 'center' }} href="/?screen=captions" target="_blank" rel="noreferrer">Open big-screen captions</a>
    </div>
  );
}

function GalleryPanel() {
  const [studio, setStudio] = useState<gal.GalleryItem | null>(null);
  const items = useSyncExternalStore(gal.subscribe, gal.getItems, gal.getItems);
  const urls = useMemo(() => items.map((i) => URL.createObjectURL(i.blob)), [items]);
  useEffect(() => () => { urls.forEach((u) => URL.revokeObjectURL(u)); }, [urls]);
  const [show, setShow] = useState(-1);
  const [confirmClear, setConfirmClear] = useState(false);
  const photos = items.map((it, i) => ({ it, u: urls[i] })).filter((x) => x.it.kind === 'photo');
  useEffect(() => { if (show < 0 || !photos.length) return; const t = setInterval(() => setShow((n) => (n + 1) % photos.length), 4000); return () => clearInterval(t); }, [show, photos.length]);
  const ext = (b: Blob, k: string) => (k === 'photo' ? 'png' : b.type.includes('mp4') ? 'mp4' : 'webm');
  const share = async (it: gal.GalleryItem) => {
    const f = new File([it.blob], `riddimroom_${it.ts}.${ext(it.blob, it.kind)}`, { type: it.blob.type });
    try { if ((navigator as any).canShare?.({ files: [f] })) await (navigator as any).share({ files: [f] }); } catch { /* cancelled */ }
  };
  if (studio) return <Suspense fallback={<div>Loading…</div>}><CaptionStudio item={studio} onClose={() => setStudio(null)} /></Suspense>;
  if (show >= 0 && photos[show % Math.max(photos.length, 1)]) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShow(-1)}>
        <img src={photos[show % photos.length].u} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        <span style={{ position: 'absolute', bottom: 12, color: '#fff', opacity: 0.6, fontSize: 13 }}>Tap to exit slideshow</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 13, opacity: 0.75 }}>The last {items.length ? items.length : 'few'} captures from this device (up to 30). They stay on this device only.</div>
      {!items.length && <div style={{ opacity: 0.6 }}>Nothing yet. Take a photo or video and it shows up here.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
        {[...items].reverse().map((it) => { const idx = items.indexOf(it); return (
          <div key={it.id} style={{ display: 'grid', gap: 4 }}>
            {it.kind === 'photo' ? <img src={urls[idx]} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 8 }} /> : <video src={urls[idx]} muted playsInline style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 8 }} />}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <a style={{ ...btn, padding: '4px 8px', fontSize: 11, textDecoration: 'none' }} href={urls[idx]} download={`riddimroom_${it.ts}.${ext(it.blob, it.kind)}`}>Save</a>
              <button style={{ ...btn, padding: '4px 8px', fontSize: 11 }} onClick={() => share(it)}>Share</button>
              {it.kind === 'video' && <button style={{ ...btn, padding: '4px 8px', fontSize: 11 }} onClick={() => setStudio(it)}>Captions</button>}
            </div>
          </div>); })}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {photos.length > 0 && <button style={{ ...btn, borderRadius: 10 }} onClick={() => setShow(0)}>Start slideshow</button>}
        {items.length > 0 && !confirmClear && <button style={{ ...btn, borderRadius: 10 }} onClick={() => setConfirmClear(true)}>Clear gallery</button>}
        {confirmClear && <button style={{ ...btn, borderRadius: 10, background: '#b91c1c' }} onClick={() => { void gal.clearGallery(); setConfirmClear(false); }}>Yes, delete all from this device</button>}
      </div>
    </div>
  );
}

// Small floating tools menu: switch app, captions, share/QR, big screen, gallery.
export default function AppSwitcher({ current }: { current: AppId }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'' | 'captions' | 'share' | 'gallery'>('');
  const other: AppId = current === 'caption' ? 'eventcam' : 'caption';
  const live = useSyncExternalStore(cap.subscribe, cap.getState, cap.getState).running;
  const go = () => {
    try { sessionStorage.setItem('rr-app', other); } catch { /* ignore */ }
    window.location.href = '/?app=' + other;
  };
  const pick = (p: typeof panel) => { setPanel(p); setOpen(false); };
  return (
    <>
      <div style={{ position: 'fixed', left: 10, bottom: 10, zIndex: 9999, display: 'grid', gap: 6, justifyItems: 'start' }}>
        {open && (
          <>
            <button style={btn} onClick={go} aria-label={`Switch to ${LABEL[other]}`}>Switch to {LABEL[other]}</button>
            {current === 'eventcam' && <button style={btn} onClick={() => pick('captions')}>{live ? 'Captions: ON' : 'Captions'}</button>}
            <button style={btn} onClick={() => pick('share')}>Share / QR codes</button>
            <a style={{ ...btn, textDecoration: 'none' }} href="/?screen=captions" target="_blank" rel="noreferrer">Big-screen captions</a>
            {current === 'eventcam' && <button style={btn} onClick={() => pick('gallery')}>Gallery</button>}
          </>
        )}
        <button style={{ ...btn, opacity: 0.85 }} onClick={() => setOpen((v) => !v)} aria-label="Tools" aria-expanded={open}>{open ? 'Close tools' : live ? 'Tools • CC on' : 'Tools'}</button>
      </div>
      {panel === 'captions' && <Modal title="Live captions" onClose={() => setPanel('')}><CaptionsPanel /></Modal>}
      {panel === 'share' && <Modal title="Share and QR codes" onClose={() => setPanel('')}><SharePanel /></Modal>}
      {panel === 'gallery' && <Modal title="Booth gallery" onClose={() => setPanel('')}><GalleryPanel /></Modal>}
    </>
  );
}
