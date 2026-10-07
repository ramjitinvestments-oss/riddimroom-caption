/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BuiltInLogo {
  id: string;
  name: string;
  svg: string;
  dataUrl: string;
}

export const RIDDIM_ROOM_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bodyBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2D2F34" />
      <stop offset="50%" stop-color="#1A1C1F" />
      <stop offset="100%" stop-color="#0E0F11" />
    </linearGradient>

    <!-- Glowing Rasta Bezel Gradient -->
    <linearGradient id="rastaBezelLinear" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#D21034" />
      <stop offset="35%" stop-color="#FFD100" />
      <stop offset="65%" stop-color="#009B3A" />
      <stop offset="100%" stop-color="#D21034" />
    </linearGradient>
    
    <!-- Chrome Ring Gradient -->
    <linearGradient id="chromeRing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F2F5F8" />
      <stop offset="25%" stop-color="#7A8793" />
      <stop offset="50%" stop-color="#E2E7EC" />
      <stop offset="75%" stop-color="#3A444D" />
      <stop offset="100%" stop-color="#9FB1C1" />
    </linearGradient>

    <!-- Lens Glass Reflection -->
    <radialGradient id="lensReflectiveGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#4ADE80" stop-opacity="0.8"/>
      <stop offset="30%" stop-color="#FFD100" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="#D21034" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#050608" stop-opacity="1"/>
    </radialGradient>

    <!-- LED glow -->
    <radialGradient id="ledGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#FF3B30" />
      <stop offset="60%" stop-color="#800000" />
      <stop offset="100%" stop-color="#000000" />
    </radialGradient>

    <!-- LED glow outer -->
    <radialGradient id="ledGlowOuter" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF3B30" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#FF3B30" stop-opacity="0" />
    </radialGradient>
    
    <!-- Text Shadow Filter -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- Clean App Icon Outer Square with thick glossy bevel border -->
  <rect x="12" y="12" width="488" height="488" rx="100" fill="url(#bodyBg)" stroke="url(#rastaBezelLinear)" stroke-width="14"/>
  <rect x="23" y="23" width="466" height="466" rx="90" fill="none" stroke="#222528" stroke-width="4" opacity="0.6"/>

  <!-- Glowing REC Indicator LED on top right -->
  <g transform="translate(415, 75)">
    <circle cx="0" cy="0" r="22" fill="#151719" stroke="#333" stroke-width="2"/>
    <circle cx="0" cy="0" r="16" fill="url(#ledGlowOuter)" opacity="0.8"/>
    <circle cx="0" cy="0" r="12" fill="url(#ledGlow)"/>
    <circle cx="-3" cy="-3" r="3" fill="#FFF" opacity="0.6"/>
  </g>

  <!-- Large Swirling Rasta Shutter Arcs in background -->
  <path d="M 256 50 A 206 206 0 0 0 71 180 L 115 195 A 156 156 0 0 1 256 95 Z" fill="#D21034" opacity="0.95" />
  <path d="M 256 50 A 206 206 0 0 1 430 160 L 382 180 A 156 156 0 0 0 256 95 Z" fill="#FFD100" opacity="0.95" />
  <path d="M 71 180 A 206 206 0 0 0 350 435 L 330 388 A 156 156 0 0 1 115 195 Z" fill="#009B3A" opacity="0.95" />

  <!-- Camera Lens Outer Cylinder Group -->
  <g transform="translate(256, 256)">
    <!-- Outer metallic housing -->
    <circle cx="0" cy="0" r="142" fill="#1E2024" stroke="url(#chromeRing)" stroke-width="7" filter="url(#dropShadow)"/>
    <circle cx="0" cy="0" r="130" fill="#0C0D0E" stroke="#3B424A" stroke-width="3" />
    
    <!-- Concentric threads -->
    <circle cx="0" cy="0" r="122" fill="none" stroke="#16181C" stroke-width="2" />
    <circle cx="0" cy="0" r="116" fill="none" stroke="#22252A" stroke-width="1.5" />
    <circle cx="0" cy="0" r="110" fill="none" stroke="#101114" stroke-width="2" />
    <circle cx="0" cy="0" r="102" fill="none" stroke="#2D323A" stroke-width="1" />
    
    <!-- Chrome Lens Ring Bezel -->
    <circle cx="0" cy="0" r="95" fill="none" stroke="url(#chromeRing)" stroke-width="4" />
    <circle cx="0" cy="0" r="88" fill="#040506" />

    <!-- Highly Reflective Glass Core with custom radial rasta/cyan colors -->
    <circle cx="0" cy="0" r="84" fill="url(#lensReflectiveGrad)" />

    <!-- Convex specular glass shine highlights -->
    <ellipse cx="-35" cy="-35" rx="20" ry="10" transform="rotate(-40 -35 -35)" fill="#FFFFFF" opacity="0.45" />
    <ellipse cx="40" cy="40" rx="12" ry="6" transform="rotate(-40 40 40)" fill="#FFFFFF" opacity="0.25" />
  </g>

  <!-- Large Stylized "RIDDIM ROOM.COM" Brand Overlays -->
  <g filter="url(#dropShadow)" transform="translate(0, 15)">
    <!-- "RIDDIM" Word -->
    <text x="256" y="360" text-anchor="middle" font-family="'Impact', 'Arial Black', system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" font-style="italic" fill="#FFD100" stroke="#000" stroke-width="8" stroke-linejoin="round" letter-spacing="-2px">
      RIDDIM
    </text>
    
    <!-- "ROOM.com" Word -->
    <text x="256" y="425" text-anchor="middle" font-family="'Impact', 'Arial Black', system-ui, -apple-system, sans-serif" font-size="70" font-weight="900" font-style="italic" fill="#FFFFFF" stroke="#000" stroke-width="8" stroke-linejoin="round" letter-spacing="-3px">
      ROOM<tspan font-family="'Impact', sans-serif" font-size="38" fill="#FFFFFF" font-style="italic">.COM</tspan>
    </text>
  </g>

  <!-- Green Event Camera Banner Ribbons with Yellow Trim and Rasta stripes -->
  <g transform="translate(0, 32)">
    <!-- Main green horizontal container -->
    <rect x="130" y="416" width="252" height="28" rx="6" fill="#009B3A" stroke="#FFD100" stroke-width="2" filter="url(#dropShadow)" />
    
    <!-- Rasta colorful stripes left/right inside banner -->
    <rect x="135" y="420" width="10" height="20" rx="1" fill="#D21034" />
    <rect x="145" y="420" width="10" height="20" rx="1" fill="#FFD100" />
    <rect x="357" y="420" width="10" height="20" rx="1" fill="#FFD100" />
    <rect x="367" y="420" width="10" height="20" rx="1" fill="#D21034" />

    <!-- EVENT CAMERA Text inside banner -->
    <text x="256" y="434" text-anchor="middle" font-family="'Space Grotesk', 'Arial Black', sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" letter-spacing="3.5px">
      EVENT CAMERA
    </text>
  </g>
</svg>`;

export const SPEAKER_STACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 250" width="500" height="250">
  <rect width="500" height="250" rx="24" fill="#0C0D0E" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
  <rect x="10" y="10" width="480" height="230" rx="18" stroke="url(#logoBorderGlow2)" stroke-width="4" fill="none"/>
  <g transform="translate(20, 15)">
    <rect x="20" y="20" width="100" height="180" rx="12" fill="#1C1E22" stroke="#2D3748" stroke-width="4"/>
    <circle cx="70" cy="65" r="30" fill="#0A0B0D" stroke="#009B3A" stroke-width="3"/>
    <circle cx="70" cy="65" r="10" fill="#FFE033"/>
    <circle cx="70" cy="145" r="38" fill="#0A0B0D" stroke="#D21034" stroke-width="3"/>
    <circle cx="70" cy="145" r="14" fill="#009B3A"/>
    <rect x="40" y="195" width="60" height="15" rx="4" fill="#1A1C1E" stroke="#FFD100" stroke-width="2"/>
  </g>
  <g transform="translate(160, 0)">
    <text x="15" y="105" font-family="'Space Grotesk', sans-serif" font-size="54" font-weight="900" font-style="italic" fill="url(#soundGrad)" letter-spacing="-2">SOUND</text>
    <text x="15" y="155" font-family="'Space Grotesk', sans-serif" font-size="54" font-weight="900" font-style="italic" fill="url(#systemGrad)" letter-spacing="-2">SYSTEM</text>
    <rect x="15" y="175" width="230" height="28" rx="8" fill="#141517" stroke="#2D3748" stroke-width="1.5" />
    <text x="30" y="194" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" letter-spacing="4">RIDDIM ROOM DUB</text>
  </g>
  <defs>
    <linearGradient id="logoBorderGlow2" x1="0" y1="0" x2="500" y2="250" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFD100"/>
      <stop offset="100%" stop-color="#009B3A"/>
    </linearGradient>
    <linearGradient id="soundGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD100" />
      <stop offset="100%" stop-color="#D21034" />
    </linearGradient>
    <linearGradient id="systemGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00E656" />
      <stop offset="100%" stop-color="#008030" />
    </linearGradient>
  </defs>
</svg>`;

export const DUBPLATE_VINYL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 250" width="500" height="250">
  <rect width="500" height="250" rx="24" fill="#0C0D0E" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
  <rect x="10" y="10" width="480" height="230" rx="18" stroke="url(#logoBorderGlow3)" stroke-width="4" fill="none"/>
  <g transform="translate(15, 0)">
    <circle cx="115" cy="125" r="85" fill="#101113" stroke="#22252a" stroke-width="4"/>
    <circle cx="115" cy="125" r="72" fill="none" stroke="#1d2024" stroke-width="1.5"/>
    <circle cx="115" cy="125" r="60" fill="none" stroke="#1d2024" stroke-width="1.5"/>
    <circle cx="115" cy="125" r="48" fill="none" stroke="#1d2024" stroke-width="1"/>
    <circle cx="115" cy="125" r="35" fill="url(#labelGrad)"/>
    <circle cx="115" cy="125" r="30" fill="#FFD100" stroke="#009B3A" stroke-width="2"/>
    <circle cx="115" cy="125" r="8" fill="#0C0D0E"/>
    <path d="M 45 125 A 70 70 0 0 1 115 55 L 115 72 A 53 53 0 0 0 62 125 Z" fill="#FFFFFF" opacity="0.08"/>
    <path d="M 185 125 A 70 70 0 0 1 115 195 L 115 178 A 53 53 0 0 0 168 125 Z" fill="#FFFFFF" opacity="0.08"/>
  </g>
  <g transform="translate(200, 0)">
    <text x="0" y="110" font-family="'Space Grotesk', sans-serif" font-size="44" font-weight="900" font-style="italic" fill="#FFD100" letter-spacing="-1">EXCLUSIVE</text>
    <text x="0" y="160" font-family="'Space Grotesk', sans-serif" font-size="44" font-weight="900" font-style="italic" fill="#009B3A" letter-spacing="-1">DUBPLATE</text>
    <text x="0" y="200" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#D21034">RIDDIMROOM REC.</text>
  </g>
  <defs>
    <linearGradient id="logoBorderGlow3" x1="0" y1="0" x2="500" y2="250" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#D21034"/>
      <stop offset="50%" stop-color="#FFD100"/>
      <stop offset="100%" stop-color="#009B3A"/>
    </linearGradient>
    <linearGradient id="labelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#D21034" />
      <stop offset="50%" stop-color="#FFD100" />
      <stop offset="100%" stop-color="#009B3A" />
    </linearGradient>
  </defs>
</svg>`;

export const LION_SHIELD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 250" width="500" height="250">
  <rect width="500" height="250" rx="24" fill="#0C0D0E" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
  <rect x="10" y="10" width="480" height="230" rx="18" stroke="url(#logoBorderGlow4)" stroke-width="4" fill="none"/>
  <g transform="translate(15, 0)">
    <path d="M 60 50 L 170 50 L 150 180 L 115 210 L 80 180 Z" fill="#D21034" stroke="#FFE033" stroke-width="2" />
    <path d="M 70 60 L 160 60 L 142 170 L 115 195 L 88 170 Z" fill="#FFD100" />
    <path d="M 80 70 L 150 70 L 135 155 L 115 178 L 95 155 Z" fill="#009B3A" />
    <path d="M 105 100 L 125 100 L 125 140 L 105 140 Z M 115 90 L 115 150 M 100 115 L 130 115" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
  <g transform="translate(195, 0)">
    <text x="5" y="110" font-family="'Space Grotesk', sans-serif" font-size="44" font-weight="900" fill="#009B3A" letter-spacing="-1">CHAMPION</text>
    <text x="5" y="160" font-family="'Space Grotesk', sans-serif" font-size="44" font-weight="900" fill="#FFD100" letter-spacing="-1">SOUNDWALK</text>
    <text x="5" y="200" font-family="'Space Grotesk', sans-serif" font-size="16" font-style="italic" font-weight="bold" fill="#D21034">RIDDIM ROOM EXCLUSIVE</text>
  </g>
  <defs>
    <linearGradient id="logoBorderGlow4" x1="0" y1="0" x2="500" y2="250" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#009B3A"/>
      <stop offset="100%" stop-color="#D21034"/>
    </linearGradient>
  </defs>
</svg>`;

const toDataUrl = (svgString: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

export const BUILTIN_LOGOS: BuiltInLogo[] = [
  { id: 'riddim_room', name: 'Riddim Classic', svg: RIDDIM_ROOM_LOGO_SVG, dataUrl: toDataUrl(RIDDIM_ROOM_LOGO_SVG) },
  { id: 'speaker_stack', name: 'Bass Speakers', svg: SPEAKER_STACK_SVG, dataUrl: toDataUrl(SPEAKER_STACK_SVG) },
  { id: 'dubplate_vinyl', name: 'Dubplate Vinyl', svg: DUBPLATE_VINYL_SVG, dataUrl: toDataUrl(DUBPLATE_VINYL_SVG) },
  { id: 'lion_shield', name: 'Lion Shield', svg: LION_SHIELD_SVG, dataUrl: toDataUrl(LION_SHIELD_SVG) },
];
