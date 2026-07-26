/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WordCaption {
  id: string;
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export type FontStyle = 'sans' | 'impact' | 'cinematic' | 'comic' | 'hype' | 'mono';

export type CaptionPosition = 'top' | 'center' | 'bottom' | 'custom';

export type AnimationStyle = 'pop' | 'typewriter' | 'bounce' | 'karaoke' | 'zoom' | 'shake' | 'fadeup' | 'smoke' | 'glitch' | 'skew' | 'elastic' | 'flip' | 'fire' | 'spin' | 'slideSplit' | 'rainbow' | 'heartbeat';

export interface CaptionStyle {
  id: string; // Style template ID or custom
  name: string;
  fontFamily: FontStyle;
  fontSize: number; // in px on 1080p canvas, e.g. 64
  textColor: string;
  textColorEnd?: string; // For gradients
  useGradient: boolean;
  strokeColor: string;
  strokeWidth: number; // in px
  useStroke: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: number; // x & y symmetrical
  useShadow: boolean;
  bubbleColor: string;
  bubbleOpacity: number;
  useBubble: boolean;
  letterSpacing: number; // in px
  lineSpacing: number;
  wordHighlightColor: string;
  animationStyle: AnimationStyle;
  position: CaptionPosition;
  customX: number; // 0 to 1 ratio on width
  customY: number; // 0 to 1 ratio on height
}

export interface VideoState {
  fileUrl: string | null;
  fileName: string | null;
  duration: number; // limit 20s
  width: number;
  height: number;
}
