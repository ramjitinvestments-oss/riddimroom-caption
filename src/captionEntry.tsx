import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import AppSwitcher from './shared/AppSwitcher';

// Gracefully catch and suppress benign WebSocket / Vite HMR connection rejections in sandboxed platforms
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('websocket')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('websocket')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

export function mount(root: HTMLElement) {
  createRoot(root).render(
    <StrictMode>
      <App />
      <AppSwitcher current="caption" />
    </StrictMode>,
  );
}
