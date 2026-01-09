
import React from 'react';
import { LibraryItem } from '../types';
import { createIcon, SvgIcon } from './itemHelpers';
import ID06Image from '@/assets/ikoner/ID06.jpg';

// --- SVG Definitions ---
const ArmeringSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#607D8B" stroke="#000" stroke-width="2" rx="4"/><text x="32" y="46" font-size="40" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">A</text></svg>`;
const SagbodSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#795548" stroke="#000" stroke-width="2" rx="4"/><text x="32" y="40" font-size="22" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">SÅG</text></svg>`;
const IntagsbryggaSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="32" width="24" height="20" fill="#8D6E63" stroke="#000" stroke-width="2"/><path d="M26 32 L 62 32 L 62 52 L 26 52 Z" fill="#BDBDBD" stroke="#000" stroke-width="2"/><path d="M30 38h28m-28 6h28" stroke="#757575" stroke-width="2"/><path d="M10 38 H 18 V 46 H 10 Z" fill="#A1887F"/></svg>`;

// --- Icon Components ---
// Byt från object-cover till object-contain för att hela bilden ska synas
const ID06Icon = () => <img src={ID06Image} alt="ID06 Läsare" className="w-full h-full object-contain" />;
const ArmeringIcon = () => <SvgIcon svg={ArmeringSVG} />;
const SagbodIcon = () => <SvgIcon svg={SagbodSVG} />;
const IntagsbryggaIcon = () => <SvgIcon svg={IntagsbryggaSVG} />;

// --- Category Export ---
export const anlaggningCategory: { name: string; items: LibraryItem[] } = {
    name: "Anläggning",
    items: [
        { type: 'id06-reader', name: 'ID06-Läsare', icon: <ID06Icon />, iconUrl: ID06Image, initialProps: { width: 3.0, height: 3.0 } },
        // Deleted duplicate elevator-stairs
        { type: 'rebar-station', name: 'Armeringsstation', icon: <ArmeringIcon />, iconUrl: createIcon(ArmeringSVG), initialProps: { width: 4.0, height: 3.0 } },
        { type: 'saw-shed', name: 'Sågbod', icon: <SagbodIcon />, iconUrl: createIcon(SagbodSVG), initialProps: { width: 4.0, height: 3.0 } },
        { type: 'loading-dock', name: 'Intagsbrygga', icon: <IntagsbryggaIcon />, iconUrl: createIcon(IntagsbryggaSVG), initialProps: { width: 3.5, height: 3.0 } },
    ]
};
