
import React from 'react';
import { LibraryItem } from '../../types/index';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
const ForstaHjalpenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M32 12 V52 M12 32 H52" stroke="#FFFFFF" stroke-width="12" stroke-linecap="square"/></svg>`;
const HjartstartareSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M32 18 C 20 5, 10 20, 32 48 C 54 20, 44 5, 32 18" fill="#fff"/><path d="M36 20 L28 30 L34 30 L30 40" stroke="#00C853" stroke-width="3" fill="none"/></svg>`;
const AtersamlingsplatsSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><circle cx="32" cy="32" r="14" fill="#fff"/><path d="M32 18 V46 M18 32 H46" stroke="#00C853" stroke-width="0"/><g fill="#00C853"><circle cx="32" cy="28" r="3"/><path d="M28 32 h8 v8 h-8 z"/></g><path d="M8 14 L14 8 M56 14 L50 8 M8 50 L14 56 M56 50 L50 56" stroke="#fff" stroke-width="4"/></svg>`;
const BrandpostSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FF1744" stroke="#fff" stroke-width="2" rx="4"/><rect x="26" y="15" width="12" height="40" fill="#fff" /><rect x="20" y="20" width="6" height="8" fill="#fff"/><rect x="38" y="20" width="6" height="8" fill="#fff"/><circle cx="32" cy="15" r="6" fill="#fff"/></svg>`;
const OgonduschSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M10 32 Q32 12 54 32 Q32 52 10 32 Z" stroke="#fff" stroke-width="3" fill="none"/><circle cx="32" cy="32" r="7" fill="#fff"/><path d="M32 8 L32 18" stroke="#fff" stroke-width="4"/><path d="M32 18 L26 24 M32 18 L38 24" stroke="#fff" stroke-width="3"/><circle cx="22" cy="26" r="2" fill="#fff"/><circle cx="32" cy="26" r="2" fill="#fff"/><circle cx="42" cy="26" r="2" fill="#fff"/></svg>`;
const SaneringsutrustningSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FFC107" stroke="#000" stroke-width="2" rx="4"/><path d="M16 50 C 20 44, 28 44, 32 50 S 44 56, 48 50" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M20 48 L44 16 L48 20 L24 52 Z" fill="#A1887F"/><rect x="42" y="12" width="8" height="4" fill="#5D4037"/></svg>`;
const RaddningsutrustningSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#1976D2" stroke="#fff" stroke-width="2" rx="4"/><circle cx="32" cy="32" r="18" fill="#fff" stroke="#FF5252" stroke-width="8"/><path d="M32 10 L32 20 M32 44 L32 54 M10 32 L20 32 M44 32 L54 32" stroke="#FF5252" stroke-width="4" stroke-linecap="round"/></svg>`;


// --- Icon Components ---
const ForstaHjalpenIcon = () => <SvgIcon svg={ForstaHjalpenSVG} />;
const HjartstartareIcon = () => <SvgIcon svg={HjartstartareSVG} />;
const AtersamlingsplatsIcon = () => <img src="/assets/ikoner/atersamlingsplats.png" alt="Återsamlingsplats" className="w-full h-full object-cover" />;
const BrandslackareIcon = () => <img src="/assets/ikoner/brandslackare.png" alt="Brandsläckare" className="w-full h-full object-cover" />;
const BrandpostIcon = () => <SvgIcon svg={BrandpostSVG} />;
const OgonduschIcon = () => <SvgIcon svg={OgonduschSVG} />;
const SaneringsutrustningIcon = () => <SvgIcon svg={SaneringsutrustningSVG} />;
const RaddningsutrustningIcon = () => <SvgIcon svg={RaddningsutrustningSVG} />;

// --- Category Export ---
export const sakerhetCategory: { name: string; items: LibraryItem[] } = {
    name: "Säkerhet",
    items: [
        { type: 'forsta-hjalpen', name: 'Första hjälpen', icon: <ForstaHjalpenIcon />, initialProps: { iconUrl: createIcon(ForstaHjalpenSVG) } },
        { type: 'hjartstartare', name: 'Hjärtstartare', icon: <HjartstartareIcon />, initialProps: { iconUrl: createIcon(HjartstartareSVG) } },
        { type: 'atersamlingsplats', name: 'Återsamlingsplats', icon: <AtersamlingsplatsIcon />, initialProps: { iconUrl: '/assets/ikoner/atersamlingsplats.png' } },
        { type: 'brandslackare', name: 'Brandsläckare', icon: <BrandslackareIcon />, initialProps: { iconUrl: '/assets/ikoner/brandslackare.png' } },
        { type: 'brandpost', name: 'Brandpost', icon: <BrandpostIcon />, initialProps: { iconUrl: createIcon(BrandpostSVG) } },
        { type: 'ogondusch', name: 'Ögondusch', icon: <OgonduschIcon />, initialProps: { iconUrl: createIcon(OgonduschSVG) } },
        { type: 'saneringsutrustning', name: 'Saneringsutrustning', icon: <SaneringsutrustningIcon />, initialProps: { iconUrl: createIcon(SaneringsutrustningSVG) } },
        { type: 'raddningsutrustning', name: 'Räddningsutrustning', icon: <RaddningsutrustningIcon />, initialProps: { iconUrl: createIcon(RaddningsutrustningSVG) } },
    ]
};
