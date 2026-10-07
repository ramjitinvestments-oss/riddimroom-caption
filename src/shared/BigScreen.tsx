import { StrictMode, useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { LANGUAGES, getState, subscribe, setLang, startCaptions, stopCaptions, currentText } from './captions';

// Full-screen live captions for a projector or TV. Open with /?screen=captions
function BigScreen() {
  const s = useSyncExternalStore(subscribe, getState, getState);
  const [size, setSize] = useState(() => { try { return Number(localStorage.getItem('rr-bs-size')) || 9; } catch { return 9; } });
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 500); return () => clearInterval(t); }, []);
  useEffect(() => { try { localStorage.setItem('rr-bs-size', String(size)); } catch { /* ignore */ } }, [size]);
  useEffect(() => {
    let lock: any = null;
    if (s.running) { try { (navigator as any).wakeLock?.request('screen').then((l: any) => { lock = l; }).catch(() => {}); } catch { /* ignore */ } }
    return () => { try { lock && lock.release(); } catch { /* ignore */ } };
  }, [s.running]);

  const text = currentText(Date.now(), 12000);
  const btn: CSSProperties = { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '8px 14px', fontSize: 14, cursor: 'pointer' };
  const toggleFs = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch { /* ignore */ } };
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: 12, opacity: s.running ? 0.25 : 1, transition: 'opacity .3s' }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')} onMouseLeave={(e) => (e.currentTarget.style.opacity = s.running ? '0.25' : '1')}>
        <button style={{ ...btn, background: s.running ? '#b91c1c' : '#15803d' }} onClick={() => (s.running ? stopCaptions() : startCaptions())}>{s.running ? 'Stop captions' : 'Start captions'}</button>
        <select style={btn} value={s.lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">{LANGUAGES.map((l) => <option key={l.code} value={l.code} style={{ color: '#000' }}>{l.label}</option>)}</select>
        <button style={btn} onClick={() => setSize((v) => Math.max(4, v - 1))} aria-label="Smaller text">A-</button>
        <button style={btn} onClick={() => setSize((v) => Math.min(16, v + 1))} aria-label="Bigger text">A+</button>
        <button style={btn} onClick={toggleFs}>Full screen</button>
        <span style={{ fontSize: 13, opacity: 0.8 }}>{s.error || (!s.supported ? 'Speech recognition needs Chrome or Edge.' : '')}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2vw', textAlign: 'center' }}>
        {text ? <div style={{ fontSize: `${size}vw`, fontWeight: 800, lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,.8)' }}>{text}</div>
          : <div style={{ fontSize: '2.2vw', opacity: 0.45 }}>{s.running ? 'Listening…' : 'Press "Start captions" and allow the microphone.'}</div>}
      </div>
    </div>
  );
}

export function mount(root: HTMLElement) {
  document.title = 'Riddim Room — Big screen captions';
  createRoot(root).render(<StrictMode><BigScreen /></StrictMode>);
}
