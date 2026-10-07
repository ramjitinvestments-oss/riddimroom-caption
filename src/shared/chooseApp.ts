export type AppId = 'caption' | 'eventcam';

// Which app to show: ?app= override (remembered for the tab), else by hostname, else caption.
export function chooseApp(): AppId {
  try {
    const q = new URLSearchParams(window.location.search).get('app');
    if (q === 'caption' || q === 'eventcam') {
      sessionStorage.setItem('rr-app', q);
      return q;
    }
    const saved = sessionStorage.getItem('rr-app');
    if (saved === 'caption' || saved === 'eventcam') return saved;
  } catch { /* storage may be unavailable */ }
  return window.location.hostname.toLowerCase().startsWith('eventcam.') ? 'eventcam' : 'caption';
}
