// Booth gallery: keeps the last captures on this device so a host can re-share them or run a slideshow.
import localforage from 'localforage';

export interface GalleryItem { id: string; kind: 'photo' | 'video'; ts: number; blob: Blob; }
const KEY = 'rr-gallery-v1';
const MAX = 30;
let items: GalleryItem[] = [];
let loaded = false;
const subs = new Set<() => void>();
const emit = () => { items = [...items]; subs.forEach((f) => f()); };

export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getItems = () => items;

async function save() {
  try { await localforage.setItem(KEY, items); } catch { /* storage full or blocked: keep in memory only */ }
}
export async function loadGallery() {
  if (loaded) return; loaded = true;
  try { const saved = await localforage.getItem<GalleryItem[]>(KEY); if (saved && saved.length) { items = saved; emit(); } } catch { /* ignore */ }
}
export async function addCapture(data: Blob | string, kind: 'photo' | 'video') {
  try {
    const blob = typeof data === 'string' ? await (await fetch(data)).blob() : data;
    items = [...items, { id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), kind, ts: Date.now(), blob }].slice(-MAX);
    emit(); await save();
  } catch { /* never block the camera */ }
}
export async function clearGallery() { items = []; emit(); await save(); }

if (typeof window !== 'undefined') {
  (window as any).__rrOnCapture = (data: Blob | string, kind: 'photo' | 'video') => { void addCapture(data, kind); };
  void loadGallery();
}
