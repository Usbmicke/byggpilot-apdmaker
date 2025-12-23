
import React from 'react';
import { LibraryItem } from '../types';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
const ContainerSVG10 = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="28" x="7" y="18" fill="#76FF03" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="38" font-size="10" fill="#000" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">10m³</text></svg>`;
const ContainerSVG30 = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="24" x="2" y="20" fill="#00E5FF" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="37" font-size="12" fill="#000" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">30m³</text></svg>`;
const TippContainerSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M8 20 L56 20 L50 52 H14 Z" fill="#2962FF" stroke="#000" stroke-width="2"/><path d="M8 20 L4 12 H60 L56 20" fill="#2962FF" stroke="#000" stroke-width="2"/><text x="32" y="42" font-size="10" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">ÖPPEN</text></svg>`;
const TippContainerStangdSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M8 20 L56 20 L50 52 H14 Z" fill="#2962FF" stroke="#000" stroke-width="2"/><rect x="8" y="14" width="48" height="6" fill="#2962FF" stroke="#000" stroke-width="2"/><text x="32" y="42" font-size="10" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">STÄNGD</text></svg>`;
const InfartSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="10" width="60" height="44" fill="#00C853" rx="4" stroke="#000" stroke-width="2"/><path d="M15 32 H49 M35 18 L49 32 L35 46" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><text x="32" y="62" font-size="10" font-weight="bold" text-anchor="middle">INFART</text></svg>`;
const ParkeringSVG = `<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="46" x="2" y="2" fill="#2962FF" rx="8" stroke="#000" stroke-width="2"/><text x="50" y="28" font-size="36" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" dy=".35em">P</text></svg>`;
// Optimized Square Icon
const ParkeringIconSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#2962FF" rx="8" stroke="#000" stroke-width="3"/><text x="32" y="44" font-size="40" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">P</text></svg>`;
const UpplagSVG = `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><rect width="76" height="56" x="2" y="2" fill="#D500F9" rx="4" stroke="#000" stroke-width="2"/><path d="M10 10 L70 50 M70 10 L10 50" stroke="#fff" stroke-width="4" opacity="0.5"/><text x="40" y="34" font-size="14" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" dy=".3em">UPPLAG</text></svg>`;
const LossningSVG = `<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><rect width="76" height="46" x="2" y="2" fill="#FFD600" stroke="#000" stroke-width="4"/><path d="M10 2 L40 48 M40 2 L70 48" stroke="#000" stroke-width="2"/></svg>`;
const VandplanSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#E0E0E0" stroke="#000" stroke-width="2" stroke-dasharray="4 2"/><path d="M45 40 A 15 15 0 1 1 35 15 L 35 25 L 50 10 L 35 0 L 35 10 A 20 20 0 1 0 50 40 Z" fill="#000"/></svg>`;

// --- Icon Components ---
const Container10Icon = () => <SvgIcon svg={ContainerSVG10} />;
const Container30Icon = () => <SvgIcon svg={ContainerSVG30} />;
const TippContainerIcon = () => <SvgIcon svg={TippContainerSVG} />;
const TippContainerStangdIcon = () => <SvgIcon svg={TippContainerStangdSVG} />;
const InfartIcon = () => <SvgIcon svg={InfartSVG} />;
const ParkeringIcon = () => <SvgIcon svg={ParkeringIconSVG} />;
const UpplagIcon = () => <SvgIcon svg={UpplagSVG} />;
const LossningIcon = () => <SvgIcon svg={LossningSVG} />;
const VandplanIcon = () => <SvgIcon svg={VandplanSVG} />;

const CONTAINER_10_SIZE = { width: 1.5, height: 1.0 }; // Reduced "a lot" from 3.0x2.4
const CONTAINER_30_SIZE = { width: 3.0, height: 1.0 }; // Reduced "a lot" from 6.0x2.4
const TIPP_SIZE = { width: 1.5, height: 1.0 }; // Aligning with others
const UPPLAG_SIZE = { width: 1.0, height: 0.8 }; // Tiny, smaller than WC
const LOSSNING_SIZE = { width: 1.5, height: 1.0 }; // Comparable to small shed
const VANDPLAN_SIZE = { width: 1.0, height: 1.0 }; // Reduced to Standard Icon
const INFART_SIZE = { width: 1.0, height: 1.0 }; // Reduced to Standard Icon
const PARKERING_SIZE = { width: 1.0, height: 1.0 }; // Reduced to Standard Icon

// --- Category Export ---
export const logistikCategory: { name: string; items: LibraryItem[] } = {
    name: "Logistik",
    items: [
        { type: 'container-10', name: 'Container 10m³', icon: <Container10Icon />, iconUrl: createIcon(ContainerSVG10), initialProps: CONTAINER_10_SIZE },
        { type: 'container-30', name: 'Container 30m³', icon: <Container30Icon />, iconUrl: createIcon(ContainerSVG30), initialProps: CONTAINER_30_SIZE },
        { type: 'tippcontainer', name: 'Tippcontainer (Öppen)', icon: <TippContainerIcon />, iconUrl: createIcon(TippContainerSVG), initialProps: TIPP_SIZE },
        { type: 'tippcontainer-stangd', name: 'Tippcontainer (Stängd)', icon: <TippContainerStangdIcon />, iconUrl: createIcon(TippContainerStangdSVG), initialProps: TIPP_SIZE },
        { type: 'upplag', name: 'Materialupplag', icon: <UpplagIcon />, iconUrl: createIcon(UpplagSVG), initialProps: UPPLAG_SIZE },
        { type: 'lossning', name: 'Lossningszon', icon: <LossningIcon />, iconUrl: createIcon(LossningSVG), initialProps: LOSSNING_SIZE },
        { type: 'vandplan', name: 'Vändplan', icon: <VandplanIcon />, iconUrl: createIcon(VandplanSVG), initialProps: VANDPLAN_SIZE },
        { type: 'infart', name: 'Infart', icon: <InfartIcon />, iconUrl: createIcon(InfartSVG), initialProps: INFART_SIZE },
        { type: 'parkering', name: 'Parkering', icon: <ParkeringIcon />, iconUrl: createIcon(ParkeringSVG), initialProps: PARKERING_SIZE },
    ]
};
