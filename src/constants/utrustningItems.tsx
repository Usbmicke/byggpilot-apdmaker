
import React from 'react';
import { LibraryItem } from '../types/index';
import { createIcon, SvgIcon } from './itemHelpers';
import CraneIcon from '../components/icons/craneIcon';

// --- SVG Definitions ---
const KranSVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Simple Orange Dashed Circle representing reach -->
  <circle cx="50" cy="50" r="45" stroke="#F97316" stroke-width="2" stroke-dasharray="5 5"/>
  <!-- Center Point / Tower -->
  <circle cx="50" cy="50" r="5" fill="#F97316"/>
  <!-- Simple Cross -->
  <line x1="50" y1="20" x2="50" y2="80" stroke="#F97316" stroke-width="2"/>
  <line x1="20" y1="50" x2="80" y2="50" stroke="#F97316" stroke-width="2"/>
</svg>`;

const ElcentralSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FFAB00" stroke="#000" stroke-width="2" rx="4"/><path d="M30 15 L20 35 H40 L30 55" stroke="#000" stroke-width="6" fill="none" stroke-linejoin="round"/></svg>`;
const VattenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#2979FF" stroke="#fff" stroke-width="2" rx="4"/><path d="M15 40 V25 H35 C42 25 45 28 45 35 V38" stroke="#fff" stroke-width="5" fill="none"/><path d="M12 25 H18" stroke="#fff" stroke-width="5"/><path d="M22 20 V25" stroke="#fff" stroke-width="4"/><path d="M45 44 L45 54" stroke="#fff" stroke-width="3" stroke-dasharray="4 2"/></svg>`;
const GasSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M20 15 h24 v40 h-24 z" fill="#FFEA00" stroke="#000" stroke-width="2"/><path d="M32 5 v10 M25 10 h14" stroke="#000" stroke-width="4"/><text x="32" y="45" font-size="16" font-weight="bold" text-anchor="middle">GAS</text></svg>`;
const LjusmastSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="none" stroke="#E91E63" stroke-width="3"/><rect x="31" y="10" width="2" height="50" fill="#90A4AE"/><path d="M24 10 H40 L36 4 H28 Z" fill="#CFD8DC" stroke="#263238" stroke-width="1"/><circle cx="32" cy="14" r="5" fill="#FFEB3B"/><path d="M20 20 L26 16 M44 20 L38 16 M32 24 L32 19" stroke="#FFEB3B" stroke-width="2" stroke-linecap="round"/></svg>`;

// --- Icon Components ---
const ElcentralIcon = () => <SvgIcon svg={ElcentralSVG} />;
const VattenIcon = () => <SvgIcon svg={VattenSVG} />;
const LjusmastIcon = () => <SvgIcon svg={LjusmastSVG} />;
const GasIcon = () => <SvgIcon svg={GasSVG} />;

const UNIFORM_SIZE = { width: 3.0, height: 3.0 };

// --- Category Export ---
export const utrustningCategory: { name: string; items: LibraryItem[] } = {
    name: "Utrustning",
    items: [
        {
            id: 'crane-std',
            type: 'crane',
            name: 'Kran',
            icon: <CraneIcon />,
            iconUrl: createIcon(KranSVG),
            initialProps: {
                width: 3.0,
                height: 3.0,
                radius: 30,
            }
        },
        { id: 'el-std', type: 'elcentral', name: 'Elcentral', icon: <ElcentralIcon />, iconUrl: createIcon(ElcentralSVG), initialProps: UNIFORM_SIZE },
        { id: 'vatten-std', type: 'vatten', name: 'Vattenutkastare', icon: <VattenIcon />, iconUrl: createIcon(VattenSVG), initialProps: UNIFORM_SIZE },
        { id: 'gas-std', type: 'gas', name: 'Gasförvaring', icon: <GasIcon />, iconUrl: createIcon(GasSVG), initialProps: UNIFORM_SIZE },
        { id: 'ljus-std', type: 'belysningsmast', name: 'Belysningsmast', icon: <LjusmastIcon />, iconUrl: createIcon(LjusmastSVG), initialProps: UNIFORM_SIZE },
    ]
};
