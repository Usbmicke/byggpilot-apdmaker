
import { useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import Konva from 'konva';

import { APDObject, LibraryItem, DrawingTool, isLineTool, isRectTool } from '../types';
import { ItemTypes } from '../components/library/LibraryPanel';

interface UseDrawingProps {
    stageRef: React.RefObject<Konva.Stage>;
    selectedTool: LibraryItem | null;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => APDObject;
    setSelectedTool: (tool: LibraryItem | null) => void;
}

export const useDrawing = ({
    stageRef,
    addObject,
}: UseDrawingProps) => {

    const [{ isOver, canDrop, draggedItemType }, drop] = useDrop(() => ({
        accept: [ItemTypes.LIBRARY_ITEM, NativeTypes.FILE],
        drop: (item: any, monitor) => {
            const stage = stageRef.current; if (!stage) return;
            const type = monitor.getItemType();

            if (type === NativeTypes.FILE) {
                // handleFile is handled by the parent
            } else if (type === ItemTypes.LIBRARY_ITEM) {
                if (isLineTool(item.type) || isRectTool(item.type)) return; // These are handled by useCanvasDrawing
                
                const offset = monitor.getClientOffset(); if (!offset) return;
                const stageRect = stage.container().getBoundingClientRect();
                const relativePos = {
                    x: (offset.x - stageRect.left - stage.x()) / stage.scaleX(),
                    y: (offset.y - stageRect.top - stage.y()) / stage.scaleY(),
                };
                
                addObject(item, relativePos);
            }
        },
        collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop(), draggedItemType: monitor.getItemType() }),
    }), [stageRef, addObject]);

    return {
        drop,
        isOver,
        canDrop,
        draggedItemType,
    };
};
