import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import AppSwitcher from '../shared/AppSwitcher';

function setHead() {
  document.title = 'EventCam Live — Live Custom Branding Camera';
  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  };
  add('link', { rel: 'manifest', href: '/eventcam-manifest.json' });
  add('link', { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' });
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute('content', '#FFD100');
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/eventcam-sw.js').catch(() => {});
    });
  }
}

export function mount(root: HTMLElement) {
  setHead();
  createRoot(root).render(
    <StrictMode>
      <App />
      <AppSwitcher current="eventcam" />
    </StrictMode>,
  );
}
