
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
const BodSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="40" font-size="16" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">BOD</text></svg>`;
const WCSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#2979FF" stroke="#000" stroke-width="2"/><text x="32" y="44" font-size="28" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">WC</text></svg>`;
const KontorSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><path d="M10 12 L32 2 L54 12" fill="#FF5722" stroke="#000" stroke-width="2"/><text x="32" y="40" font-size="12" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">KONTOR</text></svg>`;
// NY SVG FÖR HISS: Enkel kvadrat med pilar upp/ner.
const HissSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="44" height="44" rx="4" fill="#607D8B" stroke="#000" stroke-width="2"/><path d="M32 20 L42 30 L22 30 Z" fill="white"/><path d="M32 44 L22 34 L42 34 Z" fill="white"/></svg>`;


// --- Icon Components ---
const BodIcon = () => <SvgIcon svg={BodSVG} />;
const WCIcon = () => <SvgIcon svg={WCSVG} />;
const KontorIcon = () => <SvgIcon svg={KontorSVG} />;
const HissIcon = () => <SvgIcon svg={HissSVG} />; // Ny ikon-komponent

// --- Category Export ---
export const etableringCategory: { name: string; items: LibraryItem[] } = {
    name: "Etablering",
    items: [
        { type: 'bygg-bod', name: 'Bygg bod', icon: <BodIcon />, iconUrl: createIcon(BodSVG) },
        { type: 'wc', name: 'WC', icon: <WCIcon />, iconUrl: createIcon(WCSVG) },
        { type: 'kontor', name: 'Kontor', icon: <KontorIcon />, iconUrl: createIcon(KontorSVG) },
        // NYTT OBJEKT: Hiss har lagts till i biblioteket.
        { type: 'hiss', name: 'Hiss', icon: <HissIcon />, iconUrl: createIcon(HissSVG) },
    ]
};
