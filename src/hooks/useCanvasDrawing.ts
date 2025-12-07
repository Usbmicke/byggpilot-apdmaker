import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import { APDObject, LibraryItem, isLineTool, isRectTool } from '../types';

interface UseCanvasDrawingProps {
    stageRef: React.RefObject<Konva.Stage>;
    selectedTool: LibraryItem | null;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => APDObject;
    setSelectedTool: (tool: LibraryItem | null) => void;
}

export const useCanvasDrawing = ({
    stageRef,
    selectedTool,
    addObject,
    setSelectedTool,
}: UseCanvasDrawingProps) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<number[]>([]);
    const [currentRect, setCurrentRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const startPosRef = useRef<{ x: number, y: number } | null>(null);

    // Helper to get relative pointer position
    const getRelativePointerPosition = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return { x: 0, y: 0 };
        const pos = stage.getPointerPosition();
        if (!pos) return { x: 0, y: 0 };
        const transform = stage.getAbsoluteTransform().copy().invert();
        return transform.point(pos);
    }, [stageRef]);

    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!selectedTool || e.target !== stageRef.current) return;

        // Only left click
        if (e.evt.button !== 0) return;

        const pos = getRelativePointerPosition();

        if (isRectTool(selectedTool.type)) {
            setIsDrawing(true);
            startPosRef.current = pos;
            setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        } else if (isLineTool(selectedTool.type)) {
            if (!isDrawing) {
                // Start new line
                setIsDrawing(true);
                setCurrentPoints([pos.x, pos.y, pos.x, pos.y]); // Start with 2 identical points
            } else {
                // Add point to existing line
                setCurrentPoints(prev => [...prev, pos.x, pos.y]);
            }
        }
    }, [selectedTool, isDrawing, getRelativePointerPosition, stageRef]);

    const handleMouseMove = useCallback(() => {
        if (!isDrawing || !selectedTool) return;

        const pos = getRelativePointerPosition();

        if (isRectTool(selectedTool.type) && startPosRef.current && currentRect) {
            const newWidth = pos.x - startPosRef.current.x;
            const newHeight = pos.y - startPosRef.current.y;
            setCurrentRect({
                ...currentRect,
                width: newWidth,
                height: newHeight,
            });
        } else if (isLineTool(selectedTool.type)) {
            // Update last point to follow mouse
            setCurrentPoints(prev => {
                const newPoints = [...prev];
                newPoints[newPoints.length - 2] = pos.x;
                newPoints[newPoints.length - 1] = pos.y;
                return newPoints;
            });
        }
    }, [isDrawing, selectedTool, getRelativePointerPosition, currentRect]);

    const finishDrawing = useCallback(() => {
        if (!isDrawing || !selectedTool) return;

        if (isRectTool(selectedTool.type) && currentRect && startPosRef.current) {
            // Normalize rect (handle negative width/height)
            const finalX = currentRect.width < 0 ? startPosRef.current.x + currentRect.width : startPosRef.current.x;
            const finalY = currentRect.height < 0 ? startPosRef.current.y + currentRect.height : startPosRef.current.y;
            const finalWidth = Math.abs(currentRect.width);
            const finalHeight = Math.abs(currentRect.height);

            if (finalWidth > 5 && finalHeight > 5) {
                addObject(selectedTool, { x: finalX, y: finalY }, {
                    width: finalWidth,
                    height: finalHeight,
                    // Apply tool specific styles if any
                    fill: selectedTool.fill || 'rgba(200, 200, 200, 0.5)',
                    stroke: selectedTool.stroke || '#000000',
                    strokeWidth: selectedTool.strokeWidth || 1,
                });
            }
        } else if (isLineTool(selectedTool.type) && currentPoints.length >= 4) {
            // For lines, we generate the object centered roughly but keep points relative to that center
            // OR simpler: keep points absolute and position object at 0,0 (or bounding box center)
            // Konva Lines with relative points are tricky if we want to move the whole group later.
            // Strategy: Calculate bounding box, set x/y to top-left, and adjust points relative to x/y.

            // However, our existing data model might expect points to be relative or absolute.
            // Looking at ThreeDView.tsx: 
            // vectors.push(new THREE.Vector3((obj.points[i] - bgWidth / 2) * SCALE_FACTOR...
            // It seems points are absolute coordinates on the canvas!
            // So we can set x/y to 0 for the object container, or calculate properly.
            // But existing lines in DraggableObject use <Line points={obj.points} x={obj.x} y={obj.y} ... />
            // If x/y are non-zero, points are relative.
            // Let's just store points as separate array and keep x/y at 0 for simplicity initially,
            // OR normalize them so x/y is the top-left corner.

            const minX = Math.min(...currentPoints.filter((_, i) => i % 2 === 0));
            const minY = Math.min(...currentPoints.filter((_, i) => i % 2 !== 0));

            const relativePoints = currentPoints.map((val, i) => i % 2 === 0 ? val - minX : val - minY);

            addObject(selectedTool, { x: minX, y: minY }, {
                points: relativePoints,
                stroke: selectedTool.stroke || '#000000',
                strokeWidth: selectedTool.strokeWidth || 2,
                dash: selectedTool.dash,
            });
        }

        // Reset
        setIsDrawing(false);
        setCurrentPoints([]);
        setCurrentRect(null);
        startPosRef.current = null;
        setSelectedTool(null); // Deselect tool after drawing
    }, [isDrawing, selectedTool, currentRect, currentPoints, addObject, setSelectedTool]);

    const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !selectedTool) return;

        if (isRectTool(selectedTool.type)) {
            finishDrawing();
        }
        // Lines are finished via double click or Enter key, not mouse up
    }, [isDrawing, selectedTool, finishDrawing]);

    // This handles the "Right Click" or "Double Click" to finish lines
    const handleMouseClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !selectedTool) return;

        // Right click to cancel/finish? standard is usually right click cancels or finishes. 
        // Let's stick to: Double click finishes.
    }, []);

    const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (isDrawing && selectedTool && isLineTool(selectedTool.type)) {
            finishDrawing();
        }
    }, [isDrawing, selectedTool, finishDrawing]);

    const cancelDrawing = useCallback(() => {
        setIsDrawing(false);
        setCurrentPoints([]);
        setCurrentRect(null);
        startPosRef.current = null;
    }, []);

    return {
        isDrawing,
        currentPoints,
        currentRect,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleDoubleClick,
        finishDrawing,
        cancelDrawing
    };
};
