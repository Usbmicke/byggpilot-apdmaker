
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
const FarligtAvfallSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FFD600" stroke="#000" stroke-width="3" rx="4"/><path d="M32 14 L14 50 H50 Z" fill="#000"/><circle cx="32" cy="30" r="3" fill="#FFD600"/><rect x="30" y="36" width="4" height="8" fill="#FFD600"/></svg>`;
const OljeavskiljareSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="48" height="40" rx="4" fill="#673AB7" stroke="#fff" stroke-width="2"/><path d="M22 24 C 22 18, 30 18, 30 24 C 30 30, 22 30, 22 24" fill="#1E88E5"/><path d="M34 42 C 34 48, 42 48, 42 42 C 42 36, 34 36, 34 42" fill="#212121"/><path d="M8 32 H 56" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`;

// --- Icon Components ---
const MiljostationIcon = () => <img src="src/assets/ikoner/miljostation.png" alt="Miljöstation" className="w-full h-full object-cover" />;
const FarligtAvfallIcon = () => <SvgIcon svg={FarligtAvfallSVG} />;
const OljeavskiljareIcon = () => <SvgIcon svg={OljeavskiljareSVG} />;

// --- Category Export ---
export const miljoCategory: { name: string; items: LibraryItem[] } = {
    name: "Miljö",
    items: [
        { type: 'miljostation', name: 'Miljöstation', icon: <MiljostationIcon />, iconUrl: 'src/assets/ikoner/miljostation.png' },
        { type: 'farligt-avfall', name: 'Farligt avfall', icon: <FarligtAvfallIcon />, iconUrl: createIcon(FarligtAvfallSVG) },
        { type: 'oil-separator', name: 'Oljeavskiljare', icon: <OljeavskiljareIcon />, iconUrl: createIcon(OljeavskiljareSVG) },
    ]
};
