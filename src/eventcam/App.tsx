/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Type, 
  Trash2,
  AlertCircle,
  Loader2,
  Zap,
  Image as ImageIcon,
  Save,
  Library,
  RotateCcw,
  Maximize,
  Minimize,
  Download,
  Video,
  Square,
  Maximize2,
  X,
  RefreshCw,
  Mic,
  MicOff,
  Settings as SettingsIcon,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Lock,
  Unlock,
  Users,
  BarChart3,
  Share2,
  Copy,
  Check,
  Ban,
  ExternalLink,
  QrCode,
  Rocket,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { removeBackground, preload } from '@imgly/background-removal';
import localforage from 'localforage';
import confetti from 'canvas-confetti';
import { 
  WatermarkPosition, 
  EventCamSettings, 
  BrandSlot,
  AspectRatio
} from './types';
import { BUILTIN_LOGOS, RIDDIM_ROOM_LOGO_SVG } from './logos';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { initializeFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, onSnapshot, serverTimestamp, getDocs, query, orderBy, limit, getDocFromServer, Timestamp, where } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(firebaseApp);

// ─── White-Label Types ───────────────────────────────────────────────────────
interface CustomerBranding {
  brandName: string;
  brandLogoUrl: string;
  brandColor: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test_connection', 'status'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();


const DEFAULT_SLOTS: BrandSlot[] = [
  {
    id: 0,
    isEmpty: true,
    watermark: {
      size: 28,
      opacity: 1.0,
      position: 'bottom-left',
      x: 5,
      y: 75,
      hasAsset: false
    },
    textOverlay: {
      text: '',
      fontSize: 54,
      color: '#FFD100',
      opacity: 1.0,
      position: 'bottom-center',
      textAlign: 'center',
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 'bold',
      fontStyle: 'normal',
      x: 50,
      y: 50
    }
  },
  {
    id: 1,
    isEmpty: true,
    watermark: {
      size: 28,
      opacity: 1.0,
      position: 'bottom-left',
      x: 5,
      y: 75,
      hasAsset: false
    },
    textOverlay: {
      text: '',
      fontSize: 54,
      color: '#009B3A',
      opacity: 1.0,
      position: 'bottom-center',
      textAlign: 'center',
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 'bold',
      fontStyle: 'normal',
      x: 50,
      y: 50
    }
  },
  {
    id: 2,
    isEmpty: true,
    watermark: {
      size: 28,
      opacity: 1.0,
      position: 'bottom-left',
      x: 5,
      y: 75,
      hasAsset: false
    },
    textOverlay: {
      text: '',
      fontSize: 54,
      color: '#FFD100',
      opacity: 1.0,
      position: 'bottom-center',
      textAlign: 'center',
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 'bold',
      fontStyle: 'normal',
      x: 50,
      y: 50
    }
  }
];

const FONTS = [
  { name: 'Space Grotesk', value: '"Space Grotesk", sans-serif', category: 'Display' },
  { name: 'Inter', value: '"Inter", sans-serif', category: 'Sans' },
  { name: 'Roboto', value: '"Roboto", sans-serif', category: 'Sans' },
  { name: 'Montserrat', value: '"Montserrat", sans-serif', category: 'Sans' },
  { name: 'Poppins', value: '"Poppins", sans-serif', category: 'Sans' },
  { name: 'Outfit', value: '"Outfit", sans-serif', category: 'Sans' },
  { name: 'Playfair Display', value: '"Playfair Display", serif', category: 'Serif' },
  { name: 'Cinzel', value: '"Cinzel", serif', category: 'Serif' },
  { name: 'Oswald', value: '"Oswald", sans-serif', category: 'Display' },
  { name: 'Bebas Neue', value: '"Bebas Neue", sans-serif', category: 'Display' },
  { name: 'Anton', value: '"Anton", sans-serif', category: 'Display' },
  { name: 'Syne', value: '"Syne", sans-serif', category: 'Display' },
  { name: 'Lilita One', value: '"Lilita One", sans-serif', category: 'Display' },
  { name: 'Archivo Black', value: '"Archivo Black", sans-serif', category: 'Display' },
  { name: 'Unbounded', value: '"Unbounded", sans-serif', category: 'Display' },
  { name: 'League Spartan', value: '"League Spartan", sans-serif', category: 'Display' },
  { name: 'Righteous', value: '"Righteous", sans-serif', category: 'Display' },
  { name: 'Bungee', value: '"Bungee", sans-serif', category: 'Display' },
  { name: 'Special Elite', value: '"Special Elite", serif', category: 'Display' },
  { name: 'Cabin Sketch', value: '"Cabin Sketch", sans-serif', category: 'Display' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace', category: 'Monospace' },
  { name: 'Fira Code', value: '"Fira Code", monospace', category: 'Monospace' },
  { name: 'Pacifico', value: '"Pacifico", cursive', category: 'Handwriting' },
  { name: 'Lobster', value: '"Lobster", cursive', category: 'Handwriting' },
  { name: 'Great Vibes', value: '"Great Vibes", cursive', category: 'Handwriting' }
];

const RIDDIM_ROOM_DEFAULT_LOGO = '/riddim_logo.jpg';

const INITIAL_SETTINGS: EventCamSettings = {
  watermark: {
    assetUrl: RIDDIM_ROOM_DEFAULT_LOGO,
    size: 28,
    opacity: 1.0,
    position: 'bottom-left',
    x: 5,
    y: 75
  },
  textOverlay: {
    text: 'RIDDIMROOM.COM',
    fontSize: 54,
    color: '#facc15',
    opacity: 1.0,
    position: 'bottom-center',
    textAlign: 'center',
    fontFamily: '"Space Grotesk", sans-serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    x: 50,
    y: 90
  },
  exportFormat: 'image/png',
  aspectRatio: '16:9',
  slots: DEFAULT_SLOTS,
  audioPreset: 'heavy-limit'
};

const loadLogo = (file: File | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
};

const removeBackgroundWithFallback = async (
  image: Blob,
  progress?: (percent: number) => void,
  processId?: number,
  activeProcessIdRef?: { current: number | null }
): Promise<Blob> => {
  const cdns = [
    undefined,
    'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
    'https://unpkg.com/@imgly/background-removal-data@1.7.0/dist/',
    'https://static.img.ly/resources/@imgly/background-removal-data/1.7.0/dist/',
    'https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.7.0/dist/'
  ];

  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let i = 0; i < cdns.length; i++) {
    const cdn = cdns[i];
    if (activeProcessIdRef && processId !== undefined && processId !== activeProcessIdRef.current) {
      throw new Error("Process preempted");
    }
    const elapsed = Date.now() - startTime;
    if (elapsed >= 10000) throw new Error("AI model processing timed out (10s budget exceeded)");

    const controller = new AbortController();
    const signal = controller.signal;
    const remainingTotal = 10000 - elapsed;
    const isFirstCDN = i === 0;
    const currentCDNTimeoutBudget = Math.max(500, isFirstCDN ? Math.min(8500, remainingTotal - 500) : Math.min(2500, remainingTotal));

    const cdnTimeoutId = setTimeout(() => { controller.abort(); }, currentCDNTimeoutBudget);

    try {
      const result = await removeBackground(image, {
        publicPath: cdn,
        fetchArgs: { signal },
        progress: (percent: any) => {
          if (activeProcessIdRef && processId !== undefined && processId !== activeProcessIdRef.current) { controller.abort(); return; }
          if (Date.now() - startTime >= 10000) { controller.abort(); return; }
          if (progress) {
            if (activeProcessIdRef && processId !== undefined) {
              if (processId === activeProcessIdRef.current) progress(percent as number);
            } else {
              progress(percent as number);
            }
          }
        },
        model: 'isnet_quint8',
        proxyToWorker: false
      });
      clearTimeout(cdnTimeoutId);
      return result;
    } catch (err: any) {
      clearTimeout(cdnTimeoutId);
      if (activeProcessIdRef && processId !== undefined && processId !== activeProcessIdRef.current) throw new Error("Process preempted");
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError || new Error("Failed to remove background using all available CDNs or timed out");
};

const getResizedBlob = (sourceFile: File | Blob, maxDim: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(sourceFile);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width; let h = img.height;
      if (w > h) { if (w > maxDim) { h *= maxDim / w; w = maxDim; } }
      else { if (h > maxDim) { w *= maxDim / h; h = maxDim; } }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => { URL.revokeObjectURL(objectUrl); resolve(blob || sourceFile); }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(sourceFile); };
    img.src = objectUrl;
  });
};

const refineMaskAndDecontaminate = (
  sourceImgData: ImageData,
  maskImgData: ImageData,
  options: { erodeRadius: number; featherRadius: number; decontaminateRadius: number; } = { erodeRadius: 1, featherRadius: 2, decontaminateRadius: 8 }
): ImageData => {
  const w = sourceImgData.width; const h = sourceImgData.height; const totalPixels = w * h;
  const sData = sourceImgData.data; const mData = maskImgData.data;
  const outImgData = new ImageData(w, h); const outData = outImgData.data;
  const alphas = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) alphas[i] = mData[i * 4 + 3];
  const erodedAlphas = new Uint8Array(totalPixels); erodedAlphas.set(alphas);
  const erodeRad = options.erodeRadius;
  if (erodeRad > 0) {
    for (let y = erodeRad; y < h - erodeRad; y++) {
      const rowOffset = y * w;
      for (let x = erodeRad; x < w - erodeRad; x++) {
        const idx = rowOffset + x;
        if (alphas[idx] > 0) {
          const a = alphas[idx]; const t = alphas[idx - w]; const b = alphas[idx + w]; const l = alphas[idx - 1]; const r = alphas[idx + 1];
          erodedAlphas[idx] = Math.min(a, t, b, l, r);
        }
      }
    }
  }
  const refinedAlphas = new Uint8Array(totalPixels); refinedAlphas.set(erodedAlphas);
  const featherRad = options.featherRadius;
  if (featherRad > 0) {
    for (let y = featherRad; y < h - featherRad; y++) {
      const rowOffset = y * w;
      for (let x = featherRad; x < w - featherRad; x++) {
        const idx = rowOffset + x; const curAlpha = erodedAlphas[idx];
        if (curAlpha > 0 && curAlpha < 255) {
          let alphaSum = 0; let weightSum = 0;
          const sOffset = idx * 4; const rBase = sData[sOffset]; const gBase = sData[sOffset + 1]; const bBase = sData[sOffset + 2];
          for (let dy = -featherRad; dy <= featherRad; dy++) {
            const dyOffset = dy * w;
            for (let dx = -featherRad; dx <= featherRad; dx++) {
              const nIdx = idx + dyOffset + dx;
              if (nIdx < 0 || nIdx >= totalPixels) continue;
              const nAlpha = erodedAlphas[nIdx]; const nOffset = nIdx * 4;
              const nr = sData[nOffset]; const ng = sData[nOffset + 1]; const nb = sData[nOffset + 2];
              const colorDistSq = (rBase - nr) ** 2 + (gBase - ng) ** 2 + (bBase - nb) ** 2;
              const spatialDistSq = dx * dx + dy * dy;
              const weight = Math.exp(-colorDistSq / 600 - spatialDistSq / 4.0);
              alphaSum += nAlpha * weight; weightSum += weight;
            }
          }
          if (weightSum > 0) refinedAlphas[idx] = Math.round(alphaSum / weightSum);
        }
      }
    }
  }
  let nonTransparentCount = 0;
  for (let i = 0; i < totalPixels; i++) { if (refinedAlphas[i] > 10) nonTransparentCount++; }
  if (nonTransparentCount < totalPixels * 0.0025) refinedAlphas.set(alphas);

  const decontaminateRad = options.decontaminateRadius;
  const radialOffsets: number[] = [];
  for (let r = 1; r <= decontaminateRad; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r) {
          const distSq = dx * dx + dy * dy;
          if (distSq <= decontaminateRad * decontaminateRad) radialOffsets.push(dy * w + dx);
        }
      }
    }
  }
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    for (let x = 0; x < w; x++) {
      const idx = rowOffset + x; const offset = idx * 4; const alpha = refinedAlphas[idx];
      if (alpha === 0) { outData[offset] = 0; outData[offset + 1] = 0; outData[offset + 2] = 0; outData[offset + 3] = 0; }
      else if (alpha >= 253) { outData[offset] = sData[offset]; outData[offset + 1] = sData[offset + 1]; outData[offset + 2] = sData[offset + 2]; outData[offset + 3] = alpha; }
      else {
        let foundR = sData[offset]; let foundG = sData[offset + 1]; let foundB = sData[offset + 2]; let foundOpaque = false;
        for (let i = 0; i < radialOffsets.length; i++) {
          const nIdx = idx + radialOffsets[i];
          if (nIdx >= 0 && nIdx < totalPixels) {
            const nx = nIdx % w;
            if (Math.abs(nx - x) <= decontaminateRad) {
              if (refinedAlphas[nIdx] >= 250) { const nOffset = nIdx * 4; foundR = sData[nOffset]; foundG = sData[nOffset + 1]; foundB = sData[nOffset + 2]; foundOpaque = true; break; }
            }
          }
        }
        if (!foundOpaque) {
          for (let i = 0; i < radialOffsets.length; i++) {
            const nIdx = idx + radialOffsets[i];
            if (nIdx >= 0 && nIdx < totalPixels) {
              const nx = nIdx % w;
              if (Math.abs(nx - x) <= decontaminateRad) {
                if (refinedAlphas[nIdx] >= 180) { const nOffset = nIdx * 4; foundR = sData[nOffset]; foundG = sData[nOffset + 1]; foundB = sData[nOffset + 2]; foundOpaque = true; break; }
              }
            }
          }
        }
        outData[offset] = foundR; outData[offset + 1] = foundG; outData[offset + 2] = foundB; outData[offset + 3] = alpha;
      }
    }
  }
  return outImgData;
};

const checkImageHasSolidBackground = (sourceImg: HTMLImageElement): {
  type: 'transparent' | 'solid' | 'checkerboard' | 'photographic';
  isSolid: boolean; r: number; g: number; b: number;
  colorA: { r: number; g: number; b: number }; colorB: { r: number; g: number; b: number };
} => {
  const canvas = document.createElement('canvas'); const w = 120; const h = 120; canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const defaultResult = { type: 'photographic' as const, isSolid: false, r: 255, g: 255, b: 255, colorA: { r: 255, g: 255, b: 255 }, colorB: { r: 255, g: 255, b: 255 } };
  if (!ctx) return defaultResult;
  ctx.drawImage(sourceImg, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h); const data = imgData.data;
  const borderPixels: { r: number; g: number; b: number; a: number }[] = [];
  const margin = 4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x < margin || x >= w - margin || y < margin || y >= h - margin) {
      const offset = (y * w + x) * 4;
      borderPixels.push({ r: data[offset], g: data[offset + 1], b: data[offset + 2], a: data[offset + 3] });
    }
  }
  const totalBorder = borderPixels.length; if (totalBorder === 0) return defaultResult;
  let transparentCount = 0; const nonTransparentBorder: { r: number; g: number; b: number }[] = [];
  for (const p of borderPixels) { if (p.a < 35) transparentCount++; else nonTransparentBorder.push({ r: p.r, g: p.g, b: p.b }); }
  if (transparentCount / totalBorder > 0.30) return { type: 'transparent', isSolid: true, r: 0, g: 0, b: 0, colorA: { r: 0, g: 0, b: 0 }, colorB: { r: 0, g: 0, b: 0 } };
  const clusters: { r: number; g: number; b: number; count: number }[] = [];
  for (const color of nonTransparentBorder) {
    let matched = false;
    for (const c of clusters) {
      const dist = Math.sqrt((c.r - color.r)**2 + (c.g - color.g)**2 + (c.b - color.b)**2);
      if (dist < 18) { c.r = (c.r * c.count + color.r) / (c.count + 1); c.g = (c.g * c.count + color.g) / (c.count + 1); c.b = (c.b * c.count + color.b) / (c.count + 1); c.count++; matched = true; break; }
    }
    if (!matched) clusters.push({ r: color.r, g: color.g, b: color.b, count: 1 });
  }
  clusters.sort((a, b) => b.count - a.count);
  if (clusters.length === 0) return defaultResult;
  const c1 = clusters[0]; const totalNonTrans = nonTransparentBorder.length;
  if (clusters.length >= 2) {
    const c2 = clusters[1]; const c1Ratio = c1.count / totalNonTrans; const c2Ratio = c2.count / totalNonTrans; const jointRatio = (c1.count + c2.count) / totalNonTrans;
    const colorDist = Math.sqrt((c1.r - c2.r)**2 + (c1.g - c2.g)**2 + (c1.b - c2.b)**2);
    const isC1Grayscale = Math.max(c1.r, c1.g, c1.b) - Math.min(c1.r, c1.g, c1.b) < 25;
    const isC2Grayscale = Math.max(c2.r, c2.g, c2.b) - Math.min(c2.r, c2.g, c2.b) < 25;
    if (c1Ratio > 0.16 && c2Ratio > 0.10 && jointRatio > 0.50 && colorDist >= 10 && colorDist <= 125 && isC1Grayscale && isC2Grayscale) {
      return { type: 'checkerboard', isSolid: true, r: Math.round(c1.r), g: Math.round(c1.g), b: Math.round(c1.b), colorA: { r: Math.round(c1.r), g: Math.round(c1.g), b: Math.round(c1.b) }, colorB: { r: Math.round(c2.r), g: Math.round(c2.g), b: Math.round(c2.b) } };
    }
  }
  const c1Ratio = c1.count / totalNonTrans;
  if (c1Ratio > 0.65) return { type: 'solid', isSolid: true, r: Math.round(c1.r), g: Math.round(c1.g), b: Math.round(c1.b), colorA: { r: Math.round(c1.r), g: Math.round(c1.g), b: Math.round(c1.b) }, colorB: { r: Math.round(c1.r), g: Math.round(c1.g), b: Math.round(c1.b) } };
  return defaultResult;
};

interface ImageFeatureAnalysis { type: 'human_photo' | 'graphic' | 'mixed_media'; confidence: number; hasTransparency: boolean; uniqueColorCount: number; sharpEdgeRatio: number; flatAreaRatio: number; gradientRatio: number; }

const classifyImage = (imgElement: HTMLImageElement): ImageFeatureAnalysis => {
  const canvas = document.createElement('canvas'); const w = 120; const h = 120; canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const defaultResult: ImageFeatureAnalysis = { type: 'human_photo', confidence: 0.5, hasTransparency: false, uniqueColorCount: 500, sharpEdgeRatio: 0.05, flatAreaRatio: 0.1, gradientRatio: 0.5 };
  if (!ctx) return defaultResult;
  ctx.drawImage(imgElement, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h); const data = imgData.data; const totalPixels = w * h;
  let transparentPixels = 0;
  for (let i = 0; i < totalPixels; i++) { if (data[i * 4 + 3] < 240) transparentPixels++; }
  const hasTransparency = transparentPixels / totalPixels > 0.02;
  const colorBucket = new Set<number>();
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4; if (data[offset + 3] < 20) continue;
    const r = data[offset] >> 4; const g = data[offset + 1] >> 4; const b = data[offset + 2] >> 4;
    colorBucket.add((r << 8) | (g << 4) | b);
  }
  const uniqueColorCount = colorBucket.size;
  let sharpEdges = 0; let flatAreas = 0; let gradientAreas = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4; if (data[idx + 3] < 30) continue;
      const neighbors = [((y-1)*w+x)*4,((y+1)*w+x)*4,(y*w+(x-1))*4,(y*w+(x+1))*4];
      let maxDiff = 0;
      for (const nIdx of neighbors) {
        if (data[nIdx + 3] < 30) continue;
        const diff = Math.abs(data[idx]-data[nIdx])+Math.abs(data[idx+1]-data[nIdx+1])+Math.abs(data[idx+2]-data[nIdx+2]);
        if (diff > maxDiff) maxDiff = diff;
      }
      if (maxDiff > 120) sharpEdges++; else if (maxDiff < 10) flatAreas++; else gradientAreas++;
    }
  }
  const sharpEdgeRatio = sharpEdges / totalPixels; const flatAreaRatio = flatAreas / totalPixels; const gradientRatio = gradientAreas / totalPixels;
  let type: 'human_photo' | 'graphic' | 'mixed_media' = 'human_photo'; let confidence = 0.8;
  const isLogoLikeColors = uniqueColorCount < 180; const isHighFlatArea = flatAreaRatio > 0.35; const isHighSharpEdges = sharpEdgeRatio > 0.08; const isTextLike = sharpEdgeRatio > 0.12 && uniqueColorCount < 250;
  if (hasTransparency) { type = 'graphic'; confidence = 0.95; }
  else if (isLogoLikeColors || isHighFlatArea || isTextLike || isHighSharpEdges) {
    type = 'graphic'; confidence = 0.90;
    if (uniqueColorCount > 100 && gradientRatio > 0.25) { type = 'mixed_media'; confidence = 0.75; }
  } else {
    type = 'human_photo'; confidence = 0.85;
    if (sharpEdgeRatio > 0.06 && uniqueColorCount > 250) { type = 'mixed_media'; confidence = 0.70; }
  }
  return { type, confidence, hasTransparency, uniqueColorCount, sharpEdgeRatio, flatAreaRatio, gradientRatio };
};

const removeGraphicBackground = (imgElement: HTMLImageElement, tolerance: number = 35): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const w = imgElement.naturalWidth || imgElement.width; const h = imgElement.naturalHeight || imgElement.height;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d'); if (!ctx) { reject(new Error("Could not get 2D context")); return; }
      ctx.drawImage(imgElement, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h); const data = imgData.data; const totalPixels = w * h;
      const originalImgData = new Uint8ClampedArray(data);
      const borderPixels: { r: number; g: number; b: number; a: number }[] = [];
      const samplePixel = (x: number, y: number) => {
        const idx = (y * w + x) * 4;
        borderPixels.push({ r: data[idx], g: data[idx+1], b: data[idx+2], a: data[idx+3] });
      };
      const xStride = Math.max(1, Math.floor(w / 60)); const yStride = Math.max(1, Math.floor(h / 60));
      for (let x = 0; x < w; x += xStride) { samplePixel(x, 0); samplePixel(x, h - 1); }
      for (let y = 0; y < h; y += yStride) { samplePixel(0, y); samplePixel(w - 1, y); }
      const bgClusters: { r: number; g: number; b: number; count: number }[] = [];
      let totalOpaqueBorders = 0;
      for (const p of borderPixels) {
        if (p.a < 30) continue; totalOpaqueBorders++;
        let matched = false;
        for (const c of bgClusters) {
          const dist = Math.sqrt((c.r-p.r)**2+(c.g-p.g)**2+(c.b-p.b)**2);
          if (dist < 15) { c.r=(c.r*c.count+p.r)/(c.count+1); c.g=(c.g*c.count+p.g)/(c.count+1); c.b=(c.b*c.count+p.b)/(c.count+1); c.count++; matched=true; break; }
        }
        if (!matched) bgClusters.push({ r: p.r, g: p.g, b: p.b, count: 1 });
      }
      bgClusters.sort((a, b) => b.count - a.count);
      const bgCandidates = bgClusters.filter(c => c.count / Math.max(1, totalOpaqueBorders) > 0.10);
      const dominantClusterRatio = bgClusters.length > 0 ? (bgClusters[0].count / Math.max(1, totalOpaqueBorders)) : 0;
      const isComplexBackground = bgCandidates.length === 0 || dominantClusterRatio < 0.75;
      if (isComplexBackground) {
        const channelR = new Uint8Array(totalPixels); const channelG = new Uint8Array(totalPixels);
        const channelB = new Uint8Array(totalPixels); const luminance = new Uint8Array(totalPixels);
        for (let i = 0; i < totalPixels; i++) {
          const offset = i * 4;
          channelR[i]=originalImgData[offset]; channelG[i]=originalImgData[offset+1]; channelB[i]=originalImgData[offset+2];
          luminance[i]=Math.round(0.299*channelR[i]+0.587*channelG[i]+0.114*channelB[i]);
        }
        const r = Math.max(6, Math.floor(Math.min(w, h) / 45));
        const runBoxBlur = (src: Uint8Array, radius: number): Uint8Array => {
          const dest = new Uint8Array(totalPixels); const temp = new Uint32Array(totalPixels); const div = (2 * radius + 1);
          for (let y = 0; y < h; y++) {
            let sum = 0; const rowStart = y * w;
            for (let x = -radius; x <= radius; x++) { const px = Math.max(0, Math.min(w-1, x)); sum += src[rowStart+px]; }
            temp[rowStart] = sum;
            for (let x = 1; x < w; x++) { const prevX=Math.max(0,x-radius-1); const nextX=Math.min(w-1,x+radius); sum+=src[rowStart+nextX]-src[rowStart+prevX]; temp[rowStart+x]=sum; }
          }
          for (let x = 0; x < w; x++) {
            let sum = 0;
            for (let y = -radius; y <= radius; y++) { const py=Math.max(0,Math.min(h-1,y)); sum+=temp[py*w+x]; }
            dest[x]=Math.round(sum/(div*div));
            for (let y = 1; y < h; y++) { const prevY=Math.max(0,y-radius-1); const nextY=Math.min(h-1,y+radius); sum+=temp[nextY*w+x]-temp[prevY*w+x]; dest[y*w+x]=Math.round(sum/(div*div)); }
          }
          return dest;
        };
        const blurY=runBoxBlur(luminance,r); const blurR=runBoxBlur(channelR,r); const blurG=runBoxBlur(channelG,r); const blurB=runBoxBlur(channelB,r);
        for (let idx = 0; idx < totalPixels; idx++) {
          const offset = idx * 4; const origAlpha = originalImgData[offset + 3];
          if (origAlpha < 15) { data[offset+3]=0; continue; }
          const R=originalImgData[offset]; const G=originalImgData[offset+1]; const B=originalImgData[offset+2]; const Y=luminance[idx]; const M=blurY[idx];
          let pAlpha = 0;
          if (M > 128) { const diff=M-Y; if (diff>12) pAlpha=Math.min(255,Math.max(0,(diff-12)*12)); }
          else { const diff=Y-M; if (diff>12) pAlpha=Math.min(255,Math.max(0,(diff-12)*12)); }
          const cDist=Math.sqrt((R-blurR[idx])**2+(G-blurG[idx])**2+(B-blurB[idx])**2);
          let cAlpha = 0; if (cDist>18) cAlpha=Math.min(255,Math.max(0,(cDist-18)*8));
          let finalAlpha = Math.max(pAlpha, cAlpha); finalAlpha = Math.min(origAlpha, finalAlpha);
          data[offset]=R; data[offset+1]=G; data[offset+2]=B; data[offset+3]=finalAlpha;
        }
      } else {
        const visited=new Uint8Array(totalPixels); const isBgPixel=new Uint8Array(totalPixels); const queue=new Int32Array(totalPixels); let head=0; let tail=0;
        const baseTolerance=tolerance; const featherRange=22;
        const isPixelBgColor=(pxIdx: number, customTolerance: number) => {
          const offset=pxIdx*4; const a=originalImgData[offset+3]; if (a<35) return true;
          const r=originalImgData[offset]; const g=originalImgData[offset+1]; const b=originalImgData[offset+2];
          for (const c of bgCandidates) { const dist=Math.sqrt((r-c.r)**2+(g-c.g)**2+(b-c.b)**2); if (dist<=customTolerance) return true; }
          return false;
        };
        const pushSeed=(x: number, y: number) => {
          const idx=y*w+x; if (!visited[idx]) { visited[idx]=1; if (isPixelBgColor(idx,baseTolerance+featherRange)) { isBgPixel[idx]=1; queue[tail++]=idx; } }
        };
        for (let x=0;x<w;x++) { pushSeed(x,0); pushSeed(x,h-1); }
        for (let y=0;y<h;y++) { pushSeed(0,y); pushSeed(w-1,y); }
        while (head<tail) {
          const idx=queue[head++]; const x=idx%w; const y=Math.floor(idx/w);
          const neighbors=[{nx:x-1,ny:y},{nx:x+1,ny:y},{nx:x,ny:y-1},{nx:x,ny:y+1}];
          for (const {nx,ny} of neighbors) {
            if (nx>=0&&nx<w&&ny>=0&&ny<h) { const nIdx=ny*w+nx; if (!visited[nIdx]) { visited[nIdx]=1; if (isPixelBgColor(nIdx,baseTolerance+featherRange)) { isBgPixel[nIdx]=1; queue[tail++]=nIdx; } } }
          }
        }
        const maxIslandSize=Math.floor(totalPixels*0.03); const islandVisited=new Uint8Array(totalPixels);
        for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
          const idx=y*w+x; const offset=idx*4;
          if (!isBgPixel[idx]&&!islandVisited[idx]&&originalImgData[offset+3]>0) {
            if (isPixelBgColor(idx,baseTolerance+10)) {
              const islandQueue=new Int32Array(totalPixels); let islandHead=0; let islandTail=0;
              islandQueue[islandTail++]=idx; islandVisited[idx]=1; let touchesBorder=false;
              while (islandHead<islandTail) {
                const currIdx=islandQueue[islandHead++]; const cx=currIdx%w; const cy=Math.floor(currIdx/w);
                if (cx===0||cx===w-1||cy===0||cy===h-1) touchesBorder=true;
                const neighbors=[{nx:cx-1,ny:cy},{nx:cx+1,ny:cy},{nx:cx,ny:cy-1},{nx:cx,ny:cy+1}];
                for (const {nx,ny} of neighbors) {
                  if (nx>=0&&nx<w&&ny>=0&&ny<h) { const nIdx=ny*w+nx; if (!isBgPixel[nIdx]&&!islandVisited[nIdx]) { if (isPixelBgColor(nIdx,baseTolerance+10)) { islandVisited[nIdx]=1; islandQueue[islandTail++]=nIdx; } } }
                }
              }
              if (!touchesBorder&&islandTail<maxIslandSize) { for (let k=0;k<islandTail;k++) { const islandIdx=islandQueue[k]; isBgPixel[islandIdx]=1; } }
            }
          }
        }
        for (let idx=0;idx<totalPixels;idx++) {
          const offset=idx*4; if (originalImgData[offset+3]<10) { data[offset+3]=0; continue; }
          if (isBgPixel[idx]) {
            const r=originalImgData[offset]; const g=originalImgData[offset+1]; const b=originalImgData[offset+2];
            let minDist=999;
            for (const c of bgCandidates) { const dist=Math.sqrt((r-c.r)**2+(g-c.g)**2+(b-c.b)**2); if (dist<minDist) minDist=dist; }
            if (minDist<=baseTolerance) { data[offset+3]=0; }
            else { const ratio=(minDist-baseTolerance)/featherRange; const targetAlpha=Math.round(ratio*originalImgData[offset+3]); data[offset+3]=Math.max(0,Math.min(originalImgData[offset+3],targetAlpha)); }
          } else { data[offset]=originalImgData[offset]; data[offset+1]=originalImgData[offset+1]; data[offset+2]=originalImgData[offset+2]; data[offset+3]=originalImgData[offset+3]; }
        }
      }
      ctx.putImageData(imgData,0,0);
      canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error("Failed to export graphic blob")); }, 'image/png');
    } catch (err) { reject(err); }
  });
};

const removeCheckerboardBackground = (imgElement: HTMLImageElement, colorA: { r: number; g: number; b: number }, colorB: { r: number; g: number; b: number }, tolerance: number = 28): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas'); const w=imgElement.naturalWidth||imgElement.width; const h=imgElement.naturalHeight||imgElement.height;
      canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d'); if (!ctx) { reject(new Error("Could not get 2D context")); return; }
      ctx.drawImage(imgElement,0,0); const imgData=ctx.getImageData(0,0,w,h); const data=imgData.data; const totalPixels=w*h;
      const originalImgData=new ImageData(new Uint8ClampedArray(data),w,h);
      const matchesCandidate=new Uint8Array(totalPixels); const isColorA=new Uint8Array(totalPixels); const isColorB=new Uint8Array(totalPixels);
      for (let i=0;i<totalPixels;i++) {
        const offset=i*4; const r=data[offset]; const g=data[offset+1]; const b=data[offset+2]; const a=data[offset+3];
        if (a>15) {
          const distA=Math.sqrt((r-colorA.r)**2+(g-colorA.g)**2+(b-colorA.b)**2); const distB=Math.sqrt((r-colorB.r)**2+(g-colorB.g)**2+(b-colorB.b)**2);
          if (distA<=tolerance) { isColorA[i]=1; matchesCandidate[i]=1; } else if (distB<=tolerance) { isColorB[i]=1; matchesCandidate[i]=1; }
        }
      }
      const queue=new Int32Array(totalPixels); const visited=new Uint8Array(totalPixels);
      for (let startIdx=0;startIdx<totalPixels;startIdx++) {
        if (matchesCandidate[startIdx]&&!visited[startIdx]) {
          let qHead=0; let qTail=0; queue[qTail++]=startIdx; visited[startIdx]=1; let touchesBorder=false;
          while (qHead<qTail) {
            const idx=queue[qHead++]; const cx=idx%w; const cy=Math.floor(idx/w);
            if (cx===0||cx===w-1||cy===0||cy===h-1) touchesBorder=true;
            for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) {
              if (dx===0&&dy===0) continue; const nx=cx+dx; const ny=cy+dy;
              if (nx>=0&&nx<w&&ny>=0&&ny<h) { const nIdx=ny*w+nx; if (matchesCandidate[nIdx]&&!visited[nIdx]) { visited[nIdx]=1; queue[qTail++]=nIdx; } }
            }
          }
          const componentSize=qTail; let countA=0; let countB=0;
          for (let q=0;q<componentSize;q++) { const idx=queue[q]; if (isColorA[idx]) countA++; if (isColorB[idx]) countB++; }
          const ratioA=countA/componentSize; const ratioB=countB/componentSize;
          const isOuterBackground=touchesBorder&&componentSize>10; const isInnerCheckerboardGrid=componentSize>=15&&ratioA>0.12&&ratioB>0.12;
          if (isOuterBackground||isInnerCheckerboardGrid) { for (let q=0;q<componentSize;q++) { const idx=queue[q]; data[idx*4+3]=0; } }
        }
      }
      const refinedImgData=refineMaskAndDecontaminate(originalImgData,imgData,{erodeRadius:1,featherRadius:2,decontaminateRadius:6});
      ctx.putImageData(refinedImgData,0,0);
      canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error("Failed to convert processed canvas to blob")); },'image/png');
    } catch (err) { reject(err); }
  });
};

const removeSolidBackground = (imgElement: HTMLImageElement, tolerance: number = 35): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas=document.createElement('canvas'); const w=imgElement.naturalWidth||imgElement.width; const h=imgElement.naturalHeight||imgElement.height;
      canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d'); if (!ctx) { reject(new Error("Could not get 2D context")); return; }
      ctx.drawImage(imgElement,0,0); const imgData=ctx.getImageData(0,0,w,h); const data=imgData.data; const totalPixels=w*h;
      const originalImgData=new ImageData(new Uint8ClampedArray(data),w,h);
      const borderPixels: {r:number,g:number,b:number}[]=[]; const samplePixel=(x:number,y:number)=>{const idx=(y*w+x)*4;if(data[idx+3]>10)borderPixels.push({r:data[idx],g:data[idx+1],b:data[idx+2]});};
      const xStride=Math.max(1,Math.floor(w/40)); const yStride=Math.max(1,Math.floor(h/40));
      for (let x=0;x<w;x+=xStride){samplePixel(x,0);samplePixel(x,h-1);}
      for (let y=0;y<h;y+=yStride){samplePixel(0,y);samplePixel(w-1,y);}
      let bgR=255,bgG=255,bgB=255;
      if (borderPixels.length>0) { let rSum=0,gSum=0,bSum=0; for (const p of borderPixels){rSum+=p.r;gSum+=p.g;bSum+=p.b;} bgR=Math.round(rSum/borderPixels.length);bgG=Math.round(gSum/borderPixels.length);bgB=Math.round(bSum/borderPixels.length); }
      const getColorDistance=(idx:number)=>{const r=data[idx];const g=data[idx+1];const b=data[idx+2];const a=data[idx+3];if(a<15)return 0;return Math.sqrt((r-bgR)**2+(g-bgG)**2+(b-bgB)**2);};
      const baseTolerance=Math.max(10,tolerance-15); const featherRange=25;
      const visited=new Uint8Array(totalPixels); const isBgPixel=new Uint8Array(totalPixels); const queue=new Int32Array(totalPixels); let head=0; let tail=0;
      const pushBorderPixel=(x:number,y:number)=>{const idx=y*w+x;if(!visited[idx]){visited[idx]=1;const dist=getColorDistance(idx*4);if(dist<=baseTolerance+featherRange){isBgPixel[idx]=1;queue[tail++]=idx;}}};
      for(let x=0;x<w;x++){pushBorderPixel(x,0);pushBorderPixel(x,h-1);}
      for(let y=0;y<h;y++){pushBorderPixel(0,y);pushBorderPixel(w-1,y);}
      while(head<tail){const idx=queue[head++];const x=idx%w;const y=Math.floor(idx/w);const neighbors=[{nx:x-1,ny:y},{nx:x+1,ny:y},{nx:x,ny:y-1},{nx:x,ny:y+1}];for(const{nx,ny}of neighbors){if(nx>=0&&nx<w&&ny>=0&&ny<h){const nIdx=ny*w+nx;if(!visited[nIdx]){visited[nIdx]=1;const dist=getColorDistance(nIdx*4);if(dist<=baseTolerance+featherRange){isBgPixel[nIdx]=1;queue[tail++]=nIdx;}}}}}
      const islandVisited=new Uint8Array(totalPixels); const maxIslandSize=Math.floor(totalPixels*0.12);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const idx=y*w+x;if(!isBgPixel[idx]&&!islandVisited[idx]){const dist=getColorDistance(idx*4);if(dist<=baseTolerance+featherRange){const islandQueue=new Int32Array(totalPixels);let islandHead=0;let islandTail=0;islandQueue[islandTail++]=idx;islandVisited[idx]=1;let touchesBorder=false;while(islandHead<islandTail){const currIdx=islandQueue[islandHead++];const cx=currIdx%w;const cy=Math.floor(currIdx/w);if(cx===0||cx===w-1||cy===0||cy===h-1)touchesBorder=true;const neighbors=[{nx:cx-1,ny:cy},{nx:cx+1,ny:cy},{nx:cx,ny:cy-1},{nx:cx,ny:cy+1}];for(const{nx,ny}of neighbors){if(nx>=0&&nx<w&&ny>=0&&ny<h){const nIdx=ny*w+nx;if(!isBgPixel[nIdx]&&!islandVisited[nIdx]){const ndist=getColorDistance(nIdx*4);if(ndist<=baseTolerance+featherRange){islandVisited[nIdx]=1;islandQueue[islandTail++]=nIdx;}}}}}if(!touchesBorder&&islandTail<maxIslandSize){for(let k=0;k<islandTail;k++){const islandIdx=islandQueue[k];isBgPixel[islandIdx]=1;}}}}}
      for(let idx=0;idx<totalPixels;idx++){if(isBgPixel[idx]){const offset=idx*4;const dist=getColorDistance(offset);if(dist<=baseTolerance){data[offset+3]=0;}else{const ratio=(dist-baseTolerance)/featherRange;const targetAlpha=Math.round(ratio*255);if(targetAlpha<data[offset+3])data[offset+3]=targetAlpha;}}}
      const refinedImgData=refineMaskAndDecontaminate(originalImgData,imgData,{erodeRadius:1,featherRadius:2,decontaminateRadius:6});
      ctx.putImageData(refinedImgData,0,0);
      canvas.toBlob((blob)=>{if(blob)resolve(blob);else reject(new Error("Failed to convert processed canvas to blob"));},'image/png');
    } catch(err){reject(err);}
  });
};


export default function App() {
  const isKioskMode = (() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const isShareTarget = path.includes('/share/');
    const isParamTarget = window.location.search.toLowerCase().includes('mode=camera');
    return isShareTarget || isParamTarget;
  })();
  const isShareView = typeof window !== 'undefined' && window.location.pathname.includes('/share/');
  const shareId = isShareView ? window.location.pathname.split('/share/')[1]?.split('/')[0] : null;
  const showsAuthDebug = typeof window !== 'undefined' && window.location.search.toLowerCase().includes('authdebug=true');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('mode=camera')) console.log(`[EVENT-LOG] Camera Mode Active | URL: ${window.location.href} | UA: ${navigator.userAgent}`);
    }
  }, [isKioskMode]);

  const [appState, setAppState] = useState<'setup' | 'camera'>(() => isKioskMode ? 'camera' : 'setup');

  // ─── Auth & Firebase State ───────────────────────────────────────────────
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [globalConfig, setGlobalConfig] = useState<{ expiresAt: any; disabled: boolean } | null>(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [authProcessing, setAuthProcessing] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // ─── White-Label Customer Branding State ─────────────────────────────────
  const [customerBranding, setCustomerBranding] = useState<CustomerBranding | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  // Admin: editing a customer's branding
  const [editingBrandUserId, setEditingBrandUserId] = useState<string | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandLogoUrl, setEditBrandLogoUrl] = useState('');
  const [editBrandColor, setEditBrandColor] = useState('#FFD100');
  const [brandSaving, setBrandSaving] = useState(false);

  const userIsAdmin = (
    userProfile?.role === 'ADMIN' ||
    userProfile?.email?.toLowerCase() === 'ramjitinvestments@gmail.com' ||
    userProfile?.email?.toLowerCase() === 'ramjitinvestments@google.com' ||
    user?.email?.toLowerCase() === 'ramjitinvestments@gmail.com' ||
    user?.email?.toLowerCase() === 'ramjitinvestments@google.com' ||
    user?.email === 'RamjitInvestments@gmail.com'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (path.includes('/admin')) { if (user && userIsAdmin) setShowAdminPanel(true); }
    else if (path.includes('/login')) { if (!user) setAuthMode('login'); }
  }, [user, userIsAdmin]);

  useEffect(() => {
    if (!userIsAdmin) { setPendingCount(0); return; }
    const q = query(collection(db, 'users'), where('status', '==', 'PENDING'));
    const unsubscribe = onSnapshot(q, (snapshot) => { setPendingCount(snapshot.size); }, (err) => { console.warn("Pending users listener restricted:", err); setPendingCount(0); });
    return () => unsubscribe();
  }, [userIsAdmin]);

  const isExpired = React.useMemo(() => {
    if (userIsAdmin) return false;
    if (globalConfig?.disabled) return true;
    return false;
  }, [globalConfig, userIsAdmin]);

  const filteredUsers = React.useMemo(() => {
    if (!adminSearchQuery.trim()) return allUsers;
    const q = adminSearchQuery.toLowerCase();
    return allUsers.filter(u => (u.email||'').toLowerCase().includes(q)||(u.displayName||'').toLowerCase().includes(q));
  }, [allUsers, adminSearchQuery]);

  const formatUserTimestamp = (timestampAny: any) => {
    if (!timestampAny) return 'Never';
    let dateObj: Date;
    if (typeof timestampAny.toDate === 'function') dateObj = timestampAny.toDate();
    else if (timestampAny.seconds) dateObj = new Date(timestampAny.seconds * 1000);
    else dateObj = new Date(timestampAny);
    return dateObj.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const sessionUpdatedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let profileUnsubscribe: () => void = () => {};
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthLoading(true);
        const userRef = doc(db, 'users', currentUser.uid);
        profileUnsubscribe = onSnapshot(userRef, async (snapshot) => {
          const isEmailAdmin = currentUser.email?.toLowerCase() === 'ramjitinvestments@gmail.com' || currentUser.email?.toLowerCase() === 'ramjitinvestments@google.com';
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserProfile(data);

            // ─── Load White-Label Branding ──────────────────────────────
            if (!isEmailAdmin && (data.brandName || data.brandLogoUrl)) {
              const branding: CustomerBranding = {
                brandName: data.brandName || '',
                brandLogoUrl: data.brandLogoUrl || '',
                brandColor: data.brandColor || '#FFD100',
              };
              setCustomerBranding(branding);
              setSplashDone(prev => {
                if (!prev) {
                  setShowSplash(true);
                  setTimeout(() => { setShowSplash(false); setSplashDone(true); }, 3200);
                }
                return prev;
              });
            }

            if (isEmailAdmin && (data.status !== 'APPROVED' || data.role !== 'ADMIN')) {
              try { await updateDoc(userRef, { status: 'APPROVED', role: 'ADMIN', updatedAt: serverTimestamp() }); } catch (err) { console.warn("Unable to auto-upgrade admin profile:", err); }
            }
            if (!sessionUpdatedRef.current[currentUser.uid]) {
              sessionUpdatedRef.current[currentUser.uid] = true;
              try { await updateDoc(userRef, { openCount: increment(1), lastActiveAt: serverTimestamp(), updatedAt: serverTimestamp() }); } catch (e) { console.warn("Session update inhibited:", e); }
            }
          } else {
            const initialProfile = { email: currentUser.email||'', displayName: currentUser.displayName||'EventCam User', status: isEmailAdmin?'APPROVED':'PENDING', role: isEmailAdmin?'ADMIN':'USER', createdAt: serverTimestamp(), lastActiveAt: serverTimestamp(), openCount: 1, captureCount: 0, photoCount: 0, videoCount: 0 };
            try { await setDoc(userRef, initialProfile); setUserProfile(initialProfile); sessionUpdatedRef.current[currentUser.uid]=true; } catch (err) { console.error("Profile creation error:", err); }
          }
          setAuthLoading(false);
        }, (err) => {
          console.error("CRITICAL_PROFILE_LISTEN_ERROR:", err); setAuthLoading(false);
          if (currentUser && !userProfile) setUserProfile(null);
          if (err.code === 'permission-denied') { console.warn("[SELF-HEAL] Stale token detected, signing out..."); signOut(auth).catch(signOutErr => console.error("Error signing out stale token:", signOutErr)); }
        });
      } else { setUserProfile(null); setAuthLoading(false); sessionUpdatedRef.current = {}; setCustomerBranding(null); setSplashDone(false); }
    });
    return () => { unsubscribe(); profileUnsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user && !isKioskMode) { if (authLoading === false) setIsConfigLoaded(true); return; }
    const configRef = doc(db, 'config', 'global');
    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) { const data=snapshot.data(); setGlobalConfig({ expiresAt: data.expiresAt, disabled: !!data.disabled }); }
      setIsConfigLoaded(true);
    }, (error) => { if (error.code !== 'permission-denied') console.warn("Config access warning:", error); setIsConfigLoaded(true); });
    return () => unsubscribe();
  }, [user, isKioskMode, authLoading]);

  const isInitializingRef = useRef(true);

  useEffect(() => {
    const brandingRef = doc(db, 'config', 'branding');
    const unsubscribe = onSnapshot(brandingRef, (snapshot) => {
      if (snapshot.exists()) {
        const firestoreSettings = snapshot.data() as Partial<EventCamSettings>;
        if (!userIsAdmin) {
          setSettings(prev => ({ ...prev, ...firestoreSettings, watermark: { ...prev.watermark, ...firestoreSettings.watermark, assetUrl: firestoreSettings.watermark?.assetUrl === 'STORED' ? prev.watermark.assetUrl : (firestoreSettings.watermark?.assetUrl || prev.watermark.assetUrl) }, textOverlay: { ...prev.textOverlay, ...firestoreSettings.textOverlay } }));
        } else if (isInitializingRef.current) {
          setSettings(prev => ({ ...prev, ...firestoreSettings, watermark: { ...prev.watermark, ...firestoreSettings.watermark, assetUrl: firestoreSettings.watermark?.assetUrl === 'STORED' ? prev.watermark.assetUrl : (firestoreSettings.watermark?.assetUrl || prev.watermark.assetUrl) } }));
        }
      }
    }, (error) => { console.error("Branding sync warning:", error); });
    return () => unsubscribe();
  }, [userIsAdmin]);

  useEffect(() => {
    if (userIsAdmin && isConfigLoaded && !globalConfig) {
      const bootstrapConfig = async () => {
        const configRef = doc(db, 'config', 'global');
        try {
          const defaultExpiration = new Date('2026-05-22T23:59:59Z');
          await setDoc(configRef, { expiresAt: defaultExpiration, disabled: false, updatedAt: serverTimestamp() });
          setGlobalConfig({ expiresAt: defaultExpiration, disabled: false });
        } catch (err) { console.error("Bootstrap config failure:", err); }
      };
      bootstrapConfig();
    }
  }, [userIsAdmin, isConfigLoaded, globalConfig]);

  const loadAllUsersMetrics = async () => {
    if (!user || !userIsAdmin) return;
    setUsersLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('lastActiveAt', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];
      querySnapshot.forEach((doc) => { fetched.push({ id: doc.id, ...doc.data() }); });
      setAllUsers(fetched);
    } catch (err) { handleFirestoreError(err, OperationType.LIST, 'users'); } finally { setUsersLoading(false); }
  };

  const saveAdminSettings = async (disabledStatus: boolean) => {
    if (!userIsAdmin) return;
    setConfigSaving(true);
    try {
      const configRef = doc(db, 'config', 'global');
      const cleanDate = globalConfig?.expiresAt ? globalConfig.expiresAt : new Date('2026-05-22T23:59:59Z');
      await setDoc(configRef, { expiresAt: cleanDate, disabled: disabledStatus });
      setGlobalConfig({ expiresAt: cleanDate, disabled: disabledStatus });
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) { console.error("Failed to write global override config:", err); alert("Error saving configurations: " + (err instanceof Error ? err.message : String(err))); } finally { setConfigSaving(false); }
  };

  const handleGoogleSignIn = async () => {
    if (authProcessing) return;
    setAuthProcessing(true); setAuthError(null); setAuthSuccess(null);
    const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
        let errorMsg = `Google authentication failed: ${err.message || err}`;
        if (err.code === 'auth/unauthorized-domain') { const currentHost=typeof window!=='undefined'?window.location.hostname:'riddimroomeventcam.web.app'; errorMsg=`Unauthorized Domain: "${currentHost}" is not authorized for Google logins. Add it in Firebase Console > Authentication > Settings > Authorized domains.`; }
        else if (err.code === 'auth/operation-not-allowed') errorMsg = `Google Sign-In is disabled. Enable it in Firebase Console > Authentication > Sign-in Method.`;
        else if (err.code === 'auth/popup-blocked') errorMsg = `Popup Blocked: Allow pop-ups for this website in your browser settings.`;
        else if (err.code === 'auth/network-request-failed') errorMsg = `Network Error: Connection to Gmail auth servers failed. Check your internet connection.`;
        setAuthError(errorMsg);
      }
    } finally { setAuthProcessing(false); }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault(); if (authProcessing) return;
    setAuthProcessing(true); setAuthError(null); setAuthSuccess(null);
    try { await signInWithEmailAndPassword(auth, email, password); confetti({ particleCount: 50, spread: 60 }); }
    catch (err: any) {
      let errorMsg = err.message || "Invalid email or password.";
      if (err.code==='auth/user-not-found') errorMsg="No account found with this email. Please Register first.";
      else if (err.code==='auth/wrong-password') errorMsg="Incorrect password. Please verify your credentials or use Forgot Password.";
      else if (err.code==='auth/invalid-credential') errorMsg="Invalid login credentials. Please double-check your email and password.";
      setAuthError(errorMsg);
    } finally { setAuthProcessing(false); }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault(); if (authProcessing) return;
    if (!displayName.trim()) { setAuthError("Full name is required"); return; }
    setAuthProcessing(true); setAuthError(null); setAuthSuccess(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
      await sendEmailVerification(userCredential.user);
      setAuthSuccess("Account created! Please check your email for verification. You will be approved and given access shortly.");
      setAuthMode('login'); confetti({ particleCount: 100, spread: 70 });
    } catch (err: any) {
      let errorMsg = err.message || "Failed to create account.";
      if (err.code==='auth/email-already-in-use') errorMsg="An account already exists with this email. Please Sign In instead.";
      else if (err.code==='auth/weak-password') errorMsg="Password must be at least 6 characters.";
      setAuthError(errorMsg);
    } finally { setAuthProcessing(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); if (authProcessing) return;
    setAuthProcessing(true); setAuthError(null); setAuthSuccess(null);
    try { await sendPasswordResetEmail(auth, email); setAuthSuccess("Password reset email sent!"); setAuthMode('login'); }
    catch (err: any) { setAuthError(err.message || "Failed to send reset email."); } finally { setAuthProcessing(false); }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); setAppState('setup'); setShowAdminPanel(false); setUserProfile(null); setAuthError(null); setAuthSuccess(null); setCustomerBranding(null); setSplashDone(false); }
    catch (err) { console.error("Sign-out error:", err); }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    if (!userIsAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status: newStatus, updatedAt: serverTimestamp() });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      confetti({ particleCount: 20, spread: 30 });
    } catch (err) { console.error("Status update error:", err); alert("Failed to update status. Check permissions."); }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!userIsAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole, updatedAt: serverTimestamp() });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) { console.error("Role update error:", err); }
  };

  // ─── White-Label: Save Customer Branding ─────────────────────────────────
  const handleSaveCustomerBranding = async (userId: string) => {
    if (!userIsAdmin) return;
    setBrandSaving(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        brandName: editBrandName.trim(),
        brandLogoUrl: editBrandLogoUrl.trim(),
        brandColor: editBrandColor,
        updatedAt: serverTimestamp()
      });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, brandName: editBrandName.trim(), brandLogoUrl: editBrandLogoUrl.trim(), brandColor: editBrandColor } : u));
      setEditingBrandUserId(null);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Brand save error:', err);
      alert('Failed to save branding: ' + (err instanceof Error ? err.message : String(err)));
    } finally { setBrandSaving(false); }
  };


  const incrementUserCaptureCount = async (type: 'photo' | 'video') => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try { const fieldToAdd=type==='photo'?'photoCount':'videoCount'; await updateDoc(userRef, { captureCount: increment(1), [fieldToAdd]: increment(1), lastActiveAt: serverTimestamp() }); }
    catch (err) { console.error("Stats logger blocked:", err); }
  };

  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [settings, setSettings] = useState<EventCamSettings>(INITIAL_SETTINGS);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [micEnabled, setMicEnabled] = useState(true);
  const [dragging, setDragging] = useState<'logo' | 'text' | 'logo-resize' | 'text-resize' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasManuallyMovedText, setHasManuallyMovedText] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1920 });
  const [selectedElement, setSelectedElement] = useState<'logo' | 'text' | null>(null);
  const [activeSelection, setActiveSelection] = useState<'logo' | 'text' | null>(null);
  const [removalMethod, setRemovalMethod] = useState<'none' | 'ai'>('ai');
  const [originalFile, setOriginalFile] = useState<File | Blob | null>(null);
  const [previewBgId, setPreviewBgId] = useState('midnight');

  const renderLogoPos = useRef({ x: INITIAL_SETTINGS.watermark.x, y: INITIAL_SETTINGS.watermark.y });
  const renderTextPos = useRef({ x: INITIAL_SETTINGS.textOverlay.x, y: INITIAL_SETTINGS.textOverlay.y });
  const settingsRef = useRef(INITIAL_SETTINGS);
  const lastTimeRef = useRef(performance.now());
  const textCacheRef = useRef<{ text: string; width: number; fontSize: number; fontFamily?: string; fontWeight?: string; fontStyle?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const watermarkImgRef = useRef<HTMLImageElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [logoReady, setLogoReady] = useState(false);
  const logoUrlRef = useRef<string | null>(null);
  const activeProcessIdRef = useRef(0);
  const lastTapRef = useRef<{ time: number; element: 'logo' | 'text' | null }>({ time: 0, element: null });
  const isCapturingRef = useRef(false);

  const cleanupLogoUrl = () => {
    if (logoUrlRef.current && logoUrlRef.current.startsWith('blob:')) { URL.revokeObjectURL(logoUrlRef.current); logoUrlRef.current = null; }
  };

  const setLogo = async (file: Blob | File) => {
    if (!file) return null;
    const newUrl = URL.createObjectURL(file);
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => { cleanupLogoUrl(); logoUrlRef.current = newUrl; watermarkImgRef.current = img; setLogoReady(true); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(newUrl); reject(new Error("Image failed to load")); };
      img.src = newUrl;
    });
  };

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      preload({ model: 'isnet_quint8', proxyToWorker: false }).then(() => { console.log("[AI] Model pre-warming completed!"); }).catch((err) => { console.warn("[AI] Pre-warming path tried but did not succeed:", err); });
    }, 2000);
    return () => clearTimeout(preloadTimer);
  }, []);

  useEffect(() => {
    if (isInitializingRef.current) return;
    if (originalFile) processLogoWithMethod(originalFile, removalMethod);
  }, [removalMethod, originalFile]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        isInitializingRef.current = true;
        const saved = await localforage.getItem<EventCamSettings>('eventcam_settings_v2');
        const storedBlob = await localforage.getItem<Blob>('eventcam_watermark_blob_v2');
        const storedOriginalBlob = await localforage.getItem<Blob>('eventcam_watermark_original_blob_v2');
        const savedMethod = await localforage.getItem<'none' | 'ai'>('eventcam_removal_method');
        if (savedMethod) setRemovalMethod(savedMethod);
        if (storedOriginalBlob) setOriginalFile(storedOriginalBlob);
        if (saved) {
          if (storedBlob) {
            try { const img = await setLogo(storedBlob); saved.watermark.assetUrl = img.src; }
            catch (logoErr) { console.warn('Stored watermark blob failed to load, falling back to default logo:', logoErr); saved.watermark.assetUrl = RIDDIM_ROOM_DEFAULT_LOGO; try { const defaultResponse=await fetch(RIDDIM_ROOM_DEFAULT_LOGO); const defaultBlob=await defaultResponse.blob(); await setLogo(defaultBlob); } catch (defaultLogoErr) { console.error('Even default logo failed to set:', defaultLogoErr); } }
          } else { saved.watermark.assetUrl = RIDDIM_ROOM_DEFAULT_LOGO; }
          if (saved.textOverlay) {
            if (!saved.textOverlay.text || saved.textOverlay.text === 'RIDDIM ROOM') saved.textOverlay.text = 'RIDDIMROOM.COM';
            if (saved.textOverlay.y === 50) saved.textOverlay.y = 90;
          }
          setSettings({ ...INITIAL_SETTINGS, ...saved, slots: saved.slots || DEFAULT_SLOTS });
        }
      } catch (err) { console.error('Failed to load settings:', err); } finally { setTimeout(() => { isInitializingRef.current = false; }, 100); }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.watermark.assetUrl && !watermarkImgRef.current) {
      const img = new Image();
      img.onload = () => { if (settingsRef.current.watermark.assetUrl === settings.watermark.assetUrl) { watermarkImgRef.current = img; setLogoReady(true); } };
      img.src = settings.watermark.assetUrl;
    }
  }, [settings.watermark.assetUrl]);

  useEffect(() => {
    const saveSettings = async () => {
      if (isInitializingRef.current) return;
      const toSave = { ...settings };
      const isDefault = settings.watermark.assetUrl === RIDDIM_ROOM_DEFAULT_LOGO;
      toSave.watermark.assetUrl = isDefault ? RIDDIM_ROOM_DEFAULT_LOGO : (settings.watermark.assetUrl ? 'STORED' : null);
      await localforage.setItem('eventcam_settings_v2', toSave);
      if (userIsAdmin) {
        try { const brandingRef=doc(db,'config','branding'); await setDoc(brandingRef, toSave, { merge: true }); }
        catch (err) { console.error("Failed to sync branding to Firestore:", err); }
      }
    };
    const timer = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timer);
  }, [settings, userIsAdmin]);


  const startCamera = useCallback(async () => {
    if (appState !== 'camera') return;
    setCameraError(null); setIsCameraLoading(true); setCameraReady(false);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.load(); }
    if (isSimulatedCamera) { await new Promise(r => setTimeout(r, 500)); setIsCameraLoading(false); setCameraReady(true); return; }
    await new Promise(r => setTimeout(r, 400));
    try {
      let stream: MediaStream | null = null;
      const premiumAudioConstraints = captureMode==='video'?(micEnabled?{echoCancellation:false,noiseSuppression:false,autoGainControl:false,sampleRate:48000,channelCount:2,sampleSize:16}:false):false;
      const fallbackAudioConstraints = captureMode==='video'?(micEnabled?{echoCancellation:{ideal:false},noiseSuppression:{ideal:false},autoGainControl:{ideal:false},sampleRate:{ideal:48000},channelCount:{ideal:2},sampleSize:{ideal:16}}:false):false;
      const constraintLadder = [
        { video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 30 } }, audio: premiumAudioConstraints },
        { video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 30 } }, audio: fallbackAudioConstraints },
        { video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }, audio: premiumAudioConstraints },
        { video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }, audio: fallbackAudioConstraints },
        { video: { facingMode, frameRate: { ideal: 30, max: 30 } }, audio: fallbackAudioConstraints },
        { video: { frameRate: { ideal: 30, max: 30 } }, audio: fallbackAudioConstraints },
        { video: true, audio: micEnabled ? { echoCancellation: false } : false }
      ];
      let lastError: any = null;
      for (let i = 0; i < constraintLadder.length; i++) {
        try { stream = await navigator.mediaDevices.getUserMedia(constraintLadder[i] as any); if (stream) break; }
        catch (err) { lastError = err; }
      }
      if (!stream) throw lastError || new Error("Failed to acquire camera device on all attempts.");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject();
          const onMetadata = async () => {
            try { await videoRef.current?.play(); setIsCameraLoading(false); setCameraReady(true); resolve(); }
            catch (e) { reject(e); }
            videoRef.current?.removeEventListener('loadedmetadata', onMetadata);
          };
          videoRef.current.addEventListener('loadedmetadata', onMetadata);
          if (videoRef.current.readyState >= 1) onMetadata();
          setTimeout(() => { videoRef.current?.removeEventListener('loadedmetadata', onMetadata); if (videoRef.current && videoRef.current.readyState >= 1) resolve(); else reject(new Error("Camera initialization timed out (5s)")); }, 5000);
        });
      }
      streamRef.current = stream;
    } catch (err) {
      console.error('Camera Error:', err); setIsCameraLoading(false);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorName = err && typeof err === 'object' && 'name' in err ? (err as any).name : '';
      if (errorMessage.toLowerCase().includes('permission')||errorMessage.toLowerCase().includes('denied')||errorName==='NotAllowedError'||errorName==='PermissionDeniedError') setCameraError('Permission denied. Please allow camera access in browser settings.');
      else if (errorMessage.toLowerCase().includes('could not start')||errorMessage.toLowerCase().includes('readable')||errorName==='NotReadableError') setCameraError('Camera is in use by another application.');
      else setCameraError(`Camera Error: ${errorMessage || errorName || 'Unknown Device Error'}`);
    }
  }, [facingMode, micEnabled, captureMode, appState, isSimulatedCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) { if (audioContextRef.current.state !== 'closed') audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
    };
  }, [startCamera]);

  const drawFrame = useCallback(() => {
    const canvas = previewCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const video = videoRef.current; const now = performance.now(); lastTimeRef.current = now;
    const s = settingsRef.current;
    let targetW = 1080; let targetH = 1920;
    if (s.aspectRatio === '16:9') { targetW = 1920; targetH = 1080; }
    else if (s.aspectRatio === '1:1') { targetW = 1080; targetH = 1080; }
    else if (s.aspectRatio === '4:5') { targetW = 1080; targetH = 1350; }
    if (canvas.width !== targetW || canvas.height !== targetH) { canvas.width = targetW; canvas.height = targetH; setCanvasSize({ width: targetW, height: targetH }); }
    renderLogoPos.current.x = s.watermark.x; renderLogoPos.current.y = s.watermark.y;
    renderTextPos.current.x = s.textOverlay.x; renderTextPos.current.y = s.textOverlay.y;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (appState === 'camera' && isSimulatedCamera) {
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, targetW, targetH);
      const timeSecs = now / 1000;
      const lightX1=targetW*0.5+Math.sin(timeSecs*0.8)*targetW*0.22; const lightY1=targetH*0.4+Math.cos(timeSecs*0.6)*targetH*0.16; const radius1=targetW*(0.6+Math.sin(timeSecs*1.5)*0.06);
      const rGrad1=ctx.createRadialGradient(lightX1,lightY1,10,lightX1,lightY1,radius1); rGrad1.addColorStop(0,'rgba(0, 155, 58, 0.26)'); rGrad1.addColorStop(0.5,'rgba(210, 16, 52, 0.13)'); rGrad1.addColorStop(1,'rgba(0, 0, 0, 0)'); ctx.fillStyle=rGrad1; ctx.fillRect(0,0,targetW,targetH);
      const lightX2=targetW*0.5+Math.cos(timeSecs*1.1)*targetW*0.26; const lightY2=targetH*0.55+Math.sin(timeSecs*1.3)*targetH*0.18; const radius2=targetW*(0.48+Math.cos(timeSecs*0.95)*0.05);
      const rGrad2=ctx.createRadialGradient(lightX2,lightY2,5,lightX2,lightY2,radius2); rGrad2.addColorStop(0,'rgba(255, 209, 0, 0.2)'); rGrad2.addColorStop(0.65,'rgba(0, 155, 58, 0.08)'); rGrad2.addColorStop(1,'rgba(0, 0, 0, 0)'); ctx.fillStyle=rGrad2; ctx.fillRect(0,0,targetW,targetH);
      for (let i=0;i<9;i++) { const speed=0.4+i*0.07; const radius=28+i*11; const bx=targetW*0.5+Math.sin(timeSecs*speed+i*1.6)*targetW*0.36; const by=targetH*0.5+Math.cos(timeSecs*(speed*0.9)+i*2.1)*targetH*0.26; const alpha=0.07+Math.sin(timeSecs*2.0+i)*0.035; ctx.fillStyle=i%3===0?`rgba(0, 155, 58, ${alpha})`:(i%3===1?`rgba(210, 16, 52, ${alpha})`:`rgba(255, 209, 0, ${alpha})`); ctx.beginPath(); ctx.arc(bx,by,radius,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=i%3===0?`rgba(0, 155, 58, ${alpha*0.65})`:(i%3===1?`rgba(210, 16, 52, ${alpha*0.65})`:`rgba(255, 209, 0, ${alpha*0.65})`); ctx.lineWidth=1.5; ctx.stroke(); }
      ctx.fillStyle='rgba(255, 255, 255, 0.012)'; for (let y=0;y<targetH;y+=7) ctx.fillRect(0,y,targetW,1.5);
      ctx.strokeStyle='rgba(255, 255, 255, 0.3)'; ctx.lineWidth=2.5; const frameMargin=60; const markerLength=35;
      ctx.beginPath(); ctx.moveTo(frameMargin+markerLength,frameMargin); ctx.lineTo(frameMargin,frameMargin); ctx.lineTo(frameMargin,frameMargin+markerLength); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(targetW-frameMargin-markerLength,frameMargin); ctx.lineTo(targetW-frameMargin,frameMargin); ctx.lineTo(targetW-frameMargin,frameMargin+markerLength); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(frameMargin+markerLength,targetH-frameMargin); ctx.lineTo(frameMargin,targetH-frameMargin); ctx.lineTo(frameMargin,targetH-frameMargin+markerLength); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(targetW-frameMargin-markerLength,targetH-frameMargin); ctx.lineTo(targetW-frameMargin,targetH-frameMargin); ctx.lineTo(targetW-frameMargin,targetH-frameMargin+markerLength); ctx.stroke();
      ctx.strokeStyle='rgba(255, 255, 255, 0.08)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(targetW*0.5,targetH*0.45,140,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(5, 5, 5, 0.94)'; ctx.beginPath(); ctx.moveTo(0,targetH); for (let x=0;x<=targetW;x+=15) { const wave=Math.sin(x*0.013+timeSecs*2.9)*11+Math.cos(x*0.007-timeSecs*1.7)*8; ctx.lineTo(x,targetH-120+wave); } ctx.lineTo(targetW,targetH); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255, 255, 255, 0.45)'; ctx.font='bold 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText('• LIVE VIRTUAL STUDIO •',targetW/2,frameMargin+45);
    } else if (appState === 'camera' && video && video.readyState >= 2) {
      const videoAspect=video.videoWidth/video.videoHeight; const canvasAspect=targetW/targetH;
      let sx=0,sy=0,sw=video.videoWidth,sh=video.videoHeight;
      if (videoAspect>canvasAspect) { sw=video.videoHeight*canvasAspect; sx=(video.videoWidth-sw)/2; } else { sh=video.videoWidth/canvasAspect; sy=(video.videoHeight-sh)/2; }
      if (facingMode==='user') { ctx.save(); ctx.translate(targetW,0); ctx.scale(-1,1); ctx.drawImage(video,sx,sy,sw,sh,0,0,targetW,targetH); ctx.restore(); } else { ctx.drawImage(video,sx,sy,sw,sh,0,0,targetW,targetH); }
    } else {
      if (previewBgId === 'laser') { const grad=ctx.createRadialGradient(targetW/2,0,50,targetW/2,0,targetH); grad.addColorStop(0,'#ffd100'); grad.addColorStop(0.3,'#009b3a'); grad.addColorStop(0.8,'#d21034'); grad.addColorStop(1,'#050505'); ctx.fillStyle=grad; ctx.fillRect(0,0,targetW,targetH); ctx.strokeStyle='rgba(255, 255, 255, 0.08)'; ctx.lineWidth=2; for (let i=0;i<=targetW;i+=targetW/10) { ctx.beginPath(); ctx.moveTo(targetW/2,0); ctx.lineTo(i,targetH); ctx.stroke(); } }
      else if (previewBgId === 'neon_bass') { ctx.fillStyle='#0f1115'; ctx.fillRect(0,0,targetW,targetH); ctx.strokeStyle='rgba(0, 155, 58, 0.2)'; ctx.lineWidth=1.5; for (let y=0;y<targetH;y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(targetW,y+Math.sin(y/100)*30); ctx.stroke(); } ctx.fillStyle='rgba(210, 16, 52, 0.06)'; ctx.beginPath(); ctx.arc(targetW/2,targetH/2,targetW/3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(targetW/2,targetH/2,targetW/6,0,Math.PI*2); ctx.fill(); }
      else if (previewBgId === 'tropical') { const grad=ctx.createLinearGradient(0,0,0,targetH); grad.addColorStop(0,'#d21034'); grad.addColorStop(0.5,'#ffd100'); grad.addColorStop(1,'#009b3a'); ctx.fillStyle=grad; ctx.fillRect(0,0,targetW,targetH); const sunGrad=ctx.createRadialGradient(targetW/2,targetH/2,10,targetW/2,targetH/2,targetW); sunGrad.addColorStop(0,'rgba(0,0,0,0)'); sunGrad.addColorStop(1,'rgba(0,0,0,0.85)'); ctx.fillStyle=sunGrad; ctx.fillRect(0,0,targetW,targetH); }
      else { ctx.fillStyle='#0a0a0a'; ctx.fillRect(0,0,targetW,targetH); }
    }

    const showSelection = !isRecording && !isCapturingRef.current;
    const isLogoSelected = showSelection && (dragging==='logo'||dragging==='logo-resize'||selectedElement==='logo'||activeSelection==='logo');
    const isTextSelected = showSelection && (dragging==='text'||dragging==='text-resize'||selectedElement==='text'||activeSelection==='text');
    const anySelected = isLogoSelected || isTextSelected;

    const drawResizeHandle = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
      ctx.save(); ctx.shadowColor='rgba(0, 0, 0, 0.4)'; ctx.shadowBlur=10; ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0; ctx.strokeStyle='#3b82f6'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='#3b82f6'; ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill(); ctx.restore();
    };

    const drawLogo = (ctx: CanvasRenderingContext2D) => {
      if (!logoReady||!watermarkImgRef.current) return;
      const img=watermarkImgRef.current; const x=(renderLogoPos.current.x/100)*canvas.width; const y=(renderLogoPos.current.y/100)*canvas.height; const w=canvas.width*(s.watermark.size/100); const h=img.height*(w/img.width);
      ctx.save();
      if (anySelected&&!isLogoSelected) ctx.globalAlpha=s.watermark.opacity*0.3; else ctx.globalAlpha=s.watermark.opacity;
      if (isLogoSelected) { ctx.strokeStyle='#3b82f6'; ctx.lineWidth=4; ctx.setLineDash(dragging==='logo'||dragging==='logo-resize'?[]:[10,5]); ctx.strokeRect(x-5,y-5,w+10,h+10); }
      ctx.drawImage(img,x,y,w,h);
      if (isLogoSelected) drawResizeHandle(ctx,x+w+5,y+h+5);
      ctx.restore();
    };

    const drawText = (ctx: CanvasRenderingContext2D) => {
      const text=s.textOverlay.text; if (!text) return;
      const x=(renderTextPos.current.x/100)*canvas.width; const y=(renderTextPos.current.y/100)*canvas.height;
      const fontSize=(s.textOverlay.fontSize/1080)*canvas.width; const lineHeight=fontSize*1.25;
      const fontFamily=s.textOverlay.fontFamily||'"Space Grotesk", sans-serif'; const fontWeight=s.textOverlay.fontWeight||'bold'; const fontStyle=s.textOverlay.fontStyle||'normal';
      ctx.save(); ctx.font=`${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`; ctx.textBaseline='top'; ctx.textAlign='center';
      const lines=text.split('\n');
      if (!textCacheRef.current||textCacheRef.current.text!==text||textCacheRef.current.fontSize!==fontSize||textCacheRef.current.fontFamily!==fontFamily||textCacheRef.current.fontWeight!==fontWeight||textCacheRef.current.fontStyle!==fontStyle) {
        let maxW=0; lines.forEach(line=>{const w=ctx.measureText(line).width;if(w>maxW)maxW=w;}); textCacheRef.current={text,width:maxW,fontSize,fontFamily,fontWeight,fontStyle};
      }
      const textW=textCacheRef.current.width;
      if (anySelected&&!isTextSelected) ctx.globalAlpha=s.textOverlay.opacity*0.3; else ctx.globalAlpha=s.textOverlay.opacity;
      const totalHeight=lines.length*lineHeight; const topLeftX=x-textW/2; const topLeftY=y-totalHeight/2;
      if (isTextSelected) { ctx.strokeStyle='#3b82f6'; ctx.lineWidth=4; ctx.setLineDash(dragging==='text'||dragging==='text-resize'?[]:[10,5]); ctx.strokeRect(topLeftX-5,topLeftY-5,textW+10,totalHeight+10); }
      ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=15;
      lines.forEach((line,i)=>{const lineX=x;const lineY=topLeftY+i*lineHeight;ctx.strokeStyle='black';ctx.lineWidth=fontSize*0.05;ctx.strokeText(line,lineX,lineY);ctx.fillStyle=s.textOverlay.color;ctx.fillText(line,lineX,lineY);});
      if (isTextSelected) drawResizeHandle(ctx,topLeftX+textW+5,topLeftY+totalHeight+5);
      ctx.restore();
    };

    if (dragging) {
      ctx.save(); ctx.setLineDash([10,10]); ctx.strokeStyle='rgba(59, 130, 246, 0.2)'; ctx.lineWidth=2;
      [5,50,95].forEach(s=>{const v=(s/100)*canvas.width;const h=(s/100)*canvas.height;ctx.beginPath();ctx.moveTo(v,0);ctx.lineTo(v,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(canvas.width,h);ctx.stroke();});
      ctx.restore();
    }
    drawLogo(ctx); drawText(ctx);
    rafIdRef.current = requestAnimationFrame(drawFrame);
  }, [dragging, appState, logoReady, selectedElement, activeSelection, isRecording, facingMode, previewBgId, isSimulatedCamera]);

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(drawFrame);
    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, [drawFrame]);


  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isRecording) return;
    const canvas = e.currentTarget; if (!canvas) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { console.warn("Failed to capture pointer:", err); }
    const rect = canvas.getBoundingClientRect(); const clickX=e.clientX-rect.left; const clickY=e.clientY-rect.top;
    const s = settingsRef.current; const now = Date.now();
    if (logoReady && watermarkImgRef.current) {
      const img=watermarkImgRef.current; const logoX=(s.watermark.x/100)*rect.width; const logoY=(s.watermark.y/100)*rect.height; const logoW=(s.watermark.size/100)*rect.width; const logoH=(img.height/img.width)*logoW;
      const handleX=logoX+logoW+5; const handleY=logoY+logoH+5; const distToResize=Math.hypot(clickX-handleX,clickY-handleY);
      if (distToResize<25) { setDragging('logo-resize'); setActiveSelection('logo'); return; }
      const isLogoHit=clickX>=logoX-8&&clickX<=logoX+logoW+8&&clickY>=logoY-8&&clickY<=logoY+logoH+8;
      if (isLogoHit) {
        setDragging('logo'); const xPercent=(clickX/rect.width)*100; const yPercent=(clickY/rect.height)*100;
        setDragOffset({x:xPercent-s.watermark.x,y:yPercent-s.watermark.y}); setActiveSelection('logo');
        if (now-lastTapRef.current.time<300&&lastTapRef.current.element==='logo') setSelectedElement('logo');
        lastTapRef.current={time:now,element:'logo'}; return;
      }
    }
    if (s.textOverlay.text && textCacheRef.current) {
      const linesCount=s.textOverlay.text.split('\n').length;
      const textX=(s.textOverlay.x/100)*rect.width; const textY=(s.textOverlay.y/100)*rect.height;
      const textW=(textCacheRef.current.width/canvas.width)*rect.width;
      const fontSize=(s.textOverlay.fontSize/1080)*canvas.width; const lineHeight=fontSize*1.25; const textH=((linesCount*lineHeight)/canvas.height)*rect.height;
      const topLeftX=textX-textW/2; const topLeftY=textY-textH/2;
      const handleX=topLeftX+textW+5; const handleY=topLeftY+textH+5; const distToResize=Math.hypot(clickX-handleX,clickY-handleY);
      if (distToResize<25) { setDragging('text-resize'); setActiveSelection('text'); return; }
      const isTextHit=clickX>=topLeftX-12&&clickX<=topLeftX+textW+12&&clickY>=topLeftY-12&&clickY<=topLeftY+textH+12;
      if (isTextHit) {
        setDragging('text'); const xPercent=(clickX/rect.width)*100; const yPercent=(clickY/rect.height)*100;
        setDragOffset({x:xPercent-s.textOverlay.x,y:yPercent-s.textOverlay.y}); setActiveSelection('text');
        if (now-lastTapRef.current.time<300&&lastTapRef.current.element==='text') setSelectedElement('text');
        lastTapRef.current={time:now,element:'text'}; return;
      }
    }
    setActiveSelection(null); setSelectedElement(null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    setDragging(null);
  };

  const lastMoveTimeRef = useRef(0);
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const now = performance.now(); if (now-lastMoveTimeRef.current<4) return; lastMoveTimeRef.current=now;
    const canvas=previewCanvasRef.current; if (!canvas) return;
    const rect=canvas.getBoundingClientRect(); const s=settingsRef.current;
    if (dragging==='logo-resize'&&watermarkImgRef.current) {
      const xPixel=((e.clientX-rect.left)/rect.width)*canvas.width; const logoLeftPixel=(s.watermark.x/100)*canvas.width; const newW=xPixel-logoLeftPixel; const newSize=(newW/canvas.width)*100;
      setSettings(prev=>({...prev,watermark:{...prev.watermark,size:Math.round(Math.max(5,Math.min(80,newSize)))}}));
    } else if (dragging==='text-resize'&&textCacheRef.current) {
      const xPixel=((e.clientX-rect.left)/rect.width)*canvas.width; const centerXPixel=(s.textOverlay.x/100)*canvas.width; const newWidth=Math.max(20,Math.abs(xPixel-centerXPixel)*2);
      const currentVisualFontSize=(s.textOverlay.fontSize/1080)*canvas.width; const widthPerFontSize=textCacheRef.current.width/currentVisualFontSize;
      if (widthPerFontSize>0) { const newVisualFontSize=newWidth/widthPerFontSize; const newFontSize=(newVisualFontSize*1080)/canvas.width; setSettings(prev=>({...prev,textOverlay:{...prev.textOverlay,fontSize:Math.round(Math.max(12,Math.min(180,newFontSize)))}})); setHasManuallyMovedText(true); }
    } else {
      let x=((e.clientX-rect.left)/rect.width)*100-dragOffset.x; let y=((e.clientY-rect.top)/rect.height)*100-dragOffset.y;
      if (dragging==='logo') setSettings(s=>({...s,watermark:{...s.watermark,x,y}}));
      else if (dragging==='text') { setSettings(s=>({...s,textOverlay:{...s.textOverlay,x,y}})); setHasManuallyMovedText(true); }
    }
  };

  const capture = async () => {
    if (captureMode==='photo') {
      const canvas=previewCanvasRef.current; if (!canvas) return;
      isCapturingRef.current=true; drawFrame(); setIsFlashing(true);
      const dataUrl=canvas.toDataURL('image/png'); const link=document.createElement('a'); link.href=dataUrl; link.download=`eventcam_${Date.now()}.png`; link.click();
      incrementUserCaptureCount('photo'); isCapturingRef.current=false; setTimeout(()=>setIsFlashing(false),200);
      confetti({particleCount:150,spread:70,origin:{y:0.9}});
    } else { if (isRecording) stopRecording(); else startRecording(); }
  };

  const startRecording = async () => {
    const canvas=previewCanvasRef.current; if (!canvas) return;
    setSelectedElement(null); setActiveSelection(null); recordedChunksRef.current=[];
    const canvasStream=canvas.captureStream(30); let processedTracks: MediaStreamTrack[]=[]; let audioCtx: AudioContext|null=null;
    try {
      const AudioContextClass=window.AudioContext||(window as any).webkitAudioContext; audioCtx=new AudioContextClass(); audioContextRef.current=audioCtx;
      const dest=audioCtx.createMediaStreamDestination(); const limiter=audioCtx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-1.0,audioCtx.currentTime); limiter.knee.setValueAtTime(0,audioCtx.currentTime); limiter.ratio.setValueAtTime(20,audioCtx.currentTime); limiter.attack.setValueAtTime(0.001,audioCtx.currentTime); limiter.release.setValueAtTime(0.050,audioCtx.currentTime); limiter.connect(dest);
      const audioStream=streamRef.current;
      if (micEnabled&&audioStream&&audioStream.getAudioTracks().length>0&&!isSimulatedCamera) {
        const source=audioCtx.createMediaStreamSource(audioStream);
        const hpFilter=audioCtx.createBiquadFilter(); hpFilter.type='highpass'; hpFilter.frequency.value=85; hpFilter.Q.value=0.707;
        const eqPresence=audioCtx.createBiquadFilter(); eqPresence.type='peaking'; eqPresence.frequency.value=3200; eqPresence.Q.value=1.0; eqPresence.gain.value=2.5;
        const eqWarmth=audioCtx.createBiquadFilter(); eqWarmth.type='peaking'; eqWarmth.frequency.value=140; eqWarmth.Q.value=1.2; eqWarmth.gain.value=1.0;
        const eqAir=audioCtx.createBiquadFilter(); eqAir.type='highshelf'; eqAir.frequency.value=8500; eqAir.gain.value=3.5;
        const compressor=audioCtx.createDynamicsCompressor(); compressor.threshold.setValueAtTime(-18,audioCtx.currentTime); compressor.knee.setValueAtTime(25,audioCtx.currentTime); compressor.ratio.setValueAtTime(6,audioCtx.currentTime); compressor.attack.setValueAtTime(0.008,audioCtx.currentTime); compressor.release.setValueAtTime(0.200,audioCtx.currentTime);
        const makeupGain=audioCtx.createGain(); makeupGain.gain.setValueAtTime(1.8,audioCtx.currentTime);
        source.connect(hpFilter); hpFilter.connect(eqPresence); eqPresence.connect(eqWarmth); eqWarmth.connect(eqAir); eqAir.connect(compressor); compressor.connect(makeupGain); makeupGain.connect(limiter);
      }
      const silentHardwareGain=audioCtx.createGain(); silentHardwareGain.gain.setValueAtTime(0.0,audioCtx.currentTime); limiter.connect(silentHardwareGain); silentHardwareGain.connect(audioCtx.destination);
      if (audioCtx.state==='suspended') await audioCtx.resume();
      processedTracks=dest.stream.getAudioTracks();
    } catch (err) { console.error('Web Audio init failed, falling back to basic stream:', err); processedTracks=(streamRef.current&&streamRef.current.getAudioTracks().length>0)?streamRef.current.getAudioTracks():[]; }
    const combinedStream=canvasStream; processedTracks.forEach(track=>combinedStream.addTrack(track));
    const codecs=['video/mp4;codecs=avc1,mp4a.40.2','video/mp4;codecs=h264,aac','video/mp4;codecs=avc1,mp4a','video/mp4','video/webm;codecs=h264,opus','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm;codecs=h264','video/webm'];
    let mimeType=''; for (const codec of codecs) { if (MediaRecorder.isTypeSupported(codec)) { mimeType=codec; break; } }
    if (!mimeType) mimeType='video/webm';
    try {
      const recorder=new MediaRecorder(combinedStream,{mimeType,videoBitsPerSecond:8000000,audioBitsPerSecond:128000});
      recorder.ondataavailable=(event)=>{ if (event.data.size>0) recordedChunksRef.current.push(event.data); };
      recorder.onstop=()=>{
        const finalType=recorder.mimeType||mimeType; const blob=new Blob(recordedChunksRef.current,{type:finalType}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url;
        const isMp4=finalType.toLowerCase().includes('mp4')||finalType.toLowerCase().includes('avc1'); const extension=isMp4?'mp4':'webm';
        link.download=`eventcam_recording_${Date.now()}.${extension}`; link.click(); URL.revokeObjectURL(url); incrementUserCaptureCount('video');
        setIsRecording(false); setRecordingTime(0); if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (audioContextRef.current) { if (audioContextRef.current.state!=='closed') audioContextRef.current.close().catch(e=>console.error('Error closing AudioContext:',e)); audioContextRef.current=null; }
      };
      recorder.start(1000); mediaRecorderRef.current=recorder; setIsRecording(true); setRecordingTime(0);
      timerIntervalRef.current=window.setInterval(()=>setRecordingTime(prev=>prev+1),1000);
    } catch (err) { console.error('Failed to start recording:', err); if (audioContextRef.current) { if (audioContextRef.current.state!=='closed') audioContextRef.current.close().catch(()=>{}); audioContextRef.current=null; } }
  };

  const stopRecording = () => { if (mediaRecorderRef.current&&isRecording) mediaRecorderRef.current.stop(); };

  const resetOverlays = () => {
    setSettings(s=>({...s,watermark:{...INITIAL_SETTINGS.watermark,assetUrl:s.watermark.assetUrl},textOverlay:{...INITIAL_SETTINGS.textOverlay}}));
    confetti({particleCount:30,spread:50,origin:{y:0.8}});
  };

  const getProductionUrl = (path: string = '') => {
    if (typeof window==='undefined') return ''; const origin=window.location.origin; const finalPath=path.startsWith('/')?path:`/${path}`;
    if (path==='') return `${origin}/`; return `${origin}${finalPath}`;
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setAuthSuccess("Link Copied to Clipboard!"); setTimeout(()=>setAuthSuccess(null),3000); }
    catch (err) { const textArea=document.createElement("textarea"); textArea.value=text; document.body.appendChild(textArea); textArea.select(); try { document.execCommand('copy'); setAuthSuccess("Link Copied!"); setTimeout(()=>setAuthSuccess(null),2000); } catch (copyErr) { setAuthError("Failed to copy link. Please manually copy the URL."); } document.body.removeChild(textArea); }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err=>console.error(`Fullscreen error: ${err.message}`)); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const handleLaunch = () => {
    setAppState('camera'); setSelectedElement(null); setActiveSelection(null);
    try { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); } catch (e) {}
  };

  const formatTime = (seconds: number) => { const mins=Math.floor(seconds/60); const secs=seconds%60; return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`; };

  const handleBackToSetup = () => {
    if (isKioskMode) return; setAppState('setup');
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  };

  const centerLogo = () => {
    const s=settingsRef.current; if (!watermarkImgRef.current) return;
    const size=s.watermark.size; const img=watermarkImgRef.current; const canvas=previewCanvasRef.current; if (!canvas) return;
    const logoW=size; const canvasAspect=canvas.width/canvas.height; const logoH=(img.height/img.width)*logoW*canvasAspect;
    const targetX=50-(logoW/2); const targetY=50-(logoH/2);
    renderLogoPos.current={x:targetX,y:targetY};
    setSettings(prev=>({...prev,watermark:{...prev.watermark,x:targetX,y:targetY}}));
  };

  const getCenteredCoordinates = (textToCenter: string, customSettings?: EventCamSettings) => ({ x: 50, y: 50 });

  const centerText = () => {
    renderTextPos.current={x:50,y:50};
    setSettings(prev=>({...prev,textOverlay:{...prev.textOverlay,x:50,y:50}}));
  };

  const processLogoWithMethod = async (file: File | Blob, method: 'none' | 'ai') => {
    const processId=++activeProcessIdRef.current; setIsProcessing(true); setProcessingProgress(0);
    try {
      await localforage.setItem('eventcam_watermark_original_blob_v2',file);
      await localforage.setItem('eventcam_removal_method',method);
      if (method==='none') {
        const img=await setLogo(file); if (processId!==activeProcessIdRef.current) return;
        await localforage.setItem('eventcam_watermark_blob_v2',file);
        setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:img.src}})); setIsProcessing(false); setTimeout(centerLogo,50); return;
      }
      if (method==='ai') {
        if (processId!==activeProcessIdRef.current) return; setProcessingProgress(5);
        const originalUrl=URL.createObjectURL(file); const tempImg=new Image();
        await new Promise<void>((resolve)=>{
          tempImg.onload=()=>{ if (processId!==activeProcessIdRef.current) { URL.revokeObjectURL(originalUrl); return; } cleanupLogoUrl(); logoUrlRef.current=originalUrl; watermarkImgRef.current=tempImg; setLogoReady(true); setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:originalUrl}})); setTimeout(centerLogo,50); resolve(); }; tempImg.onerror=()=>resolve(); tempImg.src=originalUrl;
        });
        if (processId!==activeProcessIdRef.current) return;
        const classification=classifyImage(tempImg);
        if (classification.hasTransparency) {
          const bgAnalysis=checkImageHasSolidBackground(tempImg);
          if (!bgAnalysis.isSolid) {
            setProcessingProgress(100); const processedImg=await setLogo(file); if (processId!==activeProcessIdRef.current) return;
            await localforage.setItem('eventcam_watermark_blob_v2',file); setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:processedImg.src}})); setIsProcessing(false); setTimeout(centerLogo,50); return;
          }
        }
        if (classification.type==='graphic') {
          try {
            setProcessingProgress(40); let processedBlob: Blob;
            const bgAnalysis=checkImageHasSolidBackground(tempImg);
            if (bgAnalysis.type==='checkerboard') processedBlob=await removeCheckerboardBackground(tempImg,bgAnalysis.colorA,bgAnalysis.colorB,30);
            else processedBlob=await removeGraphicBackground(tempImg,35);
            if (processId!==activeProcessIdRef.current) return;
            setProcessingProgress(90); const processedImg=await setLogo(processedBlob); if (processId!==activeProcessIdRef.current) return;
            await localforage.setItem('eventcam_watermark_blob_v2',processedBlob); setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:processedImg.src}})); setProcessingProgress(100); setIsProcessing(false); setTimeout(centerLogo,50); return;
          } catch (graphicErr) { console.error("Graphic pipeline failed, retrying with AI fallback:", graphicErr); }
        }
        try {
          if (processId!==activeProcessIdRef.current) return; setProcessingProgress(15);
          const detectionBlob=await getResizedBlob(file,256); if (processId!==activeProcessIdRef.current) return; setProcessingProgress(30);
          const removeTask=removeBackgroundWithFallback(detectionBlob,(percent:any)=>setProcessingProgress(30+Math.round(percent*60)),processId,activeProcessIdRef);
          const timeoutTask=new Promise<Blob>((_,reject)=>setTimeout(()=>reject(new Error("AI model processing timed out")),10000));
          const maskBlob=await Promise.race([removeTask,timeoutTask]) as Blob; if (processId!==activeProcessIdRef.current) return;
          const maskUrl=URL.createObjectURL(maskBlob); setProcessingProgress(92);
          const highResBlob=await getResizedBlob(file,1200); if (processId!==activeProcessIdRef.current) { URL.revokeObjectURL(maskUrl); return; }
          const highResUrl=URL.createObjectURL(highResBlob);
          const maskImg=new Image(); const sourceImg=new Image();
          await Promise.all([new Promise((resolve)=>{maskImg.onload=resolve;maskImg.src=maskUrl;}),new Promise((resolve)=>{sourceImg.onload=resolve;sourceImg.src=highResUrl;})]);
          if (processId!==activeProcessIdRef.current) { URL.revokeObjectURL(maskUrl); URL.revokeObjectURL(highResUrl); return; }
          const canvas=document.createElement('canvas'); canvas.width=sourceImg.width; canvas.height=sourceImg.height; const ctx=canvas.getContext('2d');
          if (ctx) {
            const w=canvas.width; const h=canvas.height;
            const srcCanvas=document.createElement('canvas'); srcCanvas.width=w; srcCanvas.height=h; const srcCtx=srcCanvas.getContext('2d');
            const maskCanvas=document.createElement('canvas'); maskCanvas.width=w; maskCanvas.height=h; const maskCtx=maskCanvas.getContext('2d');
            if (srcCtx&&maskCtx) {
              srcCtx.drawImage(sourceImg,0,0); const sourceImgData=srcCtx.getImageData(0,0,w,h);
              maskCtx.drawImage(maskImg,0,0,w,h); const maskImgData=maskCtx.getImageData(0,0,w,h);
              let opaquePixels=0; const totalPixels=w*h; for (let i=0;i<totalPixels;i++) { if (maskImgData.data[i*4+3]>10) opaquePixels++; }
              const opaqueRatio=opaquePixels/totalPixels;
              let finalImgData: ImageData;
              if (opaqueRatio<0.003) {
                const fallbackBlob=await removeGraphicBackground(tempImg,35); if (processId!==activeProcessIdRef.current) return;
                const processedImg=await setLogo(fallbackBlob); await localforage.setItem('eventcam_watermark_blob_v2',fallbackBlob);
                setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:processedImg.src}})); setIsProcessing(false); setTimeout(centerLogo,50);
                URL.revokeObjectURL(maskUrl); URL.revokeObjectURL(highResUrl); return;
              } else { finalImgData=refineMaskAndDecontaminate(sourceImgData,maskImgData,{erodeRadius:1,featherRadius:2,decontaminateRadius:8}); }
              ctx.putImageData(finalImgData,0,0);
            } else { ctx.drawImage(sourceImg,0,0); ctx.globalCompositeOperation='destination-in'; ctx.drawImage(maskImg,0,0,canvas.width,canvas.height); }
            await new Promise<void>((resolve,reject)=>{
              canvas.toBlob(async(finalBlob)=>{
                try {
                  if (processId!==activeProcessIdRef.current) { reject(new Error("Process preempted")); return; }
                  if (!finalBlob) { reject(new Error("Composite failed")); return; }
                  await localforage.setItem('eventcam_watermark_blob_v2',finalBlob);
                  const processedUrl=URL.createObjectURL(finalBlob); const processedImg=new Image();
                  processedImg.onload=()=>{ if (processId!==activeProcessIdRef.current) { URL.revokeObjectURL(processedUrl); reject(new Error("Process preempted")); return; } cleanupLogoUrl(); logoUrlRef.current=processedUrl; watermarkImgRef.current=processedImg; setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:processedUrl}})); resolve(); };
                  processedImg.onerror=reject; processedImg.src=processedUrl;
                } catch (e) { reject(e); }
              },'image/png');
            });
          }
          URL.revokeObjectURL(maskUrl); URL.revokeObjectURL(highResUrl);
          if (processId===activeProcessIdRef.current) setIsProcessing(false);
        } catch (imglyErr) {
          console.warn("imgly background removal failed, falling back to custom graphics extractor:", imglyErr);
          if (processId!==activeProcessIdRef.current) return; setProcessingProgress(95);
          try {
            const processedBlob=await removeGraphicBackground(tempImg,35); if (processId!==activeProcessIdRef.current) return;
            const processedImg=await setLogo(processedBlob); if (processId!==activeProcessIdRef.current) return;
            await localforage.setItem('eventcam_watermark_blob_v2',processedBlob);
            setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:processedImg.src}})); setIsProcessing(false); setTimeout(centerLogo,50);
          } catch (fallbackErr) { console.error("General background extraction fallback failed:", fallbackErr); setIsProcessing(false); }
        }
      }
    } catch (err) { console.error("General logo processing failed:", err); if (processId===activeProcessIdRef.current) setIsProcessing(false); }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if (!file) return; setOriginalFile(file); e.target.value='';
  };

  const selectBuiltinLogo = async (logoSvg: string) => {
    setIsProcessing(true);
    try {
      const blob=new Blob([logoSvg],{type:'image/svg+xml;charset=utf-8'}); setOriginalFile(null);
      await localforage.setItem('eventcam_watermark_blob_v2',blob); await localforage.removeItem('eventcam_watermark_original_blob_v2'); await localforage.setItem('eventcam_removal_method','none'); setRemovalMethod('none');
      const img=await setLogo(blob); setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:img.src}})); setTimeout(centerLogo,50);
    } catch (error) { console.error("Error setting built-in logo:", error); } finally { setIsProcessing(false); }
  };

  const saveSlot = async (slotId: number) => {
    setIsProcessing(true);
    try {
      const currentAssetBlob=await localforage.getItem<Blob>('eventcam_watermark_blob_v2');
      if (currentAssetBlob) await localforage.setItem(`eventcam_slot_asset_${slotId}`,currentAssetBlob); else await localforage.removeItem(`eventcam_slot_asset_${slotId}`);
      const currentOriginalBlob=await localforage.getItem<Blob>('eventcam_watermark_original_blob_v2');
      if (currentOriginalBlob) await localforage.setItem(`eventcam_slot_original_asset_${slotId}`,currentOriginalBlob); else await localforage.removeItem(`eventcam_slot_original_asset_${slotId}`);
      const currentMethod=await localforage.getItem<'none'|'ai'>('eventcam_removal_method');
      if (currentMethod) await localforage.setItem(`eventcam_slot_removal_method_${slotId}`,currentMethod); else await localforage.removeItem(`eventcam_slot_removal_method_${slotId}`);
      const currentSlots=settings.slots||DEFAULT_SLOTS; const newSlots=[...currentSlots];
      newSlots[slotId]={id:slotId,isEmpty:false,watermark:{size:settings.watermark.size,opacity:settings.watermark.opacity,position:settings.watermark.position,x:settings.watermark.x,y:settings.watermark.y,hasAsset:!!settings.watermark.assetUrl},textOverlay:{...settings.textOverlay},aspectRatio:settings.aspectRatio};
      setSettings(s=>({...s,slots:newSlots})); setActiveSlotId(slotId); confetti({particleCount:50,spread:60,origin:{y:0.8}});
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };

  const loadSlot = async (slotId: number) => {
    if (!settings.slots) return; const slot=settings.slots[slotId]; if (!slot||slot.isEmpty) return;
    setIsProcessing(true);
    try {
      let assetUrl = null;
      if (slot.watermark.hasAsset) {
        const blob=await localforage.getItem<Blob>(`eventcam_slot_asset_${slotId}`); const originalBlob=await localforage.getItem<Blob>(`eventcam_slot_original_asset_${slotId}`); const savedMethod=await localforage.getItem<'none'|'ai'>(`eventcam_slot_removal_method_${slotId}`);
        isInitializingRef.current=true;
        if (savedMethod) { setRemovalMethod(savedMethod); await localforage.setItem('eventcam_removal_method',savedMethod); } else { setRemovalMethod('ai'); await localforage.setItem('eventcam_removal_method','ai'); }
        if (originalBlob) { setOriginalFile(originalBlob); await localforage.setItem('eventcam_watermark_original_blob_v2',originalBlob); } else { setOriginalFile(null); await localforage.removeItem('eventcam_watermark_original_blob_v2'); }
        if (blob) { await localforage.setItem('eventcam_watermark_blob_v2',blob); const img=await setLogo(blob); assetUrl=img.src; }
        else { assetUrl=RIDDIM_ROOM_DEFAULT_LOGO; try { const res=await fetch(RIDDIM_ROOM_DEFAULT_LOGO); const defaultBlob=await res.blob(); await setLogo(defaultBlob); } catch (err) { console.error("Failed to fetch custom logo blob:", err); } }
        setTimeout(()=>{isInitializingRef.current=false;},100);
      } else {
        isInitializingRef.current=true; setOriginalFile(null); await localforage.removeItem('eventcam_watermark_original_blob_v2'); await localforage.removeItem('eventcam_removal_method'); setRemovalMethod('ai');
        assetUrl=RIDDIM_ROOM_DEFAULT_LOGO; try { const res=await fetch(RIDDIM_ROOM_DEFAULT_LOGO); const defaultBlob=await res.blob(); await setLogo(defaultBlob); } catch (err) { console.error("Failed to fetch custom logo blob:", err); }
        setTimeout(()=>{isInitializingRef.current=false;},100);
      }
      setSettings(s=>({...s,watermark:{...slot.watermark,assetUrl},textOverlay:{...slot.textOverlay},aspectRatio:slot.aspectRatio||s.aspectRatio})); setActiveSlotId(slotId);
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [slotToClear, setSlotToClear] = useState<number | null>(null);

  const clearSlot = async (slotId: number) => {
    setIsProcessing(true);
    try {
      await localforage.removeItem(`eventcam_slot_asset_${slotId}`); await localforage.removeItem(`eventcam_slot_original_asset_${slotId}`); await localforage.removeItem(`eventcam_slot_removal_method_${slotId}`);
      const newSlots=[...(settings.slots||DEFAULT_SLOTS)]; newSlots[slotId]={...DEFAULT_SLOTS[slotId]};
      setSettings(s=>({...s,slots:newSlots})); if (activeSlotId===slotId) setActiveSlotId(null);
    } catch (err) { console.error(err); } finally { setIsProcessing(false); setShowClearConfirm(false); setSlotToClear(null); }
  };

  const removeLogo = () => {
    cleanupLogoUrl(); watermarkImgRef.current=null; setLogoReady(false); setOriginalFile(null);
    localforage.removeItem('eventcam_watermark_blob_v2'); localforage.removeItem('eventcam_watermark_original_blob_v2'); localforage.removeItem('eventcam_removal_method');
    setRemovalMethod('ai'); setSettings(s=>({...s,watermark:{...s.watermark,assetUrl:null}})); setSelectedElement(null);
  };

  const resetAll = () => {
    cleanupLogoUrl(); watermarkImgRef.current=null; setLogoReady(false); setOriginalFile(null);
    localforage.removeItem('eventcam_watermark_blob_v2'); localforage.removeItem('eventcam_watermark_original_blob_v2'); localforage.removeItem('eventcam_removal_method'); setRemovalMethod('ai');
    for (let i=0;i<3;i++) { localforage.removeItem(`eventcam_slot_asset_${i}`); localforage.removeItem(`eventcam_slot_original_asset_${i}`); localforage.removeItem(`eventcam_slot_removal_method_${i}`); }
    setSettings(INITIAL_SETTINGS); setPreviewBgId('midnight'); setActiveSlotId(null); setSelectedElement(null); setActiveSelection(null); setShowResetConfirm(false);
  };


  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  if (isShareView && !shareId) {
    return (
      <div className="h-screen w-screen bg-[#0C0D0E] flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto"><AlertCircle size={24} className="text-zinc-500" /></div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white uppercase tracking-widest">Shared content unavailable</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">The request link is malformed or has expired.</p>
          </div>
          <button onClick={()=>window.location.href=getProductionUrl()} className="px-6 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl">Go to App</button>
        </div>
      </div>
    );
  }

  // ── White-Label Splash Screen ─────────────────────────────────────────────
  if (showSplash && customerBranding) {
    return (
      <div className="h-screen w-screen bg-[#0C0D0E] flex flex-col items-center justify-center font-sans overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-25 transition-all" style={{ backgroundColor: customerBranding.brandColor }} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center gap-10 px-8 text-center"
        >
          {/* Customer logo — big, centered, no overlap */}
          {customerBranding.brandLogoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-52 h-52 flex items-center justify-center drop-shadow-2xl"
            >
              <img src={customerBranding.brandLogoUrl} alt={customerBranding.brandName} className="max-w-full max-h-full object-contain" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
            </motion.div>
          )}

          {/* Customer name */}
          {customerBranding.brandName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl font-black uppercase tracking-widest leading-none"
              style={{ color: customerBranding.brandColor }}
            >
              {customerBranding.brandName}
            </motion.div>
          )}

          {/* Clear visual separator — never overlapping */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="w-20 h-[2px] bg-zinc-700 rounded-full"
          />

          {/* Riddim Room attribution — always present, always clear */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Powered by</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-[#FFD100] uppercase tracking-tight">Riddim</span>
              <span className="text-2xl font-black text-[#009B3A] uppercase tracking-tight ml-1.5">Room</span>
              <span className="text-sm font-black text-[#D21034] uppercase ml-1">.com</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Loading bar — bottom, full width */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3.2, ease: 'linear' }}
            className="h-full rounded-r-full"
            style={{ backgroundColor: customerBranding.brandColor }}
          />
        </div>
      </div>
    );
  }

  // ── Loading / Config Gate ─────────────────────────────────────────────────
  if (authLoading || !isConfigLoaded) {
    return (
      <div className="h-screen w-screen bg-[#0C0D0E] flex flex-col items-center justify-center font-sans overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-[#FFD100] animate-spin" />
          <div className="text-center">
            <span className="text-[10px] font-black text-[#FFD100] tracking-[0.2em] uppercase block animate-pulse">Riddim Room EventCam</span>
            <span className="text-[8px] font-black text-zinc-500 tracking-widest uppercase mt-1 block">Initializing Experience...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth / Login Wall ─────────────────────────────────────────────────────
  if (!user && !isShareView) {
    return (
      <div className="h-screen w-screen bg-[#0C0D0E] flex flex-col items-center justify-center font-sans overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] rounded-full bg-[#009B3A]/60 blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full bg-[#FFD100]/60 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 w-full max-w-sm p-6 text-center space-y-6 flex flex-col items-center">
          <div className="w-16 h-16 relative rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center p-1 shadow-2xl">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="100" height="100" rx="20" fill="#0C0D0E" />
              <rect x="2" y="2" width="96" height="96" rx="18" stroke="url(#iconBorderGradientAuth)" strokeWidth="2.5" />
              <g opacity="0.85"><path d="M10 20 L50 20 L50 65 L10 65 Z" fill="#009B3A" /><path d="M10 20 L50 42.5 L10 65 Z" fill="#FFD100" stroke="#FFFFFF" strokeWidth="1" /><path d="M10 20 L30 42.5 L10 65 Z" fill="#D21034" stroke="#000000" strokeWidth="1" /></g>
              <path d="M30 30 L40 22 H60 L70 30 H85 V78 H15 V30 H30 Z" fill="#141517" stroke="#334155" strokeWidth="1.5" />
              <circle cx="75" cy="40" r="3" fill="#D21034" />
              <circle cx="50" cy="54" r="22" fill="#1A1C1E" stroke="#475569" strokeWidth="2" />
              <circle cx="50" cy="54" r="16" fill="url(#lensReflectionAuth)" stroke="#FFD100" strokeWidth="1" />
              <circle cx="50" cy="54" r="10" fill="#090A0B" />
              <defs>
                <linearGradient id="iconBorderGradientAuth" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#009B3A" /><stop offset="50%" stopColor="#FFD100" /><stop offset="100%" stopColor="#D21034" /></linearGradient>
                <radialGradient id="lensReflectionAuth" cx="50%" cy="50%" r="50%" fx="30%" fy="30%"><stop offset="0%" stopColor="#D21034" stopOpacity="0.4" /><stop offset="50%" stopColor="#FFD100" stopOpacity="0.3" /><stop offset="100%" stopColor="#009B3A" stopOpacity="0.5" /></radialGradient>
              </defs>
            </svg>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <span className="text-xl font-black text-[#FFD100] tracking-tighter uppercase font-sans">Riddim</span>
              <span className="text-xl font-black text-[#009B3A] tracking-tighter uppercase font-sans ml-1">Room</span>
              <span className="text-xs font-black text-[#D21034] uppercase ml-0.5">.com</span>
            </div>
            <h1 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.25em]">Private Production access</h1>
          </div>
          <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-6 space-y-4">
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
              {(['login','register','forgot'] as const).filter(m=>authMode==='forgot'?m==='forgot':m!=='forgot').map(mode=>(
                <button key={mode} onClick={()=>{setAuthMode(mode);setAuthError(null);setAuthSuccess(null);}} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authMode===mode?'bg-white text-black shadow-lg':'text-zinc-500 hover:text-white'}`}>{mode}</button>
              ))}
              {authMode==='forgot'&&(<button onClick={()=>{setAuthMode('login');setAuthError(null);setAuthSuccess(null);}} className="flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Back</button>)}
            </div>
            <form onSubmit={authMode==='login'?handleEmailLogin:authMode==='register'?handleEmailRegister:handleResetPassword} className="space-y-3">
              {authMode==='register'&&(<div className="space-y-1.5 text-left"><label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label><input type="text" required value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-[10px] font-bold focus:border-[#FFD100] outline-none" placeholder="Enter your name" /></div>)}
              <div className="space-y-1.5 text-left"><label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-[10px] font-bold focus:border-[#FFD100] outline-none" placeholder="name@company.com" /></div>
              {authMode!=='forgot'&&(<div className="space-y-1.5 text-left"><div className="flex justify-between items-center"><label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Password</label>{authMode==='login'&&(<button type="button" onClick={()=>setAuthMode('forgot')} className="text-[8px] font-bold text-[#FFD100] uppercase hover:underline">Forgot?</button>)}</div><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-[10px] font-bold focus:border-[#FFD100] outline-none" placeholder="••••••••" /></div>)}
              {authError&&(<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-bold text-red-400 flex items-center gap-2"><div className="shrink-0"><AlertCircle size={10} /></div>{authError}</div>)}
              {authSuccess&&(<div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-bold text-emerald-400 flex items-center gap-2"><div className="shrink-0"><Check size={10} /></div>{authSuccess}</div>)}
              <button type="submit" disabled={authProcessing} className="w-full py-4 bg-white hover:bg-zinc-100 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                {authProcessing?<Loader2 size={14} className="animate-spin" />:(authMode==='login'?'Sign In Access':authMode==='register'?'Request Account':'Reset Password')}
              </button>
            </form>
            {authMode==='login'&&(
              <div className="space-y-3 mt-4">
                <div className="relative flex items-center py-2"><div className="flex-grow border-t border-zinc-800"></div><span className="flex-shrink mx-4 text-[7px] font-black text-zinc-700 uppercase tracking-widest">or continue with</span><div className="flex-grow border-t border-zinc-800"></div></div>
                <button onClick={handleGoogleSignIn} disabled={authProcessing} type="button" className="w-full py-3.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95">
                  <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.81-2.61-.81-3.04 0-5.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google Sign-In
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[7px] font-black text-zinc-600 tracking-widest uppercase block mt-2">Private Secure Production Server</span>
            <span className="text-[6px] font-bold text-zinc-700 uppercase tracking-widest block leading-tight px-4">Access is strictly limited to authorized event staff and approved creators. Accounts require manual verification.</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Approval Gate ─────────────────────────────────────────────────────────
  const userStatus = userProfile ? (userProfile.status || 'PENDING') : 'UNKNOWN';
  if (user && userStatus !== 'APPROVED' && !userIsAdmin && !isShareView) {
    const isDenied=userStatus==='DENIED'; const isSuspended=userStatus==='SUSPENDED';
    return (
      <div className="h-screen w-screen bg-[#0C0D0E] flex flex-col items-center justify-center font-sans overflow-hidden relative">
        <div className="relative z-10 w-full max-w-sm p-8 text-center space-y-8 flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl relative ${isDenied||isSuspended?'bg-red-500/10':'bg-[#FFD100]/10'}`}>
            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isDenied||isSuspended?'bg-red-500':'bg-[#FFD100]'}`} />
            {isDenied||isSuspended?<Lock size={24} className="text-red-500" />:<Loader2 size={24} className="text-[#FFD100] animate-spin" />}
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white uppercase tracking-widest">{isDenied?"Access Denied":isSuspended?"Account Suspended":"Awaiting Approval"}</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">{isDenied?"Your registration request has been reviewed and declined.":isSuspended?"This account has been temporarily disabled by an administrator.":"Welcome! Your account is currently pending administrator review."}</p>
          </div>
          {!isDenied&&!isSuspended&&(<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left space-y-3"><div className="flex items-center gap-2"><ShieldCheck size={12} className="text-[#FFD100]" /><span className="text-[9px] font-black text-white uppercase tracking-wider">Verification Phase</span></div><p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">An administrator has been notified. You will automatically be granted access once your identity is confirmed. This process usually takes less than 24 hours.</p></div>)}
          <div className="w-full pt-4 space-y-3">
            <button onClick={()=>{setAuthLoading(true);auth.currentUser?.reload().then(()=>window.location.reload());}} className="w-full py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl"><RefreshCw size={12} /> Refresh Access Status</button>
            <button onClick={handleSignOut} className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-zinc-800 flex items-center justify-center gap-2 transition-colors"><LogOut size={12} /> Sign Out of Account</button>
            <p className="text-[7px] font-black text-zinc-650 uppercase tracking-widest">Logged in as: {user.email}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="h-screen w-screen bg-[#0C0D0E] flex flex-col items-center justify-center font-sans overflow-hidden relative">
        <div className="relative z-10 w-full max-w-sm p-8 text-center space-y-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-500/20 flex items-center justify-center text-red-500 shadow-2xl"><Lock size={24} /></div>
          <div className="space-y-2"><h1 className="text-xl font-black text-white uppercase tracking-widest leading-none">GLOBAL ACCESS DISABLED</h1><p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Temporary access has been disabled by the administrator</p></div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-xs">Global access to this EventCam session has been disabled. To request access, contact the event administrator.</p>
          <div className="flex flex-col gap-3 w-full max-w-xs pt-2">
            <a href="mailto:Ramjitinvestments@gmail.com" className="py-4 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-zinc-800 flex items-center justify-center transition-colors">Contact Owner</a>
            <button onClick={handleSignOut} className="py-4 px-6 bg-red-950/30 hover:bg-red-900/40 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-red-500/20 flex items-center justify-center gap-1.5 transition-colors"><LogOut size={12} />Switch Google Account</button>
          </div>
          <span className="text-[8px] font-black text-zinc-650 tracking-widest uppercase block">Support: Ramjitinvestments@gmail.com</span>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen w-screen bg-black flex flex-col font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 relative">
        {appState === 'setup' ? (
          <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
            <div className="absolute inset-x-0 top-0 bottom-[320px] z-0 flex flex-col items-center justify-center p-8">
              <div className="mb-4 pointer-events-none">
                <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="px-4 py-2 bg-[#FFD100]/5 backdrop-blur-xl rounded-full border border-[#FFD100]/20 text-[9px] font-black text-[#FFD100] uppercase tracking-[0.2em] shadow-2xl">
                  Drag to Position • Exact Preview Mode
                </motion.div>
              </div>
              <div className="relative shadow-[0_0_80px_rgba(0,155,58,0.15)] bg-black overflow-hidden ring-2 ring-[#009B3A]/85 shrink min-h-0" style={{maxHeight:'100%',maxWidth:'100%',aspectRatio:settings.aspectRatio.replace(':','/')}}>
                <div className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-1 bg-[#009B3A] rounded-full shadow-lg pointer-events-none border border-[#009B3A]/50">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Live Viewport</span>
                </div>
                <canvas ref={previewCanvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className="h-full w-full object-contain touch-none relative z-10" />
                <AnimatePresence>
                  {isProcessing&&(
                    <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}} className="absolute bottom-4 right-4 z-[60] bg-black/80 backdrop-blur-2xl px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl pointer-events-none">
                      <Loader2 size={16} className="text-[#FFD100] animate-spin" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Removing Background</span>
                        <div className="w-24 h-1 bg-white/10 rounded-full mt-1 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-[#009B3A] via-[#FFD100] to-[#FF5E00]" initial={{width:0}} animate={{width:`${processingProgress}%`}} /></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Floating Controls */}
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6">
              {/* Top Bar */}
              <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 relative rounded-xl overflow-hidden bg-black/45 border border-zinc-800 flex items-center justify-center p-0.5">
                    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <rect width="100" height="100" rx="20" fill="#0C0D0E" /><rect x="2" y="2" width="96" height="96" rx="18" stroke="url(#iconBorderGradient)" strokeWidth="2.5" />
                      <g opacity="0.85"><path d="M10 20 L50 20 L50 65 L10 65 Z" fill="#009B3A" /><path d="M10 20 L50 42.5 L10 65 Z" fill="#FFD100" stroke="#FFFFFF" strokeWidth="1" /><path d="M10 20 L30 42.5 L10 65 Z" fill="#D21034" stroke="#000000" strokeWidth="1" /></g>
                      <path d="M30 30 L40 22 H60 L70 30 H85 V78 H15 V30 H30 Z" fill="#141517" stroke="#334155" strokeWidth="1.5" />
                      <circle cx="75" cy="40" r="3" fill="#D21034" /><circle cx="75" cy="40" r="5" stroke="#D21034" strokeWidth="0.5" />
                      <circle cx="50" cy="54" r="22" fill="#1A1C1E" stroke="#475569" strokeWidth="2" />
                      <circle cx="50" cy="54" r="16" fill="url(#lensReflection)" stroke="#FFD100" strokeWidth="1" />
                      <circle cx="50" cy="54" r="10" fill="#090A0B" /><circle cx="47" cy="51" r="3" fill="#FFFFFF" opacity="0.6" />
                      <defs>
                        <linearGradient id="iconBorderGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#009B3A" /><stop offset="50%" stopColor="#FFD100" /><stop offset="100%" stopColor="#D21034" /></linearGradient>
                        <radialGradient id="lensReflection" cx="50%" cy="50%" r="50%" fx="30%" fy="30%"><stop offset="0%" stopColor="#D21034" stopOpacity="0.4" /><stop offset="50%" stopColor="#FFD100" stopOpacity="0.3" /><stop offset="100%" stopColor="#009B3A" stopOpacity="0.5" /></radialGradient>
                      </defs>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-baseline leading-none">
                      <span className="text-xs font-black text-[#FFD100] tracking-tighter uppercase font-sans leading-none">Riddim</span>
                      <span className="text-xs font-black text-[#009B3A] tracking-tighter uppercase font-sans ml-0.5 leading-none">Room</span>
                      <span className="text-[7px] font-black text-[#D21034] uppercase ml-0.5 leading-none">.com</span>
                    </div>
                    <span className="text-[7px] font-black text-zinc-400 tracking-widest uppercase block mt-1">EVENT CAM setup</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col items-end mr-1 text-right leading-none">
                    <span className="text-[9px] font-black text-white truncate max-w-[120px] uppercase leading-none">{user?.displayName||'EventCam User'}</span>
                    <span className="text-[7px] font-bold text-zinc-500 truncate max-w-[120px] leading-tight mt-0.5">{user?.email}</span>
                  </div>
                  {userIsAdmin&&(
                    <>
                      <button onClick={()=>{setShowAdminPanel(true);loadAllUsersMetrics();}} className="h-10 px-3.5 bg-zinc-900/80 hover:bg-zinc-800 border border-[#FFD100]/30 hover:border-[#FFD100]/60 rounded-full flex items-center gap-1.5 text-[#FFD100] transition-all shadow-xl text-[10px] font-black uppercase tracking-wider relative" title="Admin Panel">
                        <ShieldCheck size={14} /><span className="hidden xs:inline">System Admin</span>
                        {pendingCount>0&&(<span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] items-center justify-center text-white border border-zinc-900">{pendingCount}</span></span>)}
                      </button>
                      <button onClick={()=>copyToClipboard(getProductionUrl('?mode=camera'))} className="h-10 px-3.5 bg-zinc-900/80 hover:bg-zinc-800 border border-[#009B3A]/30 hover:border-[#009B3A]/60 rounded-full flex items-center gap-1.5 text-[#009B3A] transition-all shadow-xl text-[10px] font-black uppercase tracking-wider" title="Copy Camera Link">
                        <Share2 size={14} /><span className="hidden xs:inline">Copy Camera Link</span>
                      </button>
                    </>
                  )}
                  {user&&(<button onClick={()=>setShowResetConfirm(true)} className="h-10 px-5 bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-xl text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 group" title="Reset Layout"><RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-700" /><span className="hidden sm:inline">Reset Layout</span></button>)}
                  <button onClick={handleSignOut} className="w-10 h-10 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all shadow-xl hover:bg-zinc-800" title="Sign Out"><LogOut size={16} /></button>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="flex flex-col gap-4 pointer-events-auto max-w-xl mx-auto w-full">
                <AnimatePresence mode="wait">
                  {selectedElement ? (
                    <motion.div key={selectedElement} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}} className="bg-black/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#FFD100] uppercase tracking-widest">Editing {selectedElement}</span>
                        <button onClick={()=>setSelectedElement(null)} className="p-2 bg-zinc-800 rounded-full text-white"><X size={14} /></button>
                      </div>
                      {selectedElement==='logo'&&(
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3"><div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest"><span>Scale</span><span className="text-[#FFD100]">{settings.watermark.size}%</span></div><input type="range" min={5} max={85} value={settings.watermark.size} onChange={e=>setSettings(s=>({...s,watermark:{...s.watermark,size:parseInt(e.target.value)}}))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer" /></div>
                            <div className="space-y-3"><div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest"><span>Alpha</span><span className="text-[#FFD100]">{Math.round(settings.watermark.opacity*100)}%</span></div><input type="range" min={0.1} max={1.0} step={0.01} value={settings.watermark.opacity} onChange={e=>setSettings(s=>({...s,watermark:{...s.watermark,opacity:parseFloat(e.target.value)}}))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer" /></div>
                          </div>
                          <div className="space-y-3">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Background Removal Filter</span>
                            <div className="grid grid-cols-2 gap-2 bg-zinc-950/80 p-1 rounded-2xl border border-white/5">
                              {(['none','ai'] as const).map(method=>(
                                <button key={method} onClick={()=>setRemovalMethod(method)} className={`py-2 px-1 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 border ${removalMethod===method?'bg-[#009B3A] border-[#009B3A]/50 text-white shadow-md shadow-[#009B3A]/30':'bg-zinc-900/40 border-transparent text-zinc-400 hover:text-white hover:border-white/5'}`}>
                                  {method==='none'&&(<><span>Raw Image</span><span className={`text-[6px] font-medium lowercase ${removalMethod===method?'text-emerald-100':'text-zinc-500'}`}>no filter</span></>)}
                                  {method==='ai'&&(<><span>Remove Background</span><span className={`text-[6px] font-medium lowercase ${removalMethod===method?'text-emerald-100':'text-zinc-500'}`}>smart cutout</span></>)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={centerLogo} className="py-3 bg-zinc-800 text-[9px] font-black text-white rounded-xl flex items-center justify-center gap-1.5 border border-white/5 hover:bg-zinc-700 transition-all active:scale-95"><Maximize2 size={12} /> CENTER</button>
                            <div className="relative"><input type="file" accept="image/*" onChange={handleAssetUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><button className="w-full py-3 bg-[#FFD100] hover:bg-[#FFD100]/90 text-black text-[9px] font-black rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95"><Upload size={12} /> REPLACE</button></div>
                            <button onClick={removeLogo} className="py-3 bg-red-600/10 text-red-400 hover:bg-red-600/20 text-[9px] font-black rounded-xl flex items-center justify-center gap-1.5 border border-red-500/20 transition-all active:scale-95"><Trash2 size={12} /> REMOVE</button>
                          </div>
                        </div>
                      )}
                      {selectedElement==='text'&&(
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <textarea value={settings.textOverlay.text} onChange={e=>{const newText=e.target.value;setSettings(s=>{const textWasEmpty=!s.textOverlay.text.trim();const textHasContent=!!newText.trim();let updatedOverlay={...s.textOverlay,text:newText};if(textWasEmpty&&textHasContent){const coords=getCenteredCoordinates(newText,s);if(coords){updatedOverlay.x=coords.x;updatedOverlay.y=coords.y;}}return{...s,textOverlay:updatedOverlay};});}} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-xs focus:border-[#FFD100] outline-none placeholder:text-zinc-600 min-h-[90px] resize-none transition-all" style={{fontFamily:settings.textOverlay.fontFamily||'"Space Grotesk", sans-serif',fontWeight:settings.textOverlay.fontWeight||'bold',fontStyle:settings.textOverlay.fontStyle||'normal',color:settings.textOverlay.color||'#ffffff'}} placeholder="ENTER CAPTION TEXT" autoFocus />
                            <div className="flex justify-between items-center text-[8px] pl-1 text-zinc-500 uppercase tracking-widest"><span>Press Enter for a new line</span><span>{settings.textOverlay.text.length} chars</span></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3"><div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest"><span>Font Size</span><span className="text-[#FFD100]">{settings.textOverlay.fontSize}px</span></div><input type="range" min={12} max={180} value={settings.textOverlay.fontSize} onChange={e=>setSettings(s=>({...s,textOverlay:{...s.textOverlay,fontSize:parseInt(e.target.value)}}))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer" /></div>
                            <div className="space-y-3"><div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest"><span>Opacity</span><span className="text-[#FFD100]">{Math.round(settings.textOverlay.opacity*100)}%</span></div><input type="range" min={0.1} max={1.0} step={0.01} value={settings.textOverlay.opacity} onChange={e=>setSettings(s=>({...s,textOverlay:{...s.textOverlay,opacity:parseFloat(e.target.value)}}))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3"><div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest"><span>Font Weight</span><span className="text-[#FFD100] uppercase">{settings.textOverlay.fontWeight||'bold'}</span></div><div className="flex rounded-xl bg-zinc-900 p-0.5 border border-white/5">{(['normal','bold']as const).map(w=>(<button key={w} type="button" onClick={()=>setSettings(s=>({...s,textOverlay:{...s.textOverlay,fontWeight:w}}))} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${(settings.textOverlay.fontWeight||'bold')===w?'bg-[#009B3A] text-white shadow':'text-zinc-400 hover:text-white'}`}>{w==='normal'?'Normal':'Bold'}</button>))}</div></div>
                            <div className="space-y-3"><div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest"><span>Font Style</span><span className="text-[#FFD100] uppercase">{settings.textOverlay.fontStyle||'normal'}</span></div><div className="flex rounded-xl bg-zinc-900 p-0.5 border border-white/5">{(['normal','italic']as const).map(st=>(<button key={st} type="button" onClick={()=>setSettings(s=>({...s,textOverlay:{...s.textOverlay,fontStyle:st}}))} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${(settings.textOverlay.fontStyle||'normal')===st?'bg-[#009B3A] text-white shadow':'text-zinc-400 hover:text-white'}`}>{st==='normal'?'Upright':'Italic'}</button>))}</div></div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest"><span>Font Family</span><span className="text-[#FFD100]">{FONTS.find(f=>f.value===settings.textOverlay.fontFamily)?.name||'Space Grotesk'}</span></div>
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
                              {FONTS.map(font=>(<button key={font.name} onClick={()=>{setSettings(s=>({...s,textOverlay:{...s.textOverlay,fontFamily:font.value}}));setTimeout(centerText,50);}} style={{fontFamily:font.value}} className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap snap-center border transition-all ${(settings.textOverlay.fontFamily===font.value||(!settings.textOverlay.fontFamily&&font.name==='Space Grotesk'))?'bg-[#009B3A] border-[#009B3A] text-white font-bold scale-105 shadow-md shadow-[#009B3A]/30':'bg-zinc-900 border-white/5 text-zinc-300 hover:border-white/10'}`}>{font.name}</button>))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={centerText} className="flex-1 py-3 bg-zinc-800 text-[9px] font-black text-white rounded-xl flex items-center justify-center gap-2 border border-white/5"><Maximize2 size={12} /> CENTER TEXT</button>
                            <div className="flex-[2] flex gap-1">
                              {['#ffffff','#FFD100','#009B3A','#D21034','#FFE033','#0C0D0E'].map(color=>(<button key={color} onClick={()=>setSettings(s=>({...s,textOverlay:{...s.textOverlay,color}}))} className={`flex-1 h-8 rounded-lg border transition-all shadow-lg ${settings.textOverlay.color===color?'border-white scale-110':'border-transparent'}`} style={{backgroundColor:color}} />))}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-4">
                      {/* Branding Presets Row */}
                      <div className="grid grid-cols-3 gap-3 bg-black/60 backdrop-blur-xl p-3.5 rounded-3xl border border-white/5">
                        {settings.slots.map((slot,idx)=>{
                          const hasText=slot.textOverlay&&slot.textOverlay.text; const hasLogo=slot.watermark&&slot.watermark.hasAsset;
                          let desc='EMPTY'; if (!slot.isEmpty) { if (hasText&&hasLogo) desc='TEXT + LOGO'; else if (hasText) desc='TEXT ONLY'; else if (hasLogo) desc='LOGO ONLY'; else desc='SAVED'; }
                          return (
                            <div key={idx} className="relative group">
                              <button onClick={()=>slot.isEmpty?saveSlot(idx):loadSlot(idx)} className={`w-full py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all border ${activeSlotId===idx?'bg-gradient-to-b from-[#009B3A] to-[#007b2d] border-[#009B3A]/50 text-white shadow-xl shadow-[#009B3A]/20 scale-[1.02]':slot.isEmpty?'bg-zinc-950/40 border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10':'bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-zinc-850'}`}>
                                {slot.isEmpty?<Save size={12} className="opacity-60" />:<Library size={12} className={activeSlotId===idx?'text-white':'text-[#FFD100]'} />}
                                <div className="text-[8px] font-black uppercase tracking-widest leading-none">{slot.isEmpty?`Slot ${idx+1}`:`Preset ${idx+1}`}</div>
                                <div className={`text-[6px] font-black uppercase tracking-wider leading-none ${activeSlotId===idx?'text-emerald-250':'text-zinc-500'}`}>{desc}</div>
                              </button>
                              {!slot.isEmpty&&(<button onClick={(e)=>{e.stopPropagation();setSlotToClear(idx);setShowClearConfirm(true);}} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 border border-black/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer hover:bg-red-500 hover:scale-105 active:scale-95" title="Erase Slot"><X size={10} strokeWidth={3} /></button>)}
                            </div>
                          );
                        })}
                      </div>
                      {/* Main Action Bar */}
                      <div className="flex gap-3">
                        <div className="flex-[1.5] relative"><input type="file" accept="image/*" onChange={handleAssetUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><button className="w-full py-5 bg-white text-black rounded-3xl flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all"><ImageIcon size={18} strokeWidth={2.5} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Upload Logo</span></button></div>
                        <button onClick={()=>{if(!settings.textOverlay.text){const newText='NEW CAPTION';setSettings(s=>{const coords=getCenteredCoordinates(newText,s);return{...s,textOverlay:{...s.textOverlay,text:newText,x:coords?coords.x:50,y:coords?coords.y:50}};});}setSelectedElement('text');}} className={`flex-1 py-5 rounded-3xl flex items-center justify-center gap-2 border transition-all ${settings.textOverlay.text?'bg-zinc-800 text-white border-zinc-700':'bg-transparent text-white border-white/20'}`}><Type size={18} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">{settings.textOverlay.text?'Edit Text':'Add Text'}</span></button>
                      </div>
                      {/* Format Toggle */}
                      <div className="flex justify-center">
                        <div className="bg-black/60 backdrop-blur-xl p-1 rounded-2xl border border-white/5 flex gap-1 w-full max-w-[200px]">
                          {(['9:16','16:9'] as const).map(ratio=>(<button key={ratio} onClick={()=>setSettings(s=>({...s,aspectRatio:ratio}))} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black tracking-[0.1em] transition-all ${settings.aspectRatio===ratio?'bg-white text-black':'text-zinc-500 hover:text-white'}`}>{ratio}</button>))}
                        </div>
                      </div>
                      {/* Launch */}
                      <button onClick={handleLaunch} className="w-full py-7 bg-gradient-to-r from-[#009B3A] via-[#FFD100] to-[#FF5E00] hover:brightness-110 text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-[32px] shadow-[0_20px_60px_rgba(255,208,0,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group">
                        LAUNCH LIVE CAM<Camera size={20} className="group-hover:rotate-12 transition-transform" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          /* ── Camera View ─────────────────────────────────────────────── */
          <div className="flex-1 flex flex-col relative bg-black overflow-hidden select-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="absolute pointer-events-none opacity-0 w-[1px] h-[1px]" muted />
              <div className="relative bg-black overflow-hidden shrink min-h-0" style={{maxHeight:'100%',maxWidth:'100%',aspectRatio:settings.aspectRatio.replace(':','/')}}>
                <canvas ref={previewCanvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className={`h-full w-full object-contain touch-none relative z-10 transition-opacity duration-1000 ${cameraReady?'opacity-100':'opacity-0'}`} />
              </div>
              {cameraError&&(
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-3xl p-6 text-center select-text">
                  <div className="max-w-md w-full space-y-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center animate-pulse"><AlertCircle size={28} className="text-red-500" /></div>
                    <div className="space-y-2"><h3 className="text-xl font-black text-white uppercase tracking-wider">Camera Connection Blocked</h3><p className="text-xs text-zinc-400 leading-relaxed font-medium">{cameraError}</p><p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-normal">This is common in builder environments due to sandbox iframe privacy constraints. Please use the standalone testing link to capture natively!</p></div>
                    <div className="w-full flex flex-col gap-3 pt-2">
                      <button onClick={()=>{setIsSimulatedCamera(true);setCameraError(null);setCameraReady(true);}} className="w-full py-4 bg-[#FFD100] hover:bg-[#FFD100]/90 text-black text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all outline-none active:scale-95 shadow-[0_4px_20px_rgba(255,209,0,0.15)] pointer-events-auto border border-black/10"><Video size={13} className="text-black" /> Run Real-Time Camera Simulator</button>
                      <div className="grid grid-cols-2 gap-2 w-full pointer-events-auto">
                        <button onClick={()=>{setIsSimulatedCamera(false);startCamera();}} className="py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none border border-white/5 active:scale-95"><RefreshCw size={12} /> Retry Capture</button>
                        <button onClick={()=>setFacingMode(prev=>prev==='user'?'environment':'user')} className="py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none border border-white/5 active:scale-95">Switch Camera</button>
                      </div>
                    </div>
                    {(!isKioskMode||userIsAdmin)&&(<button onClick={handleBackToSetup} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest pt-2 underline underline-offset-4 pointer-events-auto">Back to Editor</button>)}
                  </div>
                </div>
              )}
            </div>
            {/* Top HUD */}
            <div className="absolute inset-x-0 top-0 z-50 p-6 flex items-center justify-between pointer-events-none">
              {(!isKioskMode||userIsAdmin)?(<button onClick={handleBackToSetup} className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white pointer-events-auto shadow-2xl active:scale-90 transition-all hover:bg-black/60"><X size={20} /></button>):(<div className="w-12 h-12" />)}
              <div className="flex items-center gap-2 pointer-events-auto">
                {(!isKioskMode||userIsAdmin)&&(<button onClick={resetOverlays} className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all"><RotateCcw size={18} /></button>)}
                <div className="flex bg-black/40 backdrop-blur-xl rounded-full p-1 border border-white/10">
                  {(['photo','video'] as const).map(mode=>(<button key={mode} onClick={()=>setCaptureMode(mode)} className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${captureMode===mode?'bg-white text-black':'text-zinc-500 hover:text-white'}`}>{mode}</button>))}
                </div>
              </div>
            </div>
            {/* Bottom Controls */}
            <div className="absolute inset-x-0 bottom-0 z-50 p-10 flex flex-col items-center gap-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
              {isRecording&&(<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-2xl"><div className="w-2 h-2 bg-white rounded-full animate-pulse" />REC {formatTime(recordingTime)}</motion.div>)}
              <div className="w-full max-w-xl flex items-center justify-around gap-6 pointer-events-auto">
                <button onClick={()=>setFacingMode(f=>f==='user'?'environment':'user')} className="w-14 h-14 bg-zinc-900/60 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl active:scale-90 transition-all"><RefreshCw size={22} strokeWidth={2.5} /></button>
                <div className="relative flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full blur-2xl transition-all ${isRecording?'bg-red-600/40':'bg-white/20'}`} />
                  <button onClick={capture} className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all bg-white shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-90 ring-4 ring-white/10 group">
                    <div className={`transition-all duration-300 ${isRecording?'w-10 h-10 bg-red-600 rounded-lg':`w-[76px] h-[76px] rounded-full border-[3px] border-black/5 flex items-center justify-center ${captureMode==='video'?'bg-red-500':'bg-[#FFD100]'}`}`}>
                      {!isRecording&&(<span className={`text-[10px] font-black italic tracking-tighter ${captureMode==='video'?'text-white':'text-black'}`}>GO</span>)}
                    </div>
                  </button>
                </div>
                {(!isKioskMode||userIsAdmin)?(<button onClick={()=>setAppState('setup')} className="w-14 h-14 bg-zinc-900/60 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl active:scale-90 transition-all"><SettingsIcon size={22} strokeWidth={2.5} /></button>):(<div className="w-14 h-14" />)}
              </div>
            </div>
            <AnimatePresence>{isFlashing&&(<motion.div initial={{opacity:1}} animate={{opacity:0}} transition={{duration:0.3}} className="absolute inset-0 z-[100] bg-white pointer-events-none" />)}</AnimatePresence>
          </div>
        )}
      </div>


      {/* ── Modals & Overlays ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showResetConfirm&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 text-center space-y-6 shadow-2xl">
              <div className="mx-auto w-16 h-16 bg-[#FFD100]/5 border border-[#FFD100]/20 rounded-full flex items-center justify-center"><RotateCcw size={24} className="text-[#FFD100]" /></div>
              <div className="space-y-2"><h3 className="text-xl font-black text-white uppercase tracking-widest">Start Fresh?</h3><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">This will clear your current branding configuration.</p></div>
              <div className="flex gap-3"><button onClick={()=>setShowResetConfirm(false)} className="flex-1 py-4 bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-colors">Cancel</button><button onClick={resetAll} className="flex-1 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Reset</button></div>
            </motion.div>
          </motion.div>
        )}
        {showClearConfirm&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 text-center space-y-6 shadow-2xl">
              <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center"><Trash2 size={24} className="text-red-500" /></div>
              <div className="space-y-2"><h3 className="text-xl font-black text-white uppercase tracking-widest">Delete Preset?</h3><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">Are you sure you want to erase this saved setup?</p></div>
              <div className="flex gap-3"><button onClick={()=>{setShowClearConfirm(false);setSlotToClear(null);}} className="flex-1 py-4 bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-colors">Cancel</button><button onClick={()=>slotToClear!==null&&clearSlot(slotToClear)} className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Delete</button></div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Admin Panel ─────────────────────────────────────────────── */}
        {showAdminPanel&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{scale:0.95,opacity:0,y:15}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.95,opacity:0,y:15}} className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFD100]/10 border border-[#FFD100]/30 flex items-center justify-center text-[#FFD100]"><ShieldCheck size={20} /></div>
                  <div><h2 className="text-base font-black text-white uppercase tracking-widest">System Administration</h2><p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Manage access, branding, and viewer metrics</p></div>
                </div>
                <button onClick={()=>setShowAdminPanel(false)} className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-5 space-y-6">
                    <div className="bg-zinc-950/60 border border-zinc-850 rounded-[24px] p-5 space-y-5">
                      <div className="flex items-center justify-between"><span className="text-[10px] font-black text-[#FFD100] uppercase tracking-widest">Access Controls</span><span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">Active Policy</span></div>
                      <div className="p-3 bg-zinc-900 border border-zinc-850/85 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5 max-w-[80%]"><span className="text-[9px] font-black text-white uppercase tracking-widest block">Global Access Switch</span><span className="text-[8px] text-zinc-500 block leading-tight">Instantly disable preview link access for non-administrators.</span></div>
                        <button type="button" onClick={()=>{if(!globalConfig)return;setGlobalConfig(prev=>prev?{...prev,disabled:!prev.disabled}:null);}} className={`w-12 h-6 md:w-14 md:h-7 rounded-full p-1 transition-all ${globalConfig?.disabled?'bg-red-900/60 border border-red-500/30':'bg-emerald-950 border border-emerald-500/30'}`}><div className={`w-4 h-4 md:w-5 md:h-5 rounded-full shadow-md transform transition-transform ${globalConfig?.disabled?'translate-x-6 bg-red-400':'translate-x-0 bg-emerald-400'}`} /></button>
                      </div>
                      <button onClick={()=>saveAdminSettings(!!globalConfig?.disabled)} disabled={configSaving} className="w-full py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl">{configSaving?(<><Loader2 size={12} className="animate-spin" />Overwriting Cloud State...</>):"Save Configuration"}</button>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-850 rounded-[24px] p-5 space-y-4">
                      <div className="flex items-center justify-between"><span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Share2 size={12} className="text-[#009B3A]" /> Production Share Links</span></div>
                      <div className="space-y-3">
                        <div className="p-3 bg-black border border-zinc-800 rounded-xl space-y-2"><div className="flex items-center justify-between"><span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Main Application Link</span><button onClick={()=>copyToClipboard(getProductionUrl())} className="text-[8px] font-black text-[#FFD100] hover:underline uppercase flex items-center gap-1"><Copy size={10} /> Copy</button></div><code className="text-[9px] font-mono text-zinc-300 break-all block py-1">{getProductionUrl()}</code></div>
                        <div className="p-3 bg-black border border-zinc-800 rounded-xl space-y-2"><div className="flex items-center justify-between"><span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Live Camera / Kiosk Mode</span><button onClick={()=>copyToClipboard(getProductionUrl('?mode=camera'))} className="text-[8px] font-black text-[#FFD100] hover:underline uppercase flex items-center gap-1"><Copy size={10} /> Copy</button></div><code className="text-[9px] font-mono text-zinc-300 break-all block py-1">{getProductionUrl('?mode=camera')}</code></div>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-7 space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-[20px] text-center space-y-1"><Users size={16} className="mx-auto text-[#FFD100] mb-1" /><div className="text-xl font-black text-white leading-none">{usersLoading?"...":allUsers.length}</div><div className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Total Registered</div></div>
                      <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-[20px] text-center space-y-1"><BarChart3 size={16} className="mx-auto text-[#009B3A] mb-1" /><div className="text-xl font-black text-white leading-none">{usersLoading?"...":allUsers.reduce((acc,u)=>acc+(u.openCount||0),0)}</div><div className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">App Starts</div></div>
                      <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-[20px] text-center space-y-1"><ShieldCheck size={16} className="mx-auto text-[#D21034] mb-1" /><div className="text-xl font-black text-white leading-none">{usersLoading?"...":allUsers.reduce((acc,u)=>acc+(u.captureCount||0),0)}</div><div className="text-[7px] font-black text-zinc-500 uppercase tracking-widest leading-none">Captured Items</div></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative"><input type="text" placeholder="SEARCH BY EMAIL OR NAME..." value={adminSearchQuery} onChange={e=>setAdminSearchQuery(e.target.value)} className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl px-4 py-3 text-white text-[9px] font-bold tracking-widest placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-[#FFD100]" /></div>
                      <button onClick={loadAllUsersMetrics} disabled={usersLoading} className="px-4 bg-zinc-800 hover:bg-zinc-750 text-white font-black text-[9px] uppercase tracking-widest rounded-xl border border-zinc-700/60 flex items-center gap-1.5"><RotateCcw size={10} className={usersLoading?"animate-spin":""} />Refresh</button>
                    </div>
                    <div className="bg-zinc-950/40 border border-zinc-850 rounded-[24px] overflow-hidden">
                      <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-850 flex items-center justify-between"><span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Active User Registry</span><span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Showing {filteredUsers.length} of {allUsers.length}</span></div>
                      <div className="divide-y divide-zinc-850 max-h-[30vh] overflow-y-auto custom-scrollbar">
                        {usersLoading?(<div className="p-8 text-center text-zinc-500 uppercase font-black text-[8px] tracking-widest animate-pulse flex flex-col items-center gap-2"><Loader2 size={16} className="text-[#FFD100] animate-spin" />Loading metric entries...</div>):filteredUsers.length===0?(<div className="p-8 text-center text-zinc-500 uppercase font-black text-[8px] tracking-widest">No matching users found.</div>):(
                          filteredUsers.map((item)=>{
                            const initials=(item.displayName||item.email||'U').substring(0,2).toUpperCase();
                            const isSelf=item.email===user?.email;
                            const lastActiveDiff=Date.now()-(item.lastActiveAt?.seconds?item.lastActiveAt.seconds*1000:new Date(item.lastActiveAt).getTime());
                            const isOnline=lastActiveDiff<1000*60*5;
                            const hasBranding=!!(item.brandName||item.brandLogoUrl);
                            return (
                              <div key={item.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-zinc-900/50 transition-colors gap-4 ${isSelf?'bg-[#FFD100]/5':''}`}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-extrabold text-[12px] shrink-0 relative">
                                    {initials}
                                    {isOnline&&(<span className="absolute bottom-[-2px] right-[-2px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 leading-none flex-wrap">
                                      <span className="text-[10px] font-black text-white uppercase truncate block">{item.displayName||'EventCam Guest'}</span>
                                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${item.status==='APPROVED'?'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30':item.status==='DENIED'||item.status==='SUSPENDED'?'bg-red-500/20 text-red-400 border border-red-500/30':'bg-[#FFD100]/20 text-[#FFD100] border border-[#FFD100]/30 animate-pulse'}`}>{item.status||'PENDING'}</span>
                                      {hasBranding&&(<span className="text-[7px] font-black px-1.5 py-0.5 rounded uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">Branded</span>)}
                                    </div>
                                    <span className="text-[8px] font-bold text-zinc-500 truncate block mt-1">{item.email}</span>
                                    {hasBranding&&item.brandName&&(<span className="text-[7px] font-bold text-purple-400 block mt-0.5">↳ {item.brandName}</span>)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                  <div className="hidden sm:block text-right space-y-1"><span className="text-[7px] font-black text-zinc-550 uppercase tracking-widest block leading-none">Last Activity</span><span className="text-[8px] font-black text-zinc-400 uppercase block leading-none">{formatUserTimestamp(item.lastActiveAt)}</span></div>
                                  <div className="flex items-center gap-1">
                                    {!isSelf&&(
                                      <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-zinc-800">
                                        {item.status!=='APPROVED'?(<button onClick={()=>handleUpdateUserStatus(item.id,'APPROVED')} className="p-2 h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center shadow-lg" title="Approve User"><Check size={14} strokeWidth={3} /></button>):(<button onClick={()=>handleUpdateUserStatus(item.id,'SUSPENDED')} className="p-2 h-8 w-8 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors flex items-center justify-center border border-red-500/20" title="Suspend User"><Ban size={14} /></button>)}
                                        {item.status==='PENDING'&&(<button onClick={()=>handleUpdateUserStatus(item.id,'DENIED')} className="p-2 h-8 w-8 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center shadow-lg" title="Deny User"><X size={14} strokeWidth={3} /></button>)}
                                        {item.status==='DENIED'&&(<button onClick={()=>handleUpdateUserStatus(item.id,'PENDING')} className="p-2 h-8 w-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors flex items-center justify-center" title="Reset to Pending"><RotateCcw size={12} /></button>)}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-zinc-800">
                                      <button onClick={()=>handleUpdateUserRole(item.id,item.role==='ADMIN'?'USER':'ADMIN')} className={`p-2 h-8 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${item.role==='ADMIN'?'bg-purple-600 border-purple-500 text-white shadow-lg':'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'}`} title="Toggle Admin Role">{item.role==='ADMIN'?'Admin':'User'}</button>
                                    </div>
                                    {/* ── 🎨 Branding Button ── */}
                                    {!isSelf&&(
                                      <button onClick={()=>{setEditingBrandUserId(item.id);setEditBrandName(item.brandName||'');setEditBrandLogoUrl(item.brandLogoUrl||'');setEditBrandColor(item.brandColor||'#FFD100');}} className={`p-2 h-8 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${hasBranding?'bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/30':'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`} title="Set Customer Branding">
                                        <Palette size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-zinc-950/80 border-t border-zinc-850 flex items-center justify-between text-[7.5px] font-black text-zinc-600 uppercase tracking-widest"><span>Logged in as Admin: {user?.email}</span><span>EventCam Security Shield Pro</span></div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Customer Branding Editor Modal ────────────────────────────── */}
        {editingBrandUserId&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between">
                <div><h3 className="text-base font-black text-white uppercase tracking-widest">Customer Branding</h3><p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Splash screen shown when this customer logs in</p></div>
                <button onClick={()=>setEditingBrandUserId(null)} className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white flex-shrink-0"><X size={14} /></button>
              </div>

              {/* Live Preview */}
              <div className="bg-[#0C0D0E] rounded-2xl p-6 flex flex-col items-center gap-5 border border-zinc-800">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Splash Preview</p>
                {editBrandLogoUrl?(
                  <img src={editBrandLogoUrl} alt="Preview" className="w-20 h-20 object-contain rounded-lg" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
                ):(
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600"><ImageIcon size={24} /></div>
                )}
                {editBrandName?(
                  <div className="text-xl font-black uppercase tracking-widest text-center" style={{color:editBrandColor}}>{editBrandName}</div>
                ):(
                  <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Enter brand name below</div>
                )}
                <div className="w-12 h-[1px] bg-zinc-800" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Powered by</span>
                  <div className="flex items-baseline">
                    <span className="text-base font-black text-[#FFD100] uppercase">Riddim</span>
                    <span className="text-base font-black text-[#009B3A] uppercase ml-1">Room</span>
                    <span className="text-[9px] font-black text-[#D21034] uppercase ml-0.5">.com</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Customer / Brand Name</label>
                  <input type="text" value={editBrandName} onChange={e=>setEditBrandName(e.target.value)} placeholder="e.g. Club Tropicana" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-[11px] font-bold focus:border-[#FFD100] outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Logo URL</label>
                  <input type="url" value={editBrandLogoUrl} onChange={e=>setEditBrandLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-[11px] font-bold focus:border-[#FFD100] outline-none" />
                  <p className="text-[8px] text-zinc-600 pl-1">Upload their logo to Imgur or Cloudinary and paste the direct image URL here.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={editBrandColor} onChange={e=>setEditBrandColor(e.target.value)} className="w-12 h-10 rounded-lg border border-zinc-700 bg-zinc-900 cursor-pointer" />
                    <input type="text" value={editBrandColor} onChange={e=>setEditBrandColor(e.target.value)} className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-[11px] font-bold font-mono focus:border-[#FFD100] outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={()=>setEditingBrandUserId(null)} className="flex-1 py-4 bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-colors">Cancel</button>
                <button onClick={()=>handleSaveCustomerBranding(editingBrandUserId)} disabled={brandSaving} className="flex-1 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                  {brandSaving?<Loader2 size={14} className="animate-spin" />:'Save Branding'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .animate-blink { animation: blink 1s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        input[type="range"] { -webkit-appearance: none; background: rgba(255, 255, 255, 0.1); height: 4px; border-radius: 2px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #FFD100; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }
      `}</style>

      {showsAuthDebug&&(
        <div className="fixed bottom-4 left-4 z-[9999] bg-black/90 border border-[#FFD100]/50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl min-w-[200px] font-mono text-[9px]">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2"><span className="text-[#FFD100] font-black uppercase tracking-tighter">Auth Diagnostics</span><span className={user?"text-emerald-500":"text-red-500"}>{user?"SIGNED_IN":"SIGNED_OUT"}</span></div>
          <div className="space-y-1.5 text-zinc-400">
            <div className="flex justify-between gap-4"><span>USER_ID:</span><span className="text-white truncate max-w-[120px]">{user?.uid||'NONE'}</span></div>
            <div className="flex justify-between gap-4"><span>ROLE:</span><span className="text-white">{userProfile?.role||'UNDEF'}</span></div>
            <div className="flex justify-between gap-4"><span>STATUS:</span><span className={userStatus==='APPROVED'?"text-emerald-400":"text-[#FFD100]"}>{userStatus}</span></div>
            <div className="flex justify-between gap-4"><span>ADMIN:</span><span className={userIsAdmin?"text-emerald-400":"text-red-400"}>{userIsAdmin?"YES":"NO"}</span></div>
            <div className="flex justify-between gap-4"><span>BRAND:</span><span className={customerBranding?"text-purple-400":"text-zinc-600"}>{customerBranding?customerBranding.brandName:'NONE'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
