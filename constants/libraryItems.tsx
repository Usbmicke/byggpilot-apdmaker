
import React from 'react';
import { LibraryItem } from '../types/index';

// --- Helper to create data URLs ---
const createIcon = (svgString: string) => `data:image/svg+xml;base64,${btoa(svgString)}`;

// --- SVG Definitions for clarity and reuse ---

// Etablering (Text inside icons)
const BodSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#F97316" stroke="#FFFFFF" stroke-width="3" rx="2"/><text x="32" y="40" font-size="16" fill="white" font-family="sans-serif" font-weight="bold" text-anchor="middle">BOD</text></svg>`;
const WCSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#3B82F6"/><text x="32" y="44" font-size="28" fill="white" font-family="sans-serif" font-weight="bold" text-anchor="middle">WC</text></svg>`;
const KontorSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#F97316" stroke="#FFFFFF" stroke-width="3" rx="2"/><text x="32" y="40" font-size="12" fill="white" font-family="sans-serif" font-weight="bold" text-anchor="middle">KONTOR</text></svg>`;

// Logistik (Vibrant colors)
const ContainerSVG10 = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="28" x="7" y="18" fill="#84cc16" stroke="#FFFFFF" stroke-width="2" rx="2"/><text x="32" y="38" font-size="10" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" text-anchor="middle">C 10m³</text></svg>`;
const ContainerSVG30 = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="24" x="2" y="20" fill="#38bdf8" stroke="#FFFFFF" stroke-width="2" rx="2"/><text x="32" y="37" font-size="12" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" text-anchor="middle">C 30m³</text></svg>`;
const InfartSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M10 32 H54 M40 18 L54 32 L40 46" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ParkeringSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#0ea5e9" rx="4"/><text x="32" y="46" font-size="40" fill="white" font-family="sans-serif" font-weight="bold" text-anchor="middle">P</text></svg>`;
const UpplagSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#facc15" rx="4"/><rect x="8" y="50" width="48" height="6" fill="#a16207" rx="2"/><rect x="12" y="26" width="20" height="24" fill="#fb923c" stroke="#fff" stroke-width="2" rx="2"/><rect x="36" y="34" width="16" height="16" fill="#fdba74" stroke="#fff" stroke-width="2" rx="2"/></svg>`;

// Säkerhet (Standard symbols)
const ForstaHjalpenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#10B981" rx="4"/><path d="M32 12 V52 M12 32 H52" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/></svg>`;
const AtersamlingsplatsSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#10B981" rx="4"/><path d="M8 18 V8 H18 L8 18 Z" fill="#FFFFFF"/><path d="M56 18 V8 H46 L56 18 Z" fill="#FFFFFF"/><path d="M8 46 V56 H18 L8 46 Z" fill="#FFFFFF"/><path d="M56 46 V56 H46 L56 46 Z" fill="#FFFFFF"/><g fill="#FFFFFF"><circle cx="32" cy="29" r="5"/><path d="M25 35 a7 7 0 0 1 14 0 v12 h-14 Z"/><circle cx="22" cy="33" r="3"/><path d="M19 37 a3 3 0 0 1 6 0 v8 h-6 Z"/><circle cx="42" cy="33" r="3"/><path d="M39 37 a3 3 0 0 1 6 0 v8 h-6 Z"/></g></svg>`;
const BrandslackareSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#DC2626" rx="4"/><g stroke-linejoin="round" stroke-linecap="round"><rect x="25" y="18" width="14" height="34" rx="3" fill="#FFF"/><path d="M22 10 h20 v6 h-20 z" fill="#FFF"/><path d="M39 16 C 48 20 48 30 42 34" stroke="#FFF" stroke-width="4" fill="none"/><path d="M42 34 l8 2 l-3 7 z" fill="#FFF"/></g></svg>`;
const OgonduschSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#10B981" rx="4"/><path d="M20,12 L20,22 M26,12 L26,22 M32,12 L32,22 M38,12 L38,22 M44,12 L44,22" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/><path d="M12 30 C 20 50, 44 50, 52 30 C 44 10, 20 10, 12 30 Z M32 38 a8 8 0 1 1 0-16 a8 8 0 0 1 0 16 Z" stroke="#FFFFFF" stroke-width="4" fill="none"/></svg>`;

// Miljö (Standard symbols)
const MiljostationSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#16A34A" rx="4"/><g transform="translate(32 33) scale(1.6)"><path fill="white" d="M0 -14 L-5 -9 L5 -9 Z M-3 -9 L-3 0 Q-3 5 -8 5 L-8 -5 Q-3 -5 -3 -9 Z"/><path fill="white" transform="rotate(120)" d="M0 -14 L-5 -9 L5 -9 Z M-3 -9 L-3 0 Q-3 5 -8 5 L-8 -5 Q-3 -5 -3 -9 Z"/><path fill="white" transform="rotate(240)" d="M0 -14 L-5 -9 L5 -9 Z M-3 -9 L-3 0 Q-3 5 -8 5 L-8 -5 Q-3 -5 -3 -9 Z"/></g></svg>`;
const FarligtAvfallSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 4 L2 58 H62 Z" fill="#FBBF24" stroke="#000000" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="20" r="4" fill="#000000"/><path d="M28 28 L30 48 H34 L36 28 Z" fill="#000000"/></svg>`;

// Utrustning (Warning colors/Vibrant colors)
const KranSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 4 L2 58 H62 Z" fill="#FBBF24" stroke="#000000" stroke-width="3" stroke-linejoin="round"/><path d="M32 18 V38 M32 38 C32 48, 42 48, 42 38 C42 28, 22 28, 22 38 C22 48, 32 48, 32 38" stroke="#000000" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
const ElcentralSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 4 L2 58 H62 Z" fill="#FBBF24" stroke="#000000" stroke-width="3" stroke-linejoin="round"/><path d="M36 20 L28 36 H40 L32 52" stroke="#000000" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const BelysningsmastSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#0ea5e9" rx="4"/><path d="M30 56 L30 14 H34 L34 56 Z" fill="#FFFFFF"/><path d="M26 14 H38 L42 10 H22 Z" fill="#FFFFFF"/><rect x="24" y="14" width="16" height="6" fill="#fde047" stroke="#FFFFFF" stroke-width="1"/><path d="M22 23 l-4 4 M32 25 v6 M42 23 l4 4" stroke="#fde047" stroke-width="3" stroke-linecap="round"/></svg>`;

// Ritverktyg (Vibrant colors)
const StaketSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ec4899" stroke-width="3" stroke-linecap="round"><path d="M2 12h4m4 0h4m4 0h4"/></svg>`;
const GangvagSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"><path d="M4 12h.01M8 12h.01M12 12h.01M16 12h.01M20 12h.01"/></svg>`;
const ByggtrafikSVG = `<svg viewBox="0 <strong>0 24 24</strong>" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fde047" stroke-width="3" stroke-linecap="round"><path d="M2 12h20"/></svg>`;
const SchaktSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M3 21L21 3"/></svg>`;
const TextSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M12 6v15M8 21h8"/></svg>`;
const GrindSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M8 8 H32 V56 H8 Z" stroke="#4ade80" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M8 8 L32 32 L8 56" stroke="#4ade80" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M56 8 H32 V56 H56 Z" stroke="#4ade80" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M56 8 L32 32 L56 56" stroke="#4ade80" stroke-width="3" fill="none" stroke-linejoin="round"/></svg>`;

// --- Component Wrappers for Library Panel ---
const SvgIcon: React.FC<{ svg: string }> = ({ svg }) => (
    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svg }} />
);

// Etablering
const BodIcon = () => <SvgIcon svg={BodSVG} />;
const WCIcon = () => <SvgIcon svg={WCSVG} />;
const KontorIcon = () => <SvgIcon svg={KontorSVG} />;

// Logistik
const Container10Icon = () => <SvgIcon svg={ContainerSVG10} />;
const Container30Icon = () => <SvgIcon svg={ContainerSVG30} />;
const InfartIcon = () => <SvgIcon svg={InfartSVG} />;
const ParkeringIcon = () => <SvgIcon svg={ParkeringSVG} />;
const UpplagIcon = () => <SvgIcon svg={UpplagSVG} />;

// Säkerhet
const ForstaHjalpenIcon = () => <SvgIcon svg={ForstaHjalpenSVG} />;
const AtersamlingsplatsIcon = () => <SvgIcon svg={AtersamlingsplatsSVG} />;
const BrandslackareIcon = () => <SvgIcon svg={BrandslackareSVG} />;
const OgonduschIcon = () => <SvgIcon svg={OgonduschSVG} />;

// Miljö
const MiljostationIcon = () => <SvgIcon svg={MiljostationSVG} />;
const FarligtAvfallIcon = () => <SvgIcon svg={FarligtAvfallSVG} />;

// Utrustning
const KranIcon = () => <SvgIcon svg={KranSVG} />;
const ElcentralIcon = () => <SvgIcon svg={ElcentralSVG} />;
const BelysningsmastIcon = () => <SvgIcon svg={BelysningsmastSVG} />;

// Ritverktyg
const StaketIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: StaketSVG }} />;
const GangvagIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: GangvagSVG }} />;
const ByggtrafikIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: ByggtrafikSVG }} />;
const SchaktIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: SchaktSVG }} />;
const TextIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: TextSVG }} />;
const GrindIcon = () => <SvgIcon svg={GrindSVG} />;


export const LIBRARY_CATEGORIES: { name: string; items: LibraryItem[] }[] = [
    {
        name: "Etablering",
        items: [
            { type: 'bygg-bod', name: 'Bygg bod', icon: <BodIcon />, initialProps: { iconUrl: createIcon(BodSVG) } },
            { type: 'wc', name: 'WC', icon: <WCIcon />, initialProps: { iconUrl: createIcon(WCSVG) } },
            { type: 'kontor', name: 'Kontor', icon: <KontorIcon />, initialProps: { iconUrl: createIcon(KontorSVG) } },
        ]
    },
    {
        name: "Logistik",
        items: [
            { type: 'container-10', name: 'Container 10m³', icon: <Container10Icon />, initialProps: { iconUrl: createIcon(ContainerSVG10) } },
            { type: 'container-30', name: 'Container 30m³', icon: <Container30Icon />, initialProps: { iconUrl: createIcon(ContainerSVG30) } },
            { type: 'infart', name: 'Infart', icon: <InfartIcon />, initialProps: { iconUrl: createIcon(InfartSVG) } },
            { type: 'parkering', name: 'Parkering', icon: <ParkeringIcon />, initialProps: { iconUrl: createIcon(ParkeringSVG) } },
            { type: 'upplag', name: 'Material förvaring', icon: <UpplagIcon />, initialProps: { iconUrl: createIcon(UpplagSVG) } },
        ]
    },
    {
        name: "Säkerhet",
        items: [
            { type: 'forsta-hjalpen', name: 'Första hjälpen', icon: <ForstaHjalpenIcon />, initialProps: { iconUrl: createIcon(ForstaHjalpenSVG) } },
            { type: 'atersamlingsplats', name: 'Återsamlingsplats', icon: <AtersamlingsplatsIcon />, initialProps: { iconUrl: createIcon(AtersamlingsplatsSVG) } },
            { type: 'brandslackare', name: 'Brandsläckare', icon: <BrandslackareIcon />, initialProps: { iconUrl: createIcon(BrandslackareSVG) } },
            { type: 'ogondusch', name: 'Ögondusch', icon: <OgonduschIcon />, initialProps: { iconUrl: createIcon(OgonduschSVG) } },
        ]
    },
    {
        name: "Miljö",
        items: [
            { type: 'miljostation', name: 'Miljöstation', icon: <MiljostationIcon />, initialProps: { iconUrl: createIcon(MiljostationSVG) } },
            { type: 'farligt-avfall', name: 'Farligt avfall', icon: <FarligtAvfallIcon />, initialProps: { iconUrl: createIcon(FarligtAvfallSVG) } },
        ]
    },
    {
        name: "Utrustning",
        items: [
            { type: 'crane', name: 'Kran', icon: <KranIcon />, initialProps: { radius: 100, iconUrl: createIcon(KranSVG) } },
            { type: 'elcentral', name: 'Elcentral', icon: <ElcentralIcon />, initialProps: { iconUrl: createIcon(ElcentralSVG) } },
            { type: 'belysningsmast', name: 'Belysningsmast', icon: <BelysningsmastIcon />, initialProps: { iconUrl: createIcon(BelysningsmastSVG) } },
        ]
    },
    {
        name: "Ritverktyg",
        items: [
            { type: 'fence', name: 'Staket/Byggstängsel', icon: <StaketIcon />, initialProps: { points: [], stroke: '#ec4899', strokeWidth: 4, dash: [10, 5] } }, // pink-500
            { type: 'walkway', name: 'Gångväg', icon: <GangvagIcon />, initialProps: { points: [], stroke: '#22d3ee', strokeWidth: 6, dash: [1, 10] } }, // cyan-400 dotted
            { type: 'construction-traffic', name: 'Byggtrafik', icon: <ByggtrafikIcon />, initialProps: { points: [], stroke: '#fde047', strokeWidth: 8 } }, // yellow-400 solid thick
            { type: 'schakt', name: 'Schakt', icon: <SchaktIcon />, initialProps: { width: 150, height: 100, fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444', strokeWidth: 2 } },
            { type: 'text', name: 'Text', icon: <TextIcon />, initialProps: { text: "TEXT", fontSize: 24, fill: "black" } },
            { type: 'gate', name: 'Grind', icon: <GrindIcon />, initialProps: { iconUrl: createIcon(GrindSVG) } },
        ]
    }
];