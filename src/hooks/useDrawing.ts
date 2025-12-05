
import { useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import Konva from 'konva';

import { APDObject, LibraryItem, DrawingTool, isLineTool } from '../types';
import { ItemTypes } from '../components/library/LibraryPanel';

const getRelativePointerPosition = (stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pos);
};

interface UseDrawingProps {
    stageRef: React.RefObject<Konva.Stage>;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => APDObject;
    handleFile: (file: File) => void;
    setTextToEditOnLoad: (id: string | null) => void;
}

export const useDrawing = ({
    stageRef,
    addObject,
    handleFile,
    setTextToEditOnLoad,
}: UseDrawingProps) => {
    const [drawingState, setDrawingState] = useState<{ type: DrawingTool; points: number[]; item: LibraryItem; } | null>(null);
    const [tempLinePoints, setTempLinePoints] = useState<number[]>([]);

    const isInteractionBlocked = !!drawingState;

    const [{ isOver, canDrop, draggedItemType }, drop] = useDrop(() => ({
        accept: [ItemTypes.LIBRARY_ITEM, NativeTypes.FILE],
        drop: (item: any, monitor) => {
            const stage = stageRef.current; if (!stage) return;
            const type = monitor.getItemType();

            if (type === NativeTypes.FILE) {
                if (item.files?.length) handleFile(item.files[0]);
            } else if (type === ItemTypes.LIBRARY_ITEM) {
                if (isLineTool(item.type)) return;
                
                const offset = monitor.getClientOffset(); if (!offset) return;
                const stageRect = stage.container().getBoundingClientRect();
                const relativePos = {
                    x: (offset.x - stageRect.left - stage.x()) / stage.scaleX(),
                    y: (offset.y - stageRect.top - stage.y()) / stage.scaleY(),
                };
                
                const newObject = addObject(item, relativePos);
                if (newObject.type === 'text') {
                    setTextToEditOnLoad(newObject.id);
                }
            }
        },
        collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop(), draggedItemType: monitor.getItemType() }),
    }), [stageRef, handleFile, addObject, setTextToEditOnLoad]);

    const startDrawing = useCallback((item: LibraryItem) => {
        if (isLineTool(item.type)) {
            setDrawingState({ type: item.type, points: [], item: item });
        }
    }, []);

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current;
        if (e.target !== stage || !stage) return;
        
        if (!drawingState) return;

        const pos = getRelativePointerPosition(stage);
        setDrawingState(prev => prev ? { ...prev, points: [...prev.points, pos.x, pos.y] } : null);
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!drawingState || drawingState.points.length === 0) return;
        const stage = stageRef.current; if (!stage) return;
        const pos = getRelativePointerPosition(stage);
        setTempLinePoints([...drawingState.points, pos.x, pos.y]);
    };

    const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
        if (!drawingState) return;
        e.evt.preventDefault();
        if (drawingState.points.length > 2) {
            addObject(drawingState.item, { x: 0, y: 0 }, { points: [...drawingState.points] });
        }
        setDrawingState(null);
        setTempLinePoints([]);
    };

    const cancelDrawing = useCallback(() => {
        setDrawingState(null);
        setTempLinePoints([]);
    }, []);

    return {
        drop, isOver, canDrop, draggedItemType, tempLinePoints, drawingState, isInteractionBlocked,
        startDrawing, cancelDrawing, 
        handleStageClick, handleMouseMove, handleContextMenu,
    };
};
