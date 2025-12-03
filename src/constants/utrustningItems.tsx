
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
const KranSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#FFD600" stroke="#000" stroke-width="2" stroke-dasharray="4 4"/><path d="M32 10 L32 54 M10 32 L54 32" stroke="#000" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="#000"/></svg>`;
const ElcentralSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FFAB00" stroke="#000" stroke-width="2" rx="4"/><path d="M30 15 L20 35 H40 L30 55" stroke="#000" stroke-width="6" fill="none" stroke-linejoin="round"/></svg>`;
const VattenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#2979FF" stroke="#fff" stroke-width="2" rx="4"/><path d="M15 40 V25 H35 C42 25 45 28 45 35 V38" stroke="#fff" stroke-width="5" fill="none"/><path d="M12 25 H18" stroke="#fff" stroke-width="5"/><path d="M22 20 V25" stroke="#fff" stroke-width="4"/><path d="M45 44 L45 54" stroke="#fff" stroke-width="3" stroke-dasharray="4 2"/></svg>`;
const BelysningsmastSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="16" fill="#FFFF00" stroke="#000" stroke-width="2"/><path d="M32 8 L32 16 M32 48 L32 56 M8 32 L16 32 M48 32 L56 32 M14 14 L20 20 M44 44 L50 50 M14 50 L20 44 M44 20 L50 14" stroke="#FFFF00" stroke-width="4" stroke-linecap="round"/></svg>`;
const GasSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M20 15 h24 v40 h-24 z" fill="#FFEA00" stroke="#000" stroke-width="2"/><path d="M32 5 v10 M25 10 h14" stroke="#000" stroke-width="4"/><text x="32" y="45" font-size="16" font-weight="bold" text-anchor="middle">GAS</text></svg>`;

// --- Icon Components ---
const KranIcon = () => <SvgIcon svg={KranSVG} />;
const ElcentralIcon = () => <SvgIcon svg={ElcentralSVG} />;
const VattenIcon = () => <SvgIcon svg={VattenSVG} />;
const BelysningsmastIcon = () => <SvgIcon svg={BelysningsmastSVG} />;
const GasIcon = () => <SvgIcon svg={GasSVG} />;

// --- Category Export ---
export const utrustningCategory: { name: string; items: LibraryItem[] } = {
    name: "Utrustning",
    items: [
        { type: 'crane', name: 'Kran', icon: <KranIcon />, initialProps: { radius: 100, iconUrl: createIcon(KranSVG) } },
        { type: 'elcentral', name: 'Elcentral', icon: <ElcentralIcon />, initialProps: { iconUrl: createIcon(ElcentralSVG) } },
        { type: 'vatten', name: 'Vattenutkastare', icon: <VattenIcon />, initialProps: { iconUrl: createIcon(VattenSVG) } },
        { type: 'gas', name: 'Gasförvaring', icon: <GasIcon />, initialProps: { iconUrl: createIcon(GasSVG) } },
        { type: 'belysningsmast', name: 'Belysningsmast', icon: <BelysningsmastIcon />, initialProps: { iconUrl: createIcon(BelysningsmastSVG) } },
    ]
};
