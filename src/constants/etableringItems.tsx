
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
const BodSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="40" font-size="16" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">BOD</text></svg>`;
const WCSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#2979FF" stroke="#000" stroke-width="2"/><text x="32" y="44" font-size="28" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">WC</text></svg>`;
const KontorSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><path d="M10 12 L32 2 L54 12" fill="#FF5722" stroke="#000" stroke-width="2"/><text x="32" y="40" font-size="12" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">KONTOR</text></svg>`;

// Återställd till den ursprungliga (men troligtvis korrupta) hiss-bilden.
const hissImageUrl = '/assets/ikoner/hiss.jpg';

// --- Icon Components ---
const BodIcon = () => <SvgIcon svg={BodSVG} />;
const WCIcon = () => <SvgIcon svg={WCSVG} />;
const KontorIcon = () => <SvgIcon svg={KontorSVG} />;
const HissIcon = () => <img src={hissImageUrl} alt="Hiss" style={{ width: '100%', height: '100%' }} />;

const UNIFORM_SIZE = { width: 50, height: 50 };

// --- Category Export ---
export const etableringCategory: { name: string; items: LibraryItem[] } = {
    name: "Etablering",
    items: [
        { type: 'bygg-bod', name: 'Bygg bod', icon: <BodIcon />, iconUrl: createIcon(BodSVG), initialProps: UNIFORM_SIZE },
        { type: 'wc', name: 'WC', icon: <WCIcon />, iconUrl: createIcon(WCSVG), initialProps: UNIFORM_SIZE },
        { type: 'kontor', name: 'Kontor', icon: <KontorIcon />, iconUrl: createIcon(KontorSVG), initialProps: UNIFORM_SIZE },
        { type: 'hiss', name: 'Hiss', icon: <HissIcon />, iconUrl: hissImageUrl, initialProps: UNIFORM_SIZE },
    ]
};
