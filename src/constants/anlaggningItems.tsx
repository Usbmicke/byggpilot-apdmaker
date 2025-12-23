
import React from 'react';
import { LibraryItem } from '../types';
import { createIcon, SvgIcon } from './itemHelpers';
import ID06Image from '@/assets/ikoner/ID06.jpg';

// --- SVG Definitions ---
const HissTrapptornSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M12 52 L52 12" stroke="#111" stroke-width="4" stroke-dasharray="8 4"/><rect x="24" y="8" width="16" height="48" fill="#FFC107" stroke="#000" stroke-width="2"/><path d="M28 16h8v8h-8z M28 28h8v8h-8z M28 40h8v8h-8z" fill="#E8A800"/></svg>`;
const ArmeringSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="48" x="2" y="8" fill="#607D8B" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="38" font-size="12" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">ARM</text></svg>`;
const SagbodSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="48" x="2" y="8" fill="#795548" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="38" font-size="12" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">SÅG</text></svg>`;
const IntagsbryggaSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="32" width="24" height="20" fill="#8D6E63" stroke="#000" stroke-width="2"/><path d="M26 32 L 62 32 L 62 52 L 26 52 Z" fill="#BDBDBD" stroke="#000" stroke-width="2"/><path d="M30 38h28m-28 6h28" stroke="#757575" stroke-width="2"/><path d="M10 38 H 18 V 46 H 10 Z" fill="#A1887F"/></svg>`;

// --- Icon Components ---
// Byt från object-cover till object-contain för att hela bilden ska synas
const ID06Icon = () => <img src={ID06Image} alt="ID06 Läsare" className="w-full h-full object-contain" />;
const HissTrapptornIcon = () => <SvgIcon svg={HissTrapptornSVG} />;
const ArmeringIcon = () => <SvgIcon svg={ArmeringSVG} />;
const SagbodIcon = () => <SvgIcon svg={SagbodSVG} />;
const IntagsbryggaIcon = () => <SvgIcon svg={IntagsbryggaSVG} />;

// --- Category Export ---
export const anlaggningCategory: { name: string; items: LibraryItem[] } = {
    name: "Anläggning",
    items: [
        { type: 'id06-reader', name: 'ID06-Läsare', icon: <ID06Icon />, iconUrl: ID06Image, initialProps: { width: 1.0, height: 1.0 } },
        { type: 'elevator-stairs', name: 'Hiss/Trapptorn', icon: <HissTrapptornIcon />, iconUrl: createIcon(HissTrapptornSVG), initialProps: { width: 1.0, height: 1.0 } },
        { type: 'rebar-station', name: 'Armeringsstation', icon: <ArmeringIcon />, iconUrl: createIcon(ArmeringSVG), initialProps: { width: 2.0, height: 1.5 } },
        { type: 'saw-shed', name: 'Sågbod', icon: <SagbodIcon />, iconUrl: createIcon(SagbodSVG), initialProps: { width: 2.0, height: 1.5 } },
        { type: 'loading-dock', name: 'Intagsbrygga', icon: <IntagsbryggaIcon />, iconUrl: createIcon(IntagsbryggaSVG), initialProps: { width: 2.0, height: 1.0 } },
    ]
};
