
import React from 'react';
import { LibraryItem } from '../types';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
// SVG Definitions
const BodSVG = `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="36" x="2" y="2" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><text x="50" y="24" font-size="14" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" dy=".3em">BOD</text></svg>`;
// WC as a Sign (Triangle/Square/Circle on pole representation 2D?)
// Keeping it simple: Standardize to look like other warning/info signs or just keep the icon simple but the 3D model will change.
// Proposing: A simple square sign for WC to differentiate slightly or circle. Let's keep circle but make it look more "sign-like" if needed.
// Actually user said "regular sign", often square or circle. Let's stick to the icon being the face of the sign.
// I will keep the SVG similar but Ensure it works well as a texture.
const WCSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="60" height="60" rx="4" fill="#1976D2" stroke="#000" stroke-width="2"/>
  <text x="32" y="42" font-size="24" fill="white" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">WC</text>
</svg>`;
const KontorSVG = `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="36" x="2" y="2" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><path d="M20 2 L50 12 L80 2" fill="none" stroke="#000" stroke-width="2"/><text x="50" y="24" font-size="12" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" dy=".3em">KONTOR</text></svg>`;

// --- Optimized Square Icons for Library Display ---
const BodIconSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FF5722" stroke="#000" stroke-width="2" rx="4"/><text x="32" y="36" font-size="16" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">BOD</text></svg>`;
const KontorIconSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FF5722" stroke="#000" stroke-width="2" rx="4"/><path d="M12 2 L32 12 L52 2" fill="none" stroke="#000" stroke-width="2"/><text x="32" y="36" font-size="14" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">OFFICE</text></svg>`;

// Återställd till den ursprungliga (men troligtvis korrupta) hiss-bilden.
const hissImageUrl = '/assets/ikoner/hiss.jpg';

// --- Icon Components ---
const BodIcon = () => <SvgIcon svg={BodIconSVG} />;
const WCIcon = () => <SvgIcon svg={WCSVG} />;
const KontorIcon = () => <SvgIcon svg={KontorIconSVG} />;
const HissIcon = () => <img src={hissImageUrl} alt="Hiss" style={{ width: '100%', height: '100%' }} />;

const SHED_SIZE = { width: 8.4, height: 2.9 }; // Standard Swedish Shed Size
const WC_SIZE = { width: 2.4, height: 2.4 }; // Standard symbol size
const UNIFORM_SIZE = { width: 1.0, height: 1.0 }; // General default
const KONTOR_SIZE = { width: 8.4, height: 2.9 }; // Match shed ratio

// --- Category Export ---
export const etableringCategory: { name: string; items: LibraryItem[] } = {
  name: "Etablering",
  items: [
    { type: 'bygg-bod', name: 'Bygg bod', icon: <BodIcon />, iconUrl: createIcon(BodSVG), initialProps: SHED_SIZE },
    { type: 'wc', name: 'WC', icon: <WCIcon />, iconUrl: createIcon(WCSVG), initialProps: { width: 3.0, height: 3.0 } },
    { type: 'kontor', name: 'Kontor', icon: <KontorIcon />, iconUrl: createIcon(KontorSVG), initialProps: KONTOR_SIZE },
    { type: 'hiss', name: 'Hiss', icon: <HissIcon />, iconUrl: hissImageUrl, initialProps: { width: 3.0, height: 3.0 } },
  ]
};
