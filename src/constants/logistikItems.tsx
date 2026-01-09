
import React from 'react';
import { LibraryItem } from '../types';
import { createIcon, SvgIcon } from './itemHelpers';

// --- SVG Definitions ---
// Container 10m³: Ratio ~2:1
const ContainerSVG10 = `<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="46" x="2" y="2" fill="#76FF03" stroke="#000" stroke-width="2" rx="4"/><text x="50" y="32" font-size="28" fill="#000" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">10m³</text></svg>`;
// Container 30m³: Ratio ~2.6:1 (6.5m / 2.5m)
const ContainerSVG30 = `<svg viewBox="0 0 130 50" xmlns="http://www.w3.org/2000/svg"><rect width="126" height="46" x="2" y="2" fill="#00E5FF" stroke="#000" stroke-width="2" rx="4"/><text x="65" y="32" font-size="28" fill="#000" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">30m³</text></svg>`;
// Tipp (Open): Ratio ~1.5:1
const TippContainerSVG = `<svg viewBox="0 0 75 50" xmlns="http://www.w3.org/2000/svg"><path d="M4 10 L71 10 L65 46 H10 Z" fill="#2962FF" stroke="#000" stroke-width="2"/><text x="37.5" y="35" font-size="14" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">ÖPPEN</text></svg>`;
// Tipp (Closed): Ratio ~1.5:1
const TippContainerStangdSVG = `<svg viewBox="0 0 75 50" xmlns="http://www.w3.org/2000/svg"><path d="M4 10 L71 10 L65 46 H10 Z" fill="#1565C0" stroke="#000" stroke-width="2"/><rect x="4" y="6" width="67" height="6" fill="#1565C0" stroke="#000" stroke-width="2"/><text x="37.5" y="35" font-size="14" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">STÄNGD</text></svg>`;
const InfartSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="10" width="60" height="44" fill="#00C853" rx="4" stroke="#000" stroke-width="2"/><path d="M15 32 H49 M35 18 L49 32 L35 46" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><text x="32" y="62" font-size="10" font-weight="bold" text-anchor="middle">INFART</text></svg>`;
const ParkeringSVG = `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" x="1" y="1" fill="#2962FF" rx="8" stroke="#000" stroke-width="2"/><text x="25" y="35" font-size="36" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">P</text></svg>`;
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

const CONTAINER_10_SIZE = { width: 4.5, height: 2.2 };
const CONTAINER_30_SIZE = { width: 6.5, height: 2.5 }; // Adjusted to 6.5m (Standard large skip)
const TIPP_SIZE = { width: 4.5, height: 2.5 }; // Significantly Larger
const UPPLAG_SIZE = { width: 4.0, height: 3.0 }; // Generic pile size
const LOSSNING_SIZE = { width: 10.0, height: 4.0 }; // Truck unloading zone
const VANDPLAN_SIZE = { width: 12.0, height: 12.0 }; // Turning circle
const INFART_SIZE = { width: 3.0, height: 3.0 }; // Standardized Icon
const PARKERING_SIZE = { width: 4.0, height: 4.0 }; // Standard Square Parking Sign

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
