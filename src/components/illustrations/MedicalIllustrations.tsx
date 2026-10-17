import React from 'react';

// ============================================================================
// PULSE Healthcare Design System — Bespoke Medical SVG Illustration Suite
// Crafted for clinical clarity, warm empathy, and zero "AI template" aesthetic.
// ============================================================================

interface SvgProps {
  className?: string;
  size?: number;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * 3D-styled medical capsule with specular shine and dual-tone clinical casing
 */
export const CapsuleSvg: React.FC<SvgProps & { primaryColor?: string; secondaryColor?: string }> = ({
  className = '',
  size = 48,
  primaryColor = '#0D9488', // Medical Teal
  secondaryColor = '#F59E0B', // Warm Amber
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="capGradLeft" x1="16" y1="16" x2="32" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <stop offset="30%" stopColor={primaryColor} />
        <stop offset="100%" stopColor="#042F2E" />
      </linearGradient>
      <linearGradient id="capGradRight" x1="32" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <stop offset="40%" stopColor={secondaryColor} />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="capShine" x1="20" y1="16" x2="44" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <filter id="capShadow" x="8" y="12" width="48" height="44" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.18" />
      </filter>
    </defs>
    <g transform="rotate(-30 32 32)" filter="url(#capShadow)">
      {/* Capsule base rounded rect */}
      <clipPath id="capClip">
        <rect x="14" y="20" width="36" height="24" rx="12" />
      </clipPath>
      <g clipPath="url(#capClip)">
        {/* Left half */}
        <rect x="14" y="20" width="18" height="24" fill="url(#capGradLeft)" />
        {/* Right half */}
        <rect x="32" y="20" width="18" height="24" fill="url(#capGradRight)" />
        {/* Joint ring line */}
        <line x1="32" y1="20" x2="32" y2="44" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
      </g>
      {/* Outer border */}
      <rect x="14" y="20" width="36" height="24" rx="12" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" fill="none" />
      {/* Specular gloss highlight */}
      <ellipse cx="26" cy="24" rx="9" ry="2" fill="url(#capShine)" />
    </g>
  </svg>
);

/**
 * Scored clinical tablet with embossed score line and pharmaceutical bevel
 */
export const TabletPillSvg: React.FC<SvgProps & { color?: string }> = ({
  className = '',
  size = 48,
  color = '#0EA5E9', // Sky Teal
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="tabGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor={color} />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <filter id="tabShadow" x="10" y="10" width="44" height="48" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#tabShadow)">
      {/* Main circular body */}
      <circle cx="32" cy="32" r="18" fill="url(#tabGrad)" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
      {/* Score line divider with shadow/highlight bevel */}
      <line x1="22" y1="22" x2="42" y2="42" stroke="#082F49" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
      <line x1="22.5" y1="21.5" x2="42.5" y2="41.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
      {/* Top bevel highlight */}
      <path d="M 18 32 A 14 14 0 0 1 32 18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
    </g>
  </svg>
);

/**
 * Medicine syrup bottle with dosage measurement marks
 */
export const SyrupBottleSvg: React.FC<SvgProps> = ({
  className = '',
  size = 48,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="syrupGlass" x1="18" y1="22" x2="46" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#CCFBF1" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
      <linearGradient id="syrupLiquid" x1="20" y1="36" x2="44" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
    </defs>
    {/* Cap */}
    <rect x="26" y="10" width="12" height="7" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
    {/* Neck */}
    <rect x="28" y="17" width="8" height="5" fill="#CBD5E1" />
    {/* Bottle Body */}
    <rect x="20" y="22" width="24" height="32" rx="6" fill="url(#syrupGlass)" stroke="#FFFFFF" strokeWidth="1.5" />
    {/* Liquid Fill */}
    <rect x="21.5" y="34" width="21" height="18.5" rx="4" fill="url(#syrupLiquid)" />
    {/* Measurement lines */}
    <line x1="38" y1="38" x2="42" y2="38" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
    <line x1="36" y1="42" x2="42" y2="42" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
    <line x1="38" y1="46" x2="42" y2="46" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
    {/* Cross badge on label */}
    <circle cx="28" cy="42" r="4" fill="#FFFFFF" fillOpacity="0.9" />
    <path d="M28 40V44M26 42H30" stroke="#0F766E" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * Stethoscope & Prescription Document Vector Illustration (Hero / Empty State)
 */
export const PrescriptionDocSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 140,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="docBg" x1="45" y1="30" x2="155" y2="170" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
      <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
      <filter id="docShadow" x="30" y="20" width="140" height="165" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.12" />
      </filter>
    </defs>
    {/* Prescription Paper */}
    <g filter="url(#docShadow)">
      <rect x="45" y="28" width="110" height="144" rx="12" fill="url(#docBg)" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Top Header Clip */}
      <rect x="82" y="22" width="36" height="12" rx="4" fill="#64748B" />
      <circle cx="100" cy="28" r="2.5" fill="#E2E8F0" />
      
      {/* Rx Header Emblem */}
      <rect x="58" y="48" width="24" height="24" rx="6" fill="url(#badgeGrad)" />
      <text x="70" y="65" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="system-ui, sans-serif">Rx</text>
      
      {/* Header Info Lines */}
      <rect x="88" y="52" width="55" height="5" rx="2.5" fill="#94A3B8" />
      <rect x="88" y="61" width="38" height="4" rx="2" fill="#CBD5E1" />

      {/* Divider */}
      <line x1="58" y1="80" x2="142" y2="80" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Medicine lines */}
      <rect x="58" y="92" width="70" height="5" rx="2.5" fill="#0D9488" fillOpacity="0.7" />
      <rect x="58" y="102" width="45" height="4" rx="2" fill="#CBD5E1" />

      <rect x="58" y="116" width="62" height="5" rx="2.5" fill="#0D9488" fillOpacity="0.7" />
      <rect x="58" y="126" width="35" height="4" rx="2" fill="#CBD5E1" />

      {/* Doctor signature & stamp */}
      <path d="M 60 148 Q 70 142 80 148 T 100 146" stroke="#0F766E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="132" cy="146" r="10" stroke="#0D9488" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
      <circle cx="132" cy="146" r="7" fill="#0D9488" fillOpacity="0.15" />
    </g>

    {/* Stethoscope wrapping around prescription */}
    <path
      d="M 32 100 C 32 155 70 182 110 182 C 145 182 172 158 172 120"
      stroke="#0D9488"
      strokeWidth="4.5"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="172" cy="116" r="8" fill="#14B8A6" stroke="#042F2E" strokeWidth="2" />
    <circle cx="172" cy="116" r="3.5" fill="#FFFFFF" />
  </svg>
);

/**
 * Clean Medicine Cabinet SVG (Empty state for no scheduled medicines)
 */
export const MedicineCabinetSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 140,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="cabFrame" x1="30" y1="20" x2="170" y2="180" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <filter id="cabShadow" x="20" y="15" width="160" height="170" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.1" />
      </filter>
    </defs>
    <g filter="url(#cabShadow)">
      {/* Cabinet Frame */}
      <rect x="35" y="25" width="130" height="150" rx="16" fill="url(#cabFrame)" stroke="#CBD5E1" strokeWidth="2" />
      
      {/* Cross on top header */}
      <rect x="94" y="34" width="12" height="12" rx="2" fill="#0D9488" fillOpacity="0.15" />
      <path d="M100 37V43M97 40H103" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />

      {/* Middle Shelf */}
      <rect x="42" y="100" width="116" height="4" rx="2" fill="#94A3B8" />

      {/* Top shelf items: Pill bottle & blister pack */}
      <rect x="58" y="58" width="18" height="36" rx="4" fill="#0D9488" fillOpacity="0.85" />
      <rect x="56" y="54" width="22" height="6" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="62" y="68" width="10" height="16" rx="2" fill="#FFFFFF" />

      {/* Blister pack */}
      <rect x="92" y="66" width="34" height="28" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
      <circle cx="100" cy="74" r="3.5" fill="#38BDF8" />
      <circle cx="112" cy="74" r="3.5" fill="#38BDF8" />
      <circle cx="100" cy="86" r="3.5" fill="#38BDF8" />
      <circle cx="112" cy="86" r="3.5" fill="#38BDF8" />

      {/* Bottom shelf items: Syrup bottle & dropper */}
      <rect x="60" y="118" width="24" height="40" rx="5" fill="#0F766E" />
      <rect x="65" y="112" width="14" height="8" rx="2" fill="#E2E8F0" />
      <rect x="64" y="130" width="16" height="20" rx="2" fill="#FFFFFF" fillOpacity="0.9" />

      {/* Dropper */}
      <rect x="106" y="126" width="10" height="32" rx="3" fill="#94A3B8" fillOpacity="0.6" />
      <circle cx="111" cy="122" r="5" fill="#F43F5E" />
    </g>
  </svg>
);

/**
 * Biometric ECG Telemetry Pulse Waveform
 */
export const EcgPulseWaveSvg: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = '#0D9488',
}) => (
  <svg
    viewBox="0 0 240 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M0 20 L40 20 L55 20 L65 5 L75 35 L85 10 L95 28 L105 20 L140 20 L155 20 L165 8 L175 32 L185 14 L195 24 L205 20 L240 20"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Family Caregiver Connected Heart Shield SVG
 */
export const FamilyCareSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 140,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="shieldGrad" x1="40" y1="30" x2="160" y2="170" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
      <filter id="shieldShadow" x="30" y="25" width="140" height="155" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0D9488" floodOpacity="0.25" />
      </filter>
    </defs>
    <g filter="url(#shieldShadow)">
      {/* Heart Shield */}
      <path
        d="M 100 35 C 130 18 165 30 165 68 C 165 110 120 148 100 162 C 80 148 35 110 35 68 C 35 30 70 18 100 35 Z"
        fill="url(#shieldGrad)"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      {/* People Connection Nodes inside shield */}
      {/* Parent / Caregiver */}
      <circle cx="85" cy="74" r="10" fill="#FFFFFF" />
      <path d="M 68 108 C 68 94 76 89 85 89 C 94 89 102 94 102 108" fill="#FFFFFF" />
      
      {/* Elder / Patient */}
      <circle cx="118" cy="80" r="8" fill="#CCFBF1" />
      <path d="M 105 108 C 105 97 111 93 118 93 C 125 93 131 97 131 108" fill="#CCFBF1" />

      {/* Pulse line connection */}
      <path d="M 65 124 L 88 124 L 95 116 L 105 132 L 112 124 L 135 124" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

/**
 * Atmospheric Slot Badge Artwork (Morning Dawn, Bright Noon, Dusk Evening, Night Sky)
 */
export const TimeSlotArt: React.FC<{
  slot: 'morning' | 'afternoon' | 'evening' | 'night';
  size?: number;
  className?: string;
}> = ({ slot, size = 40, className = '' }) => {
  if (slot === 'morning') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#FEF3C7" />
        <circle cx="24" cy="22" r="10" fill="#F59E0B" />
        {/* Sun rays */}
        <line x1="24" y1="6" x2="24" y2="9" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="12" x2="14" y2="14" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="36" y1="12" x2="34" y2="14" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
        {/* Gentle morning horizon */}
        <path d="M8 32 C 16 28 32 28 40 32 L 40 40 L 8 40 Z" fill="#FCD34D" fillOpacity="0.8" />
      </svg>
    );
  }

  if (slot === 'afternoon') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#E0F2FE" />
        <circle cx="24" cy="24" r="11" fill="#0284C7" />
        {/* Radiance */}
        <circle cx="24" cy="24" r="15" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="24" cy="24" r="19" stroke="#7DD3FC" strokeWidth="1" strokeDasharray="2 4" />
      </svg>
    );
  }

  if (slot === 'evening') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#FEE2E2" />
        <circle cx="24" cy="26" r="10" fill="#E11D48" />
        {/* Sunset horizon */}
        <line x1="10" y1="30" x2="38" y2="30" stroke="#9F1239" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="14" y1="35" x2="34" y2="35" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Night
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#1E293B" />
      {/* Crescent Moon */}
      <path
        d="M 28 14 C 20 14 14 20 14 28 C 14 36 20 42 28 42 C 32 42 35 40 37 38 C 30 38 24 32 24 25 C 24 19 28 15 33 14 C 31 14 29 14 28 14 Z"
        fill="#38BDF8"
      />
      {/* Stars */}
      <circle cx="34" cy="18" r="1.5" fill="#FFFFFF" />
      <circle cx="38" cy="26" r="1" fill="#FFFFFF" />
    </svg>
  );
};
