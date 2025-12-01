
import React from 'react';

export interface LibraryItem {
    type: string;
    name: string;
    icon: React.ReactElement;
    initialProps: Partial<APDObject>;
}

export interface ProjectInfo {
    company: string;
    projectName: string;
    projectId: string;
    createdBy: string;
    logoUrl: string;
}

interface BaseAPDObject {
    id: string;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    label: string;
    type: string;
}

export interface IconAPDObject extends BaseAPDObject {
    iconUrl: string;
}

export interface TextAPDObject extends BaseAPDObject {
    text: string;
    fontSize: number;
    fill: string;
}

export interface LineAPDObject extends BaseAPDObject {
    points: number[];
    stroke: string;
    strokeWidth: number;
    isInRiskZone?: boolean;
    dash?: number[];
    tension?: number;
}

export interface CraneAPDObject extends IconAPDObject {
    radius: number;
}

export interface SchaktAPDObject extends BaseAPDObject {
    width: number;
    height: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    height3d?: number;
    color3d?: string;
}

export type APDObject = IconAPDObject | TextAPDObject | LineAPDObject | CraneAPDObject | SchaktAPDObject;

export interface CustomLegendItem {
    id: string;
    name:string;
    count: number;
}

// Type Guards
export function isText(obj: APDObject): obj is TextAPDObject {
    return obj.type === 'text';
}
export function isWalkway(obj: APDObject): obj is LineAPDObject {
    return obj.type === 'walkway';
}
export function isFence(obj: APDObject): obj is LineAPDObject {
    return obj.type === 'fence';
}
export function isConstructionTraffic(obj: APDObject): obj is LineAPDObject {
    return obj.type === 'construction-traffic';
}
export function isPen(obj: APDObject): obj is LineAPDObject {
    return obj.type === 'pen';
}
export function isCrane(obj: APDObject): obj is CraneAPDObject {
    return obj.type === 'crane';
}
export function isSchakt(obj: APDObject): obj is SchaktAPDObject {
    return obj.type === 'schakt';
}
export function isLineTool(item: LibraryItem): boolean {
    return item.type === 'walkway' || item.type === 'fence' || item.type === 'construction-traffic' || item.type === 'pen';
}