
import React from 'react';
import { LibraryItem } from '../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
const BodSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="40" font-size="16" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">BOD</text></svg>`;
const WCSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#2979FF" stroke="#000" stroke-width="2"/><text x="32" y="44" font-size="28" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">WC</text></svg>`;
const KontorSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><path d="M10 12 L32 2 L54 12" fill="#FF5722" stroke="#000" stroke-width="2"/><text x="32" y="40" font-size="12" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">KONTOR</text></svg>`;

// --- Icon Components ---
const BodIcon = () => <SvgIcon svg={BodSVG} />;
const WCIcon = () => <SvgIcon svg={WCSVG} />;
const KontorIcon = () => <SvgIcon svg={KontorSVG} />;

// --- Category Export ---
export const etableringCategory: { name: string; items: LibraryItem[] } = {
    name: "Etablering",
    items: [
        { type: 'bygg-bod', name: 'Bygg bod', icon: <BodIcon />, initialProps: { iconUrl: createIcon(BodSVG) } },
        { type: 'wc', name: 'WC', icon: <WCIcon />, initialProps: { iconUrl: createIcon(WCSVG) } },
        { type: 'kontor', name: 'Kontor', icon: <KontorIcon />, initialProps: { iconUrl: createIcon(KontorSVG) } },
    ]
};
