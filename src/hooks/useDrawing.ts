
import { useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import Konva from 'konva';

import { APDObject, LibraryItem, DrawingTool, isLineTool, isRectTool, isTextTool } from '../types';
import { ItemTypes } from '../components/library/LibraryPanel';

const getRelativePointerPosition = (stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pos);
};

interface UseDrawingProps {
    stageRef: React.RefObject<Konva.Stage>;
    selectedTool: LibraryItem | null;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => APDObject;
    setSelectedTool: (tool: LibraryItem | null) => void;
    onTextCreate: (obj: APDObject) => void;
    onFileDrop?: (file: File) => void;
}

import { calculateFenceSnap } from '../utils/snapping';
import { calculateStacking } from '../utils/stacking';

export const useDrawing = ({
    stageRef,
    selectedTool,
    addObject,
    setSelectedTool,
    onTextCreate,
    onFileDrop,
    objects = [], // Default to empty array if not provided
}: UseDrawingProps & { objects?: APDObject[] }) => { // Extend props

    const [{ isOver, canDrop, draggedItemType }, drop] = useDrop(() => ({
        accept: [ItemTypes.LIBRARY_ITEM, NativeTypes.FILE],
        drop: (item: any, monitor) => {
            const stage = stageRef.current; if (!stage) return;
            const type = monitor.getItemType();

            if (type === NativeTypes.FILE) {
                if (onFileDrop && item.files && item.files.length > 0) {
                    onFileDrop(item.files[0]);
                }
            } else if (type === ItemTypes.LIBRARY_ITEM) {
                if (isLineTool(item.type) || isRectTool(item.type)) return;

                const offset = monitor.getClientOffset(); if (!offset) return;
                const stageRect = stage.container().getBoundingClientRect();
                const relativePos = {
                    x: (offset.x - stageRect.left - stage.x()) / stage.scaleX(),
                    y: (offset.y - stageRect.top - stage.y()) / stage.scaleY(),
                };

                // Enhanced Drop Logic: Snap Gates to Fences immediately
                let finalPos = { ...relativePos };
                let extraProps: Partial<APDObject> = {};

                if (item.type === 'gate' && objects.length > 0) {
                    // Get dimensions from item (or defaults)
                    const width = item.initialProps?.width || 3.0; // Assume new default 3.0
                    const height = item.initialProps?.height || 1.0;

                    // Attempt snap
                    const snapResult = calculateFenceSnap(
                        relativePos.x,
                        relativePos.y,
                        width,
                        height,
                        objects,
                        50 // Generous snap radius for dropping (larger than drag interaction)
                    );

                    if (snapResult && snapResult.snapped) {
                        finalPos.x = snapResult.x;
                        finalPos.y = snapResult.y;
                        extraProps.rotation = snapResult.rotation;
                    }
                }

                // Stacking Logic (Elevation)
                // Calculate appropriate Z-height based on what we are dropping onto
                const dropWidth = extraProps.width || item.initialProps?.width || 1;
                const dropHeight = extraProps.height || item.initialProps?.height || 1;

                const newElevation = calculateStacking(
                    finalPos.x,
                    finalPos.y,
                    dropWidth,
                    dropHeight,
                    objects
                );

                if (newElevation > 0.1) {
                    extraProps.elevation = newElevation;
                }

                addObject(item, finalPos, extraProps);
            }
        },
        collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop(), draggedItemType: monitor.getItemType() }),
    }), [stageRef, addObject, objects]);

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current;
        if (e.target !== stage || !stage) return;

        if (!selectedTool) return;

        const pos = getRelativePointerPosition(stage);

        if (isTextTool(selectedTool.type)) {
            const newObject = addObject(selectedTool, pos);
            onTextCreate(newObject);
            setSelectedTool(null);
        }
    };

    return {
        drop,
        isOver,
        canDrop,
        draggedItemType,
        handleStageClick
    };
};
