
import React from 'react';
import { LibraryItem } from '../types';
import { createIcon, SvgIcon } from './itemHelpers';
import PpeImage from '@/assets/ikoner/ppe.png';
import AtersamlingsplatsImage from '@/assets/ikoner/atersamlingsplats.png';
import BrandslackareImage from '@/assets/ikoner/brandslackare.png';

const SHARED_SIZE = { width: 1.0, height: 1.0 };

// --- SVG Definitions ---
const ForstaHjalpenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M32 12 V52 M12 32 H52" stroke="#FFFFFF" stroke-width="12" stroke-linecap="square"/></svg>`;
const HjartstartareSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M32 18 C 20 5, 10 20, 32 48 C 54 20, 44 5, 32 18" fill="#fff"/><path d="M36 20 L28 30 L34 30 L30 40" stroke="#00C853" stroke-width="3" fill="none"/></svg>`;
const BrandpostSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FF1744" stroke="#fff" stroke-width="2" rx="4"/><rect x="26" y="15" width="12" height="40" fill="#fff" /><rect x="20" y="20" width="6" height="8" fill="#fff"/><rect x="38" y="20" width="6" height="8" fill="#fff"/><circle cx="32" cy="15" r="6" fill="#fff"/></svg>`;
const OgonduschSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M10 32 Q32 12 54 32 Q32 52 10 32 Z" stroke="#fff" stroke-width="3" fill="none"/><circle cx="32" cy="32" r="7" fill="#fff"/><path d="M32 8 L32 18" stroke="#fff" stroke-width="4"/><path d="M32 18 L26 24 M32 18 L38 24" stroke="#fff" stroke-width="3"/><circle cx="22" cy="26" r="2" fill="#fff"/><circle cx="32" cy="26" r="2" fill="#fff"/><circle cx="42" cy="26" r="2" fill="#fff"/></svg>`;
const SaneringsutrustningSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FFC107" stroke="#000" stroke-width="2" rx="4"/><path d="M16 50 C 20 44, 28 44, 32 50 S 44 56, 48 50" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M20 48 L44 16 L48 20 L24 52 Z" fill="#A1887F"/><rect x="42" y="12" width="8" height="4" fill="#5D4037"/></svg>`;
const RaddningsutrustningSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#1976D2" stroke="#fff" stroke-width="2" rx="4"/><circle cx="32" cy="32" r="18" fill="#fff" stroke="#FF5252" stroke-width="8"/><path d="M32 10 L32 20 M32 44 L32 54 M10 32 L20 32 M44 32 L54 32" stroke="#FF5252" stroke-width="4" stroke-linecap="round"/></svg>`;


// --- Icon Components ---
const ForstaHjalpenIcon = () => <SvgIcon svg={ForstaHjalpenSVG} />;
const HjartstartareIcon = () => <SvgIcon svg={HjartstartareSVG} />;
const AtersamlingsplatsIcon = () => <img src={AtersamlingsplatsImage} alt="Återsamlingsplats" className="w-full h-full object-contain" />;
const BrandslackareIcon = () => <img src={BrandslackareImage} alt="Brandsläckare" className="w-full h-full object-contain" />;
const BrandpostIcon = () => <SvgIcon svg={BrandpostSVG} />;
const OgonduschIcon = () => <SvgIcon svg={OgonduschSVG} />;
const SaneringsutrustningIcon = () => <SvgIcon svg={SaneringsutrustningSVG} />;
const RaddningsutrustningIcon = () => <SvgIcon svg={RaddningsutrustningSVG} />;
const PpeIcon = () => <img src={PpeImage} alt="Personlig skyddsutrustning" className="w-full h-full object-contain" />;


// --- Category Export ---
export const sakerhetCategory: { name: string; items: LibraryItem[] } = {
    name: "Säkerhet",
    items: [
        { type: 'forsta-hjalpen', name: 'Första hjälpen', icon: <ForstaHjalpenIcon />, iconUrl: createIcon(ForstaHjalpenSVG), initialProps: SHARED_SIZE },
        { type: 'hjartstartare', name: 'Hjärtstartare', icon: <HjartstartareIcon />, iconUrl: createIcon(HjartstartareSVG), initialProps: SHARED_SIZE },
        { type: 'atersamlingsplats', name: 'Återsamlingsplats', icon: <AtersamlingsplatsIcon />, iconUrl: AtersamlingsplatsImage, initialProps: SHARED_SIZE },
        { type: 'brandslackare', name: 'Brandsläckare', icon: <BrandslackareIcon />, iconUrl: BrandslackareImage, initialProps: SHARED_SIZE },
        { type: 'brandpost', name: 'Brandpost', icon: <BrandpostIcon />, iconUrl: createIcon(BrandpostSVG), initialProps: SHARED_SIZE },
        { type: 'ogondusch', name: 'Ögondusch', icon: <OgonduschIcon />, iconUrl: createIcon(OgonduschSVG), initialProps: SHARED_SIZE },
        { type: 'saneringsutrustning', name: 'Saneringsutrustning', icon: <SaneringsutrustningIcon />, iconUrl: createIcon(SaneringsutrustningSVG), initialProps: SHARED_SIZE },
        { type: 'raddningsutrustning', name: 'Räddningsutrustning', icon: <RaddningsutrustningIcon />, iconUrl: createIcon(RaddningsutrustningSVG), initialProps: SHARED_SIZE },
        { type: 'ppe', name: 'Personlig skyddsutrustning', icon: <PpeIcon />, iconUrl: PpeImage, initialProps: SHARED_SIZE },
    ]
};
