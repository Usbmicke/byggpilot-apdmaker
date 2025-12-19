
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Line, Rect } from 'react-konva';
import useImage from 'use-image';
import {
    APDObject,
    isLineTool,
    isCrane,
    isPen
} from '../../types/index';
import CraneObject from '../canvas/CraneObject';

interface DraggableObjectProps {
    obj: APDObject;
    objects?: APDObject[];
    isSelected: boolean;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>, immediate: boolean) => void;
    isDrawing: boolean;
}

const SAFE_DIMENSION = 50;

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, objects, isSelected, onSelect, onChange, isDrawing }) => {
    const shapeRef = useRef<any>();

    const width = obj.width || obj.item.width || SAFE_DIMENSION;
    const height = obj.height || obj.item.height || SAFE_DIMENSION;

    const imageUrl = obj.item.iconUrl || '';
    const [image, imageStatus] = useImage(imageUrl, 'anonymous');

    const handleDragMove = (e: any) => {
        if (isDrawing) return;

        const target = e.target;
        const targetRect = target.getClientRect();

        let bestX = target.x();
        let bestY = target.y();
        const snapDist = 15;

        // Snapping Logic
        if (objects) {
            objects.forEach((other: APDObject) => {
                if (other.id === obj.id) return;

                // Allow snapping to other rect-like objects
                const otherWidth = other.width || other.item.width || SAFE_DIMENSION;
                const otherHeight = other.height || other.item.height || SAFE_DIMENSION;

                // Snap X
                if (Math.abs(bestX - other.x) < snapDist) bestX = other.x; // Left align
                if (Math.abs((bestX + width) - (other.x + otherWidth)) < snapDist) bestX = other.x + otherWidth - width; // Right align
                if (Math.abs(bestX - (other.x + otherWidth)) < snapDist) bestX = other.x + otherWidth; // Snap right to left
                if (Math.abs((bestX + width) - other.x) < snapDist) bestX = other.x - width; // Snap left to right

                // Snap Y
                if (Math.abs(bestY - other.y) < snapDist) bestY = other.y; // Top align
                if (Math.abs((bestY + height) - (other.y + otherHeight)) < snapDist) bestY = other.y + otherHeight - height; // Bottom align
                if (Math.abs(bestY - (other.y + otherHeight)) < snapDist) bestY = other.y + otherHeight; // Snap top to bottom
                if (Math.abs((bestY + height) - other.y) < snapDist) bestY = other.y - height; // Snap bottom to top
            });
        }

        target.x(bestX);
        target.y(bestY);
    };

    const handleDragEnd = (e: any) => {
        const x = e.target.x();
        const y = e.target.y();

        // Stacking Logic
        let newElevation = 0;
        if (objects) {
            // Find if we dropped ON TOP of another object (Stacking)
            // We check center point of dragged object
            const cx = x + width / 2;
            const cy = y + height / 2;

            for (const other of objects) {
                if (other.id === obj.id) continue;
                // Don't stack on thin objects like lines/fences usually, but allow sheds etc.
                const otherWidth = other.width || other.item.width || SAFE_DIMENSION;
                const otherHeight = other.height || other.item.height || SAFE_DIMENSION;

                if (cx > other.x && cx < other.x + otherWidth &&
                    cy > other.y && cy < other.y + otherHeight) {

                    // Stack on top!
                    // If the other object is already stacked, add to its elevation + height
                    const otherElevation = other.elevation || 0;
                    // Assume 2.5m height per 'floor' if not specified, or use object 3d height if available
                    // We need a height property. Let's assume standard shed height ~2.6m (26 units? or relative?)
                    // In our system, height3d might be set, or we default.

                    // Simple stacking: new elevation = other.elevation + other's height
                    // We need to fetch the '3d height' of the object below.
                    // For now, let's assume a standard height increment for stackable items.
                    const stackHeight = other.height3d || 2.6;
                    newElevation = otherElevation + stackHeight;

                    // Snap X/Y to match the one below for perfect stack?
                    // Let's NOT force snap X/Y on stack, just elevation, unless usage implies it.
                    // User asked for "stacking", usually implies alignment.
                    // Let's auto-align if 'close enough' to center, or just leave it.
                    // User said "magnetiska", so the move handler handles alignment.
                }
            }
        }

        onChange({ x, y, elevation: newElevation }, true);
    };

    // NOTE: onTransformEnd is now handled by CanvasPanel's Transformer

    const commonProps = {
        id: obj.id,
        name: obj.id,
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        draggable: !isDrawing, // Draggability is managed by the parent based on selection
        listening: !isDrawing,
        onClick: onSelect,
        onTap: onSelect,
        onDragMove: handleDragMove,
        onDragEnd: handleDragEnd,
        // onTransformEnd is removed
        ref: shapeRef,
        visible: obj.visible !== false,
    };

    if (isCrane(obj)) {
        return <CraneObject {...commonProps} obj={obj} />;
    }

    if (isLineTool(obj.type)) {
        return (
            <Line
                {...commonProps}
                points={obj.points}
                stroke={obj.stroke || '#000000'}
                strokeWidth={obj.strokeWidth || 2}
                dash={obj.dash}
                tension={isPen(obj.type) ? 0.5 : 0}
                lineCap="round"
                lineJoin="round"
            />
        );
    }

    if (imageStatus === 'loaded' && obj.item.iconUrl) {
        return <KonvaImage {...commonProps} image={image} width={width} height={height} />;
    }

    return <Rect {...commonProps} width={width} height={height} fill={obj.fill || '#a0aec0'} stroke={obj.stroke || '#4a5568'} strokeWidth={obj.strokeWidth || 2} />;
};

export default React.memo(DraggableObject);
