
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

const SHARED_SIZE = { width: 40, height: 40 };

// --- SVG Definitions ---
const UtrymningspilSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" rx="2" stroke="#fff" stroke-width="2"/><path d="M10 32 H50 M35 18 L50 32 L35 46" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const VarningSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 4 L4 58 H60 Z" fill="#FFEA00" stroke="#000" stroke-width="4" stroke-linejoin="round"/><path d="M32 20 V40 M32 48 V50" stroke="#000" stroke-width="6" stroke-linecap="round"/></svg>`;
const ForbudSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#fff" stroke="#D50000" stroke-width="8"/><path d="M14 14 L50 50" stroke="#D50000" stroke-width="8"/></svg>`;
const ParkeringForbjudenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#2962FF" stroke="#D50000" stroke-width="6"/><path d="M14 50 L50 14" stroke="#D50000" stroke-width="6"/></svg>`;

// --- Icon Components ---
const UtrymningspilIcon = () => <SvgIcon svg={UtrymningspilSVG} />;
const VarningIcon = () => <SvgIcon svg={VarningSVG} />;
const ForbudIcon = () => <SvgIcon svg={ForbudSVG} />;
const ParkeringForbjudenIcon = () => <SvgIcon svg={ParkeringForbjudenSVG} />;

// --- Category Export ---
export const skyltarCategory: { name: string; items: LibraryItem[] } = {
    name: "Skyltar & Hänvisning",
    items: [
         { type: 'utrymning', name: 'Utrymningspil', icon: <UtrymningspilIcon />, iconUrl: createIcon(UtrymningspilSVG), initialProps: SHARED_SIZE },
         { type: 'varning', name: 'Varning', icon: <VarningIcon />, iconUrl: createIcon(VarningSVG), initialProps: SHARED_SIZE },
         { type: 'forbud', name: 'Tillträde förbjudet', icon: <ForbudIcon />, iconUrl: createIcon(ForbudSVG), initialProps: SHARED_SIZE },
         { type: 'parkering-forbjuden', name: 'Parkering förbjuden', icon: <ParkeringForbjudenIcon />, iconUrl: createIcon(ParkeringForbjudenSVG), initialProps: SHARED_SIZE },
    ]
};
