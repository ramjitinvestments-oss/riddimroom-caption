import React from 'react';

interface RiddimLogoProps {
  className?: string;
  size?: number | string;
  onClick?: () => void;
}

export function RiddimLogo({ className = '', size, onClick }: RiddimLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} select-none`}
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <defs>
        {/* Gold Gradients for the Crown */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF3A1" />
          <stop offset="30%" stopColor="#F5C038" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        <radialGradient id="goldReflect" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#451A03" />
        </radialGradient>

        {/* Neon Green Gradients for the R */}
        <linearGradient id="neonGreenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>

        {/* Reggae Background Ring Gradients */}
        <linearGradient id="reggaeRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />   {/* Green */}
          <stop offset="50%" stopColor="#FBBF24" />  {/* Yellow */}
          <stop offset="100%" stopColor="#EF4444" /> {/* Red */}
        </linearGradient>

        {/* Inner Circle Metallic Dark Fill */}
        <radialGradient id="metallicDark" cx="50%" cy="58%" r="45%">
          <stop offset="0%" stopColor="#2A2A35" />
          <stop offset="70%" stopColor="#0F0F13" />
          <stop offset="100%" stopColor="#050507" />
        </radialGradient>

        {/* Glow Filters */}
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="neonGreenGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.6" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* 1. Base Dark Shadow Layer */}
      <circle cx="50" cy="58" r="37" fill="#000000" opacity="0.6" filter="url(#subtleShadow)" />

      {/* 2. Tricolor Reggae Outer Ring */}
      <circle
        cx="50"
        cy="58"
        r="36"
        fill="none"
        stroke="url(#reggaeRing)"
        strokeWidth="2.5"
      />

      {/* 3. Inner Dark Metallic Shield */}
      <circle cx="50" cy="58" r="34" fill="url(#metallicDark)" />

      {/* 4. Glowing Neon Green 'R' */}
      <g filter="url(#neonGreenGlow)">
        {/* Stylized custom SVG R path for smooth rendering */}
        <path
          d="M 38 74 
             L 38 42 
             Q 38 37, 43 37 
             L 53 37 
             Q 61 37, 61 45 
             Q 61 52, 53 52 
             L 44 52 
             M 44 52 
             L 54 74"
          fill="none"
          stroke="url(#neonGreenGradient)"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Small loop close-off element */}
        <path
          d="M 44 52 L 49 52"
          stroke="url(#neonGreenGradient)"
          strokeWidth="8.5"
          strokeLinecap="round"
        />
      </g>

      {/* 5. Golden Crown sitting majestically on the top edge of the circle */}
      <g filter="url(#goldGlow)" transform="translate(0, -1)">
        {/* Crown base band with subtle curves */}
        <path
          d="M 28 27 Q 50 31, 72 27 L 70 33 Q 50 36, 30 33 Z"
          fill="url(#goldGradient)"
        />
        
        {/* Five points of the crown */}
        <path
          d="M 28 27 
             L 31 14 
             L 40 23 
             L 50 9 
             L 60 23 
             L 69 14 
             L 72 27 
             Q 50 30, 28 27 Z"
          fill="url(#goldReflect)"
        />

        {/* Crown Jewels on the tips */}
        <circle cx="31" cy="13.5" r="2.2" fill="url(#goldGradient)" />
        <circle cx="50" cy="8.5" r="3" fill="url(#goldGradient)" />
        <circle cx="69" cy="13.5" r="2.2" fill="url(#goldGradient)" />
        
        {/* Base decorative small rubies/emeralds as color dots (Green and Red) */}
        <circle cx="38" cy="30" r="1.2" fill="#10B981" />
        <circle cx="50" cy="31" r="1.5" fill="#EF4444" />
        <circle cx="62" cy="30" r="1.2" fill="#10B981" />
      </g>
    </svg>
  );
}
