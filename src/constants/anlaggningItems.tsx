
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';
import ID06Image from '@/assets/ikoner/ID06.jpg';

// --- SVG Definitions ---
const HissTrapptornSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M12 52 L52 12" stroke="#111" stroke-width="4" stroke-dasharray="8 4"/><rect x="24" y="8" width="16" height="48" fill="#FFC107" stroke="#000" stroke-width="2"/><path d="M28 16h8v8h-8z M28 28h8v8h-8z M28 40h8v8h-8z" fill="#E8A800"/></svg>`;
const ArmeringSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="40" width="48" height="16" rx="2" fill="#A16207" stroke="#000" stroke-width="2"/><path d="M16 12L16 40 M24 12L24 40 M32 12L32 40" stroke="#9E9E9E" stroke-width="4"/><path d="M40 12 C 40 25, 52 25, 52 40" stroke="#C0C0C0" stroke-width="4" fill="none"/></svg>`;
const SagbodSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M8 52 L8 24 L32 8 L56 24 L56 52 Z" fill="#8B4513" stroke="#000" stroke-width="2"/><circle cx="32" cy="34" r="12" fill="none" stroke="#E0E0E0" stroke-width="2.5"/><path d="M24 28 L40 44 M24 44 L40 28" stroke="#E0E0E0" stroke-width="1.5"/></svg>`;
const IntagsbryggaSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="32" width="24" height="20" fill="#8D6E63" stroke="#000" stroke-width="2"/><path d="M26 32 L 62 32 L 62 52 L 26 52 Z" fill="#BDBDBD" stroke="#000" stroke-width="2"/><path d="M30 38h28m-28 6h28" stroke="#757575" stroke-width="2"/><path d="M10 38 H 18 V 46 H 10 Z" fill="#A1887F"/></svg>`;

// --- Icon Components ---
const ID06Icon = () => <img src={ID06Image} alt="ID06 Läsare" className="w-full h-full object-cover" />;
const HissTrapptornIcon = () => <SvgIcon svg={HissTrapptornSVG} />;
const ArmeringIcon = () => <SvgIcon svg={ArmeringSVG} />;
const SagbodIcon = () => <SvgIcon svg={SagbodSVG} />;
const IntagsbryggaIcon = () => <SvgIcon svg={IntagsbryggaSVG} />;

// --- Category Export ---
export const anlaggningCategory: { name: string; items: LibraryItem[] } = {
    name: "Anläggning",
    items: [
        { type: 'id06-reader', name: 'ID06-Läsare', icon: <ID06Icon />, initialProps: { iconUrl: ID06Image } },
        { type: 'elevator-stairs', name: 'Hiss/Trapptorn', icon: <HissTrapptornIcon />, initialProps: { iconUrl: createIcon(HissTrapptornSVG) } },
        { type: 'rebar-station', name: 'Armeringsstation', icon: <ArmeringIcon />, initialProps: { iconUrl: createIcon(ArmeringSVG) } },
        { type: 'saw-shed', name: 'Sågbod', icon: <SagbodIcon />, initialProps: { iconUrl: createIcon(SagbodSVG) } },
        { type: 'loading-dock', name: 'Intagsbrygga', icon: <IntagsbryggaIcon />, initialProps: { iconUrl: createIcon(IntagsbryggaSVG) } },
    ]
};
