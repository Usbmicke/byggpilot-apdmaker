
import React from 'react';
import { LibraryItem } from '../types';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
const StaketSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#00C853" stroke-width="3" stroke-linecap="round" stroke-dasharray="4, 4"><path d="M2 12h20"/></svg>`;
const GangvagSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#2979FF" stroke-width="3" stroke-linecap="round" stroke-dasharray="1, 6"><path d="M2 12h20"/></svg>`;
const ByggtrafikSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#FFEB3B" stroke-width="5" stroke-linecap="round" stroke-dasharray="1, 7"><path d="M2 12h20"/></svg>`;
const SchaktSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="rgba(255, 23, 68, 0.2)" stroke="#FF1744" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
const GrindSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Posts -->
  <rect x="2" y="34" width="10" height="10" fill="#333"/>
  <rect x="52" y="34" width="10" height="10" fill="#333"/>
  <!-- Wings (Angled Open ~70 deg) -->
  <!-- Left Wing: Starts 12,34. Ends inwards and up. -->
  <line x1="12" y1="34" x2="20" y2="4" stroke="#00E676" stroke-width="5" stroke-linecap="round"/>
  <!-- Right Wing: Starts 52,34. Ends inwards and up. -->
  <line x1="52" y1="34" x2="44" y2="4" stroke="#00E676" stroke-width="5" stroke-linecap="round"/>
  <!-- Swing Arcs (Dotted) -->
  <path d="M12 34 A 30 30 0 0 1 42 34" stroke="#00E676" stroke-width="1.5" stroke-dasharray="3,3" fill="none" opacity="0.5"/>
  <path d="M52 34 A 30 30 0 0 0 22 34" stroke="#00E676" stroke-width="1.5" stroke-dasharray="3,3" fill="none" opacity="0.5"/>
</svg>`;
const PennaSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
const BuildingSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-8a2 2 0 012-2h4a2 2 0 012 2v8"/></svg>`;


// --- Icon Components ---
const StaketIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: StaketSVG }} />;
const GangvagIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: GangvagSVG }} />;
const ByggtrafikIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: ByggtrafikSVG }} />;
const SchaktIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: SchaktSVG }} />;
const GrindIcon = () => <SvgIcon svg={GrindSVG} />;
const PennaIcon = () => <div className="w-full h-full p-1 text-slate-400" dangerouslySetInnerHTML={{ __html: PennaSVG }} />;
const BuildingIcon = () => <div className="w-full h-full p-1 text-gray-700" dangerouslySetInnerHTML={{ __html: BuildingSVG }} />;

// --- Category Export ---
export const ritverktygCategory: { name: string; items: LibraryItem[] } = {
    name: "Ritverktyg",
    items: [
        { type: 'building', name: 'Byggnad (3D-grund)', icon: <BuildingIcon />, initialProps: { points: [], stroke: '#94A3B8', strokeWidth: 0.2, fill: 'rgba(148, 163, 184, 0.2)' } },
        { type: 'fence', name: 'Staket/Byggstängsel', icon: <StaketIcon />, initialProps: { points: [], stroke: '#00C853', strokeWidth: 3.0, dash: [2.0, 6.0] } }, // 3.0m width, gaps account for 4.5m backing
        { type: 'walkway', name: 'Gångväg', icon: <GangvagIcon />, initialProps: { points: [], stroke: '#2979FF', strokeWidth: 2.5, dash: [1.0, 5.0] } }, // 2.5m width, gaps account for 3.75m backing
        { type: 'construction-traffic', name: 'Byggtrafik', icon: <ByggtrafikIcon />, initialProps: { points: [], stroke: 'rgba(255, 235, 59, 1.0)', strokeWidth: 5.0, dash: [4.0, 10.0] } }, // 5m width, gaps account for 7.5m backing
        { type: 'pen', name: 'Penna (Frihand)', icon: <PennaIcon />, initialProps: { points: [], stroke: '#475569', strokeWidth: 1.0, tension: 0.5 } }, // 1.0m width, Slate 600
        { type: 'schakt', name: 'Schakt', icon: <SchaktIcon />, initialProps: { width: 5.0, height: 5.0, fill: 'rgba(255, 23, 68, 0.2)', stroke: '#FF1744', strokeWidth: 0.2 } },
        { type: 'gate', name: 'Grind', icon: <GrindIcon />, iconUrl: createIcon(GrindSVG), initialProps: { width: 6.0, height: 1.5 } },
    ]
};
