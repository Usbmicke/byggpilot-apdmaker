
// Allmänna typer
export type DrawingTool = 'walkway' | 'fence' | 'construction-traffic' | 'pen' | 'text' | 'schakt' | 'building' | 'zone' | 'line';

// Typ-vakter (Type Guards)
// Dessa funktioner avgör om ett verktyg ska starta ett specialritläge (linje eller rektangel) istället för att bara släppas.
export const isLineTool = (tool: string): tool is 'walkway' | 'fence' | 'construction-traffic' | 'pen' | 'building' =>
    ['walkway', 'fence', 'construction-traffic', 'pen', 'building'].includes(tool);

// isRectTool ska ENDAST innehålla verktyg som ritas ut som en rektangel av användaren.
// Färdiga objekt som containrar ska INTE vara med här.
export const isRectTool = (tool: string): tool is 'text' | 'schakt' => 
    ['text', 'schakt'].includes(tool);


// isSymbol avgör om ett objekt ska renderas som en enkel ikon i 3D-vyn.
export const isSymbol = (type: string): boolean => {
    if (!type) return false;
    // Listan innehåller nu bara de objekt som INTE ska vara symboler.
    const nonSymbolTypes: string[] = [
        'walkway', 'fence', 'construction-traffic', 'pen', 'building', 'zone', 'line', 'gate', 'crane', 
        'container-10', 'container-30', 'tippcontainer', 'tippcontainer-stangd', 
        'bygg-bod', 'kontor', // SiteShedObject
        'belysningsmast', // LightingMastObject
        'såg-bod', 'armerings-station' // GenericWorkshopObject
    ];
    return !nonSymbolTypes.includes(type) && !type.startsWith('zone_');
};

export const isSchakt = (obj: APDObject): obj is APDObject & { type: 'schakt' } => obj.type === 'schakt';
export const isCrane = (obj: APDObject): obj is APDObject & { type: 'crane' } => obj.type === 'crane';
export const isGate = (obj: APDObject): obj is APDObject & { type: 'gate' } => obj.type === 'gate';
export const isText = (obj: APDObject): obj is APDObject & { type: 'text' } => obj.type === 'text';
export const isWalkway = (obj: APDObject): obj is APDObject & { type: 'walkway' } => obj.type === 'walkway';
export const isFence = (obj: APDObject): obj is APDObject & { type: 'fence' } => obj.type === 'fence';
export const isConstructionTraffic = (obj: APDObject): obj is APDObject & { type: 'construction-traffic' } => obj.type === 'construction-traffic';
export const isPen = (obj: APDObject): obj is APDObject & { type: 'pen' } => obj.type === 'pen';
export const isBuilding = (obj: APDObject): obj is APDObject & { type: 'building' } => obj.type === 'building';
export const isZone = (obj: APDObject): obj is APDObject & { type: 'zone' } => obj.type.startsWith('zone_');
export const isLine = (obj: APDObject): obj is APDObject & { type: 'line' } => obj.type === 'line';

// Gränssnitt (Interfaces)
export interface LibraryItem {
    id?: string;
    name: string;
    type: string;
    iconUrl?: string;
    width?: number;
    height?: number;
    radius?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    dash?: number[];
    icon?: React.ReactNode;
    initialProps?: Partial<Omit<APDObject, 'id' | 'x' | 'y'>>;
}

export interface APDObject {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    quantity: number;
    item: LibraryItem;
    points?: number[];
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    dash?: number[];
    tension?: number;
    padding?: number;
    align?: string;
    radius?: number;
    visible?: boolean;

    // 3D-specifika egenskaper
    height3d?: number;
    elevation?: number;
    rotation3d?: { x: number; y: number; z: number };
}

export interface CustomLegendItem {
    id: string;
    name: string;
    color: string;
}

export interface ProjectInfo {
    company: string;
    projectName: string;
    projectId: string;
    author: string, 
    date: string, 
    revision: string
}

export interface LibraryCategory {
    name: string;
    items: LibraryItem[];
}
