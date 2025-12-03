
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---

// --- Icon Components ---
const BelysningsmastIcon = () => <img src="/assets/ikoner/belysningsmast.png" alt="Belysningsmast" className="w-full h-full object-cover" />;


// --- Category Export ---
export const elOchBelysningCategory: { name: string; items: LibraryItem[] } = {
    name: "El & Belysning",
    items: [
        { type: 'belysningsmast', name: 'Belysningsmast', icon: <BelysningsmastIcon />, initialProps: { iconUrl: '/assets/ikoner/belysningsmast.png' } },
    ]
};
