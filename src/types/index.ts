
import { KonvaNodeEvents } from "react-konva";

export type ToolType = 
    | 'symbol' 
    | 'crane' 
    | 'fence' 
    | 'walkway' 
    | 'construction-traffic' 
    | 'pen' 
    | 'schakt' 
    | 'gate'
    | 'building';

export interface LibraryItem {
    type: ToolType;
    name: string;
    icon: JSX.Element;
    iconUrl?: string;
    width?: number;
    height?: number;
    initialProps?: Partial<APDObject>;
}

export interface APDObject {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    type: ToolType;
    item: LibraryItem;
    quantity: number;
    visible?: boolean;
    
    // Drawing-specific props
    points?: number[];
    stroke?: string;
    strokeWidth?: number;
    dash?: number[];
    fill?: string;
    tension?: number;

    // Crane-specific props
    radius?: number;

    // Text-specific props (Now unused, but kept for type safety to avoid breaking old data)
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    padding?: number;
    align?: string;
}

export interface ProjectInfo {
    projectNumber: string;
    projectName: string;
    projectManager: string;
    revision: string;
    drawnBy: string;
    date: string;
}

export interface CustomLegendItem {
    id: string;
    name: string;
    color: string;
}

export type KonvaEvents = KonvaNodeEvents;

// --- Type Guards ---
export const isSymbol = (type: ToolType): boolean => type === 'symbol' || type === 'gate';
export const isCrane = (obj: APDObject): boolean => obj.type === 'crane';
export const isLineTool = (type: ToolType): boolean => ['fence', 'walkway', 'construction-traffic', 'pen', 'building'].includes(type);
export const isRectTool = (type: ToolType): boolean => type === 'schakt';
