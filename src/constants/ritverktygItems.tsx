
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
// KORRIGERING: Ändrat färgerna i SVG-ikonerna för att matcha de nya linjefärgerna.
const StaketSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#424242" stroke-width="3" stroke-linecap="round" stroke-dasharray="4, 4"><path d="M2 12h20"/></svg>`;
const GangvagSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#2979FF" stroke-width="3" stroke-linecap="round" stroke-dasharray="1, 6"><path d="M2 12h20"/></svg>`;
const ByggtrafikSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#FFD600" stroke-width="4" stroke-linecap="round"><path d="M2 12h20"/></svg>`;
const SchaktSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="rgba(255, 23, 68, 0.2)" stroke="#FF1744" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
const TextSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`;
const GrindSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M5 10 H30 V54 H5 Z M34 10 H59 V54 H34 Z" stroke="#00E676" stroke-width="4" fill="none"/><path d="M5 10 L30 54 M30 10 L5 54 M34 10 L59 54 M59 10 L34 54" stroke="#00E676" stroke-width="2"/></svg>`;
const PennaSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;


// --- Icon Components ---
const StaketIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: StaketSVG }} />;
const GangvagIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: GangvagSVG }} />;
const ByggtrafikIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: ByggtrafikSVG }} />;
const SchaktIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: SchaktSVG }} />;
const TextIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: TextSVG }} />;
const GrindIcon = () => <SvgIcon svg={GrindSVG} />;
const PennaIcon = () => <div className="w-full h-full p-1 text-red-500" dangerouslySetInnerHTML={{ __html: PennaSVG }} />;

// --- Category Export ---
export const ritverktygCategory: { name: string; items: LibraryItem[] } = {
    name: "Ritverktyg",
    items: [
        { type: 'fence', name: 'Staket/Byggstängsel', icon: <StaketIcon />, initialProps: { points: [], stroke: '#424242', strokeWidth: 5, dash: [10, 10] } }, // Mörkgrå, streckad
        { type: 'walkway', name: 'Gångväg', icon: <GangvagIcon />, initialProps: { points: [], stroke: '#2979FF', strokeWidth: 8, dash: [1, 15] } }, // Blå, bredare, streckad
        { type: 'construction-traffic', name: 'Byggtrafik', icon: <ByggtrafikIcon />, initialProps: { points: [], stroke: '#FFD600', strokeWidth: 10, dash: [20, 8, 2, 8] } }, // Gul, bredast, unikt mönster
        { type: 'pen', name: 'Penna (Frihand)', icon: <PennaIcon />, initialProps: { points: [], stroke: '#ef4444', strokeWidth: 3, tension: 0.5 } }, // Röd frihand
        { type: 'schakt', name: 'Schakt', icon: <SchaktIcon />, initialProps: { width: 150, height: 100, fill: 'rgba(255, 23, 68, 0.2)', stroke: '#FF1744', strokeWidth: 2 } },
        { type: 'text', name: 'Text', icon: <TextIcon />, initialProps: { text: "TEXT", fontSize: 24, fill: "#FFFFFF" } },
        { type: 'gate', name: 'Grind', icon: <GrindIcon />, iconUrl: createIcon(GrindSVG) },
    ]
};
