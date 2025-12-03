
// Allmänna typer
export type DrawingTool = 'walkway' | 'fence' | 'construction-traffic' | 'pen' | 'text' | 'schakt' | 'crane' | 'building' | 'zone' | 'line';

// Typ-vakter (Type Guards)
export const isLineTool = (tool: string): tool is 'walkway' | 'fence' | 'construction-traffic' | 'pen' => 
    ['walkway', 'fence', 'construction-traffic', 'pen'].includes(tool);

export const isTextTool = (tool: string): tool is 'text' => tool === 'text';

export const isSchakt = (obj: APDObject): obj is APDObject & { type: 'schakt' } => obj.type === 'schakt';
export const isCrane = (obj: APDObject): obj is APDObject & { type: 'crane' } => obj.type === 'crane';
export const isText = (obj: APDObject): obj is APDObject & { type: 'text' } => obj.type === 'text';
export const isWalkway = (obj: APDObject): obj is APDObject & { type: 'walkway' } => obj.type === 'walkway';
export const isFence = (obj: APDObject): obj is APDObject & { type: 'fence' } => obj.type === 'fence';
export const isConstructionTraffic = (obj: APDObject): obj is APDObject & { type: 'construction-traffic' } => obj.type === 'construction-traffic';
export const isPen = (obj: APDObject): obj is APDObject & { type: 'pen' } => obj.type === 'pen';
export const isBuilding = (obj: APDObject): obj is APDObject & { type: 'building' } => obj.type === 'building';
export const isZone = (obj: APDObject): obj is APDObject & { type: 'zone' } => obj.type === 'zone';
export const isLine = (obj: APDObject): obj is APDObject & { type: 'line' } => obj.type === 'line';

// Gränssnitt (Interfaces)
export interface LibraryItem {
    name: string;
    type: DrawingTool;
    icon?: string;
    width?: number;
    height?: number;
    radius?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    dash?: number[];
}

export interface APDObject {
    id: string;
    item: LibraryItem;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    type: DrawingTool;
    points?: number[];
    text?: string;
    fontSize?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    dash?: number[];
    radius?: number;
    width?: number;
    height?: number;
    visible?: boolean; 
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
}

export interface LibraryCategory {
    name: string;
    items: LibraryItem[];
}
