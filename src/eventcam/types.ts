/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WatermarkPosition = 
  | 'bottom-left' 
  | 'bottom-center'
  | 'bottom-right'
  | 'top-left'
  | 'top-right'
  | 'center';

export interface TextOverlaySettings {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: WatermarkPosition;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export interface WatermarkSettings {
  assetUrl: string | null; // Transparent PNG
  size: number; // 10-40%
  opacity: number;
  position: WatermarkPosition;
  x: number;
  y: number;
}

export interface BrandSlot {
  id: number;
  watermark: Omit<WatermarkSettings, 'assetUrl'> & { hasAsset: boolean };
  textOverlay: TextOverlaySettings;
  aspectRatio?: AspectRatio;
  isEmpty: boolean;
}

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type AudioMasterPreset = 'heavy-limit' | 'vocal-presence' | 'warm-podcast' | 'raw-bypass';

export interface EventCamSettings {
  watermark: WatermarkSettings;
  textOverlay: TextOverlaySettings;
  exportFormat: 'image/jpeg' | 'image/png';
  aspectRatio: AspectRatio;
  slots: BrandSlot[];
  audioPreset?: AudioMasterPreset;
}

export interface ImageSource {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}
