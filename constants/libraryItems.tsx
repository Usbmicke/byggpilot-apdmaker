
import React from 'react';
import { LibraryItem } from '../types/index';

// --- Helper to create data URLs ---
const createIcon = (svgString: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

// --- SVG Definitions with VIBRANT/SIGNAL Colors ---

// Etablering (Neon Orange/Blue)
const BodSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="40" font-size="16" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">BOD</text></svg>`;
const WCSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#2979FF" stroke="#000" stroke-width="2"/><text x="32" y="44" font-size="28" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">WC</text></svg>`;
const KontorSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="40" x="2" y="12" fill="#FF5722" stroke="#000" stroke-width="2" rx="2"/><path d="M10 12 L32 2 L54 12" fill="#FF5722" stroke="#000" stroke-width="2"/><text x="32" y="40" font-size="12" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">KONTOR</text></svg>`;

// Logistik (High Contrast: Lime, Blue, Purple, Magenta)
const ContainerSVG10 = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="28" x="7" y="18" fill="#76FF03" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="38" font-size="10" fill="#000" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">10m³</text></svg>`;
const ContainerSVG30 = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="24" x="2" y="20" fill="#00E5FF" stroke="#000" stroke-width="2" rx="2"/><text x="32" y="37" font-size="12" fill="#000" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">30m³</text></svg>`;
const TippContainerSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M8 20 L56 20 L50 52 H14 Z" fill="#2962FF" stroke="#000" stroke-width="2"/><path d="M8 20 L4 12 H60 L56 20" fill="#2962FF" stroke="#000" stroke-width="2"/><text x="32" y="42" font-size="10" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">ÖPPEN</text></svg>`;
const InfartSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="10" width="60" height="44" fill="#00C853" rx="4" stroke="#000" stroke-width="2"/><path d="M15 32 H49 M35 18 L49 32 L35 46" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><text x="32" y="62" font-size="10" font-weight="bold" text-anchor="middle">INFART</text></svg>`;
const ParkeringSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#2962FF" rx="8" stroke="#000" stroke-width="2"/><text x="32" y="46" font-size="40" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">P</text></svg>`;
const UpplagSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#D500F9" rx="4" stroke="#000" stroke-width="2"/><path d="M10 10 L54 54 M54 10 L10 54" stroke="#fff" stroke-width="4" opacity="0.5"/><text x="32" y="38" font-size="12" fill="white" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">UPPLAG</text></svg>`;
const LossningSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FFD600" stroke="#000" stroke-width="4"/><path d="M2 2 L62 62 M15 2 L62 49 M30 2 L62 34 M2 15 L49 62 M2 30 L34 62" stroke="#000" stroke-width="2"/></svg>`;
const VandplanSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#E0E0E0" stroke="#000" stroke-width="2" stroke-dasharray="4 2"/><path d="M45 40 A 15 15 0 1 1 35 15 L 35 25 L 50 10 L 35 0 L 35 10 A 20 20 0 1 0 50 40 Z" fill="#000"/></svg>`;


// Säkerhet (Standard ISO Colors but Bright)
const ForstaHjalpenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M32 12 V52 M12 32 H52" stroke="#FFFFFF" stroke-width="12" stroke-linecap="square"/></svg>`;
const HjartstartareSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M32 18 C 20 5, 10 20, 32 48 C 54 20, 44 5, 32 18" fill="#fff"/><path d="M36 20 L28 30 L34 30 L30 40" stroke="#00C853" stroke-width="3" fill="none"/></svg>`;
const AtersamlingsplatsSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><circle cx="32" cy="32" r="14" fill="#fff"/><path d="M32 18 V46 M18 32 H46" stroke="#00C853" stroke-width="0"/><g fill="#00C853"><circle cx="32" cy="28" r="3"/><path d="M28 32 h8 v8 h-8 z"/></g><path d="M8 14 L14 8 M56 14 L50 8 M8 50 L14 56 M56 50 L50 56" stroke="#fff" stroke-width="4"/></svg>`;
const BrandslackareSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FF1744" stroke="#fff" stroke-width="2" rx="4"/><rect x="22" y="16" width="20" height="36" rx="4" fill="#fff"/><path d="M32 16 V10 H26" stroke="#fff" stroke-width="3" fill="none"/><path d="M32 20 C 45 20, 45 40, 48 48" stroke="#fff" stroke-width="3" fill="none"/><rect x="28" y="12" width="8" height="4" fill="#fff"/></svg>`;
const BrandpostSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FF1744" stroke="#fff" stroke-width="2" rx="4"/><rect x="26" y="15" width="12" height="40" fill="#fff" /><rect x="20" y="20" width="6" height="8" fill="#fff"/><rect x="38" y="20" width="6" height="8" fill="#fff"/><circle cx="32" cy="15" r="6" fill="#fff"/></svg>`;
const OgonduschSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" stroke="#fff" stroke-width="2" rx="4"/><path d="M10 32 Q32 12 54 32 Q32 52 10 32 Z" stroke="#fff" stroke-width="3" fill="none"/><circle cx="32" cy="32" r="7" fill="#fff"/><path d="M32 8 L32 18" stroke="#fff" stroke-width="4"/><path d="M32 18 L26 24 M32 18 L38 24" stroke="#fff" stroke-width="3"/><circle cx="22" cy="26" r="2" fill="#fff"/><circle cx="32" cy="26" r="2" fill="#fff"/><circle cx="42" cy="26" r="2" fill="#fff"/></svg>`;

// Miljö (Bright Green/Yellow)
// UPDATED: Miljöstation (Ljusgrön med kreativ löv-cykel)
const MiljostationSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="60" height="60" rx="4" fill="#76FF03" stroke="#000" stroke-width="2"/>
  <g transform="translate(32, 32)">
     <path d="M0,-24 C5,-24 10,-20 12,-16 C12,-10 6,0 0,6 C-6,0 -12,-10 -12,-16 C-10,-20 -5,-24 0,-24 Z" fill="#006400" transform="rotate(0) translate(0, 10)"/>
     <path d="M0,-24 C5,-24 10,-20 12,-16 C12,-10 6,0 0,6 C-6,0 -12,-10 -12,-16 C-10,-20 -5,-24 0,-24 Z" fill="#006400" transform="rotate(120) translate(0, 10)"/>
     <path d="M0,-24 C5,-24 10,-20 12,-16 C12,-10 6,0 0,6 C-6,0 -12,-10 -12,-16 C-10,-20 -5,-24 0,-24 Z" fill="#006400" transform="rotate(240) translate(0, 10)"/>
     <circle r="4" fill="#FFFFFF"/>
  </g>
</svg>`;

const FarligtAvfallSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FFD600" stroke="#000" stroke-width="3" rx="4"/><path d="M32 14 L14 50 H50 Z" fill="#000"/><circle cx="32" cy="30" r="3" fill="#FFD600"/><rect x="30" y="36" width="4" height="8" fill="#FFD600"/></svg>`;

// Utrustning (Warning Yellows/Oranges)
const KranSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#FFD600" stroke="#000" stroke-width="2" stroke-dasharray="4 4"/><path d="M32 10 L32 54 M10 32 L54 32" stroke="#000" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="#000"/></svg>`;
const ElcentralSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#FFAB00" stroke="#000" stroke-width="2" rx="4"/><path d="M30 15 L20 35 H40 L30 55" stroke="#000" stroke-width="6" fill="none" stroke-linejoin="round"/></svg>`;
const VattenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#2979FF" stroke="#fff" stroke-width="2" rx="4"/><path d="M15 40 V25 H35 C42 25 45 28 45 35 V38" stroke="#fff" stroke-width="5" fill="none"/><path d="M12 25 H18" stroke="#fff" stroke-width="5"/><path d="M22 20 V25" stroke="#fff" stroke-width="4"/><path d="M45 44 L45 54" stroke="#fff" stroke-width="3" stroke-dasharray="4 2"/></svg>`;
const BelysningsmastSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="16" fill="#FFFF00" stroke="#000" stroke-width="2"/><path d="M32 8 L32 16 M32 48 L32 56 M8 32 L16 32 M48 32 L56 32 M14 14 L20 20 M44 44 L50 50 M14 50 L20 44 M44 20 L50 14" stroke="#FFFF00" stroke-width="4" stroke-linecap="round"/></svg>`;
const GasSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M20 15 h24 v40 h-24 z" fill="#FFEA00" stroke="#000" stroke-width="2"/><path d="M32 5 v10 M25 10 h14" stroke="#000" stroke-width="4"/><text x="32" y="45" font-size="16" font-weight="bold" text-anchor="middle">GAS</text></svg>`;


// Skyltar & Hänvisning (Strict ISO colors)
const UtrymningspilSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" x="2" y="2" fill="#00C853" rx="2" stroke="#fff" stroke-width="2"/><path d="M10 32 H50 M35 18 L50 32 L35 46" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const VarningSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 4 L4 58 H60 Z" fill="#FFEA00" stroke="#000" stroke-width="4" stroke-linejoin="round"/><path d="M32 20 V40 M32 48 V50" stroke="#000" stroke-width="6" stroke-linecap="round"/></svg>`;
const ForbudSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#fff" stroke="#D50000" stroke-width="8"/><path d="M14 14 L50 50" stroke="#D50000" stroke-width="8"/></svg>`;
// UPDATED: Personlig Skyddsutrustning (PPE) - Simple Helmet
const PabudSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="28" fill="#2962FF" stroke="#fff" stroke-width="2"/>
  <path d="M12 36 C 12 18, 52 18, 52 36 L 52 40 L 12 40 Z" fill="#fff"/>
  <path d="M8 40 L 56 40 L 56 46 C 56 48, 8 48, 8 46 Z" fill="#fff"/>
  <rect x="30" y="16" width="4" height="12" fill="#E3F2FD"/>
</svg>`;
const ParkeringForbjudenSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#2962FF" stroke="#D50000" stroke-width="6"/><path d="M14 50 L50 14" stroke="#D50000" stroke-width="6"/></svg>`;


// Ritverktyg Icons (High visibility)
const StaketSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#D500F9" stroke-width="3" stroke-linecap="round"><path d="M2 12h4m4 0h4m4 0h4m4 0h4m4 0h4m4 0h4m4 0h4m4 0h4m4 0h4m4 0h4"/></svg>`;
const GangvagSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#00E5FF" stroke-width="3" stroke-linecap="round"><path d="M2 12h2M6 12h2M10 12h2M14 12h2M18 12h2"/></svg>`;
const ByggtrafikSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#FFD600" stroke-width="4" stroke-linecap="round"><path d="M2 12h20"/></svg>`;
const SchaktSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="rgba(255, 23, 68, 0.2)" stroke="#FF1744" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
const TextSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`;
const GrindSVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M5 10 H30 V54 H5 Z M34 10 H59 V54 H34 Z" stroke="#00E676" stroke-width="4" fill="none"/><path d="M5 10 L30 54 M30 10 L5 54 M34 10 L59 54 M59 10 L34 54" stroke="#00E676" stroke-width="2"/></svg>`;
const PennaSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;


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
const TippContainerIcon = () => <SvgIcon svg={TippContainerSVG} />;
const InfartIcon = () => <SvgIcon svg={InfartSVG} />;
const ParkeringIcon = () => <SvgIcon svg={ParkeringSVG} />;
const UpplagIcon = () => <SvgIcon svg={UpplagSVG} />;
const LossningIcon = () => <SvgIcon svg={LossningSVG} />;
const VandplanIcon = () => <SvgIcon svg={VandplanSVG} />;

// Säkerhet
const ForstaHjalpenIcon = () => <SvgIcon svg={ForstaHjalpenSVG} />;
const HjartstartareIcon = () => <SvgIcon svg={HjartstartareSVG} />;
const AtersamlingsplatsIcon = () => <SvgIcon svg={AtersamlingsplatsSVG} />;
const BrandslackareIcon = () => <SvgIcon svg={BrandslackareSVG} />;
const BrandpostIcon = () => <SvgIcon svg={BrandpostSVG} />;
const OgonduschIcon = () => <SvgIcon svg={OgonduschSVG} />;

// Miljö
const MiljostationIcon = () => <SvgIcon svg={MiljostationSVG} />;
const FarligtAvfallIcon = () => <SvgIcon svg={FarligtAvfallSVG} />;

// Utrustning
const KranIcon = () => <SvgIcon svg={KranSVG} />;
const ElcentralIcon = () => <SvgIcon svg={ElcentralSVG} />;
const VattenIcon = () => <SvgIcon svg={VattenSVG} />;
const BelysningsmastIcon = () => <SvgIcon svg={BelysningsmastSVG} />;
const GasIcon = () => <SvgIcon svg={GasSVG} />;

// Skyltar
const UtrymningspilIcon = () => <SvgIcon svg={UtrymningspilSVG} />;
const VarningIcon = () => <SvgIcon svg={VarningSVG} />;
const ForbudIcon = () => <SvgIcon svg={ForbudSVG} />;
const PabudIcon = () => <SvgIcon svg={PabudSVG} />;
const ParkeringForbjudenIcon = () => <SvgIcon svg={ParkeringForbjudenSVG} />;

// Ritverktyg
const StaketIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: StaketSVG }} />;
const GangvagIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: GangvagSVG }} />;
const ByggtrafikIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: ByggtrafikSVG }} />;
const SchaktIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: SchaktSVG }} />;
const TextIcon = () => <div className="w-full h-full p-1" dangerouslySetInnerHTML={{ __html: TextSVG }} />;
const GrindIcon = () => <SvgIcon svg={GrindSVG} />;
const PennaIcon = () => <div className="w-full h-full p-1 text-red-500" dangerouslySetInnerHTML={{ __html: PennaSVG }} />;


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
            { type: 'tippcontainer', name: 'Tippcontainer (Öppen)', icon: <TippContainerIcon />, initialProps: { iconUrl: createIcon(TippContainerSVG) } },
            { type: 'upplag', name: 'Materialupplag', icon: <UpplagIcon />, initialProps: { iconUrl: createIcon(UpplagSVG) } },
            { type: 'lossning', name: 'Lossningszon', icon: <LossningIcon />, initialProps: { iconUrl: createIcon(LossningSVG) } },
            { type: 'vandplan', name: 'Vändplan', icon: <VandplanIcon />, initialProps: { iconUrl: createIcon(VandplanSVG) } },
            { type: 'infart', name: 'Infart', icon: <InfartIcon />, initialProps: { iconUrl: createIcon(InfartSVG) } },
            { type: 'parkering', name: 'Parkering', icon: <ParkeringIcon />, initialProps: { iconUrl: createIcon(ParkeringSVG) } },
        ]
    },
    {
        name: "Säkerhet",
        items: [
            { type: 'forsta-hjalpen', name: 'Första hjälpen', icon: <ForstaHjalpenIcon />, initialProps: { iconUrl: createIcon(ForstaHjalpenSVG) } },
            { type: 'hjartstartare', name: 'Hjärtstartare', icon: <HjartstartareIcon />, initialProps: { iconUrl: createIcon(HjartstartareSVG) } },
            { type: 'atersamlingsplats', name: 'Återsamlingsplats', icon: <AtersamlingsplatsIcon />, initialProps: { iconUrl: createIcon(AtersamlingsplatsSVG) } },
            { type: 'brandslackare', name: 'Brandsläckare', icon: <BrandslackareIcon />, initialProps: { iconUrl: createIcon(BrandslackareSVG) } },
            { type: 'brandpost', name: 'Brandpost', icon: <BrandpostIcon />, initialProps: { iconUrl: createIcon(BrandpostSVG) } },
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
            { type: 'vatten', name: 'Vattenutkastare', icon: <VattenIcon />, initialProps: { iconUrl: createIcon(VattenSVG) } },
            { type: 'gas', name: 'Gasförvaring', icon: <GasIcon />, initialProps: { iconUrl: createIcon(GasSVG) } },
            { type: 'belysningsmast', name: 'Belysningsmast', icon: <BelysningsmastIcon />, initialProps: { iconUrl: createIcon(BelysningsmastSVG) } },
        ]
    },
    {
        name: "Skyltar & Hänvisning",
        items: [
             { type: 'utrymning', name: 'Utrymningspil', icon: <UtrymningspilIcon />, initialProps: { iconUrl: createIcon(UtrymningspilSVG) } },
             { type: 'varning', name: 'Varning', icon: <VarningIcon />, initialProps: { iconUrl: createIcon(VarningSVG) } },
             { type: 'forbud', name: 'Tillträde förbjudet', icon: <ForbudIcon />, initialProps: { iconUrl: createIcon(ForbudSVG) } },
             { type: 'parkering-forbjuden', name: 'Parkering förbjuden', icon: <ParkeringForbjudenIcon />, initialProps: { iconUrl: createIcon(ParkeringForbjudenSVG) } },
             { type: 'pabud', name: 'Personlig Skyddsutr.', icon: <PabudIcon />, initialProps: { iconUrl: createIcon(PabudSVG) } },
        ]
    },
    {
        name: "Ritverktyg",
        items: [
            { type: 'fence', name: 'Staket/Byggstängsel', icon: <StaketIcon />, initialProps: { points: [], stroke: '#D500F9', strokeWidth: 4, dash: [10, 5] } }, // Magenta
            { type: 'walkway', name: 'Gångväg', icon: <GangvagIcon />, initialProps: { points: [], stroke: '#00E5FF', strokeWidth: 6, dash: [1, 10] } }, // Bright Cyan
            { type: 'construction-traffic', name: 'Byggtrafik', icon: <ByggtrafikIcon />, initialProps: { points: [], stroke: '#FFD600', strokeWidth: 8 } }, // Neon Yellow
            { type: 'pen', name: 'Penna (Frihand)', icon: <PennaIcon />, initialProps: { points: [], stroke: '#ef4444', strokeWidth: 3, tension: 0.5 } }, // Red freehand
            { type: 'schakt', name: 'Schakt', icon: <SchaktIcon />, initialProps: { width: 150, height: 100, fill: 'rgba(255, 23, 68, 0.2)', stroke: '#FF1744', strokeWidth: 2 } }, // Red
            { type: 'text', name: 'Text', icon: <TextIcon />, initialProps: { text: "TEXT", fontSize: 24, fill: "black" } },
            { type: 'gate', name: 'Grind', icon: <GrindIcon />, initialProps: { iconUrl: createIcon(GrindSVG) } },
        ]
    }
];
