
import { useState, useRef } from 'react';
import { APDObject } from '../types';
import Konva from 'konva';

// Helper to get pointer position relative to the stage's transformations
const getRelativePointerPosition = (stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pos);
};

interface UseStageInteractionProps {
    stageRef: React.RefObject<Konva.Stage>;
    objects: APDObject[];
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
    checkDeselect: (e: any) => void;
    // A single flag to know if interactions like selection should be blocked
    isInteractionBlocked: boolean; 
}

export const useStageInteraction = ({
    stageRef,
    objects,
    selectedIds,
    setSelectedIds,
    checkDeselect,
    isInteractionBlocked
}: UseStageInteractionProps) => {
    // Ref for the selection rectangle shape
    const selectionRectRef = useRef<Konva.Rect>(null);
    // State for the selection rectangle's dimensions and visibility
    const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Block if interaction is disabled, not a left-click, or if the click is not on the stage itself
        if (isInteractionBlocked || e.target !== stageRef.current || e.evt.button !== 0) {
            return;
        }
        
        const stage = stageRef.current;
        if (!stage) return;
        
        // Start drawing the selection box from the current pointer position
        const pos = getRelativePointerPosition(stage);
        setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });

        // Deselect objects if not holding shift
        if (!e.evt.shiftKey) {
            checkDeselect(e);
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Only run if we are currently drawing a selection box
        if (!selectionBox.visible) {
            return;
        }

        const stage = stageRef.current;
        if (!stage) return;
        
        // Update the size of the selection box
        const pos = getRelativePointerPosition(stage);
        setSelectionBox(prev => ({ ...prev, width: pos.x - prev.x, height: pos.y - prev.y }));
    };

    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!selectionBox.visible) {
            return;
        }

        // Hide the selection box
        setSelectionBox({ ...selectionBox, visible: false });

        const stage = stageRef.current;
        const box = selectionRectRef.current;
        if (!stage || !box) return;

        const clientRect = box.getClientRect();
        
        // Find all objects that intersect with the selection box
        const newSelectedIds = objects.reduce((acc, obj) => {
            const node = stage.findOne('.' + obj.id);
            if (node && Konva.Util.haveIntersection(clientRect, node.getClientRect())) {
                acc.push(obj.id);
            }
            return acc;
        }, [] as string[]);

        // If shift is pressed, add to current selection, otherwise, replace it
        setSelectedIds(e.evt.shiftKey ? [...new Set([...selectedIds, ...newSelectedIds])] : newSelectedIds);
    };

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        // Calculate the new viewpoint position
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;

        stage.scale({ x: newScale, y: newScale });
        stage.position({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    };

    // Return all the necessary handlers and state for the CanvasPanel to use
    return {
        selectionBox,
        selectionRectRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
    };
};
