import type { AppId } from './chooseApp';

const LABEL: Record<AppId, string> = { caption: 'Live Caption', eventcam: 'EventCam' };

// Small floating link to jump to the other app. A full page load keeps each app's styles isolated.
export default function AppSwitcher({ current }: { current: AppId }) {
  const other: AppId = current === 'caption' ? 'eventcam' : 'caption';
  const go = () => {
    try { sessionStorage.setItem('rr-app', other); } catch { /* ignore */ }
    window.location.href = '/?app=' + other;
  };
  return (
    <button
      onClick={go}
      aria-label={`Switch to ${LABEL[other]}`}
      style={{
        position: 'fixed', left: 10, bottom: 10, zIndex: 9999, padding: '6px 12px',
        borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.55)',
        color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(6px)', opacity: 0.8,
      }}
    >
      Switch to {LABEL[other]}
    </button>
  );
}
