import { useState, useCallback, useRef } from 'react';
import Konva from 'konva'; // Remove unsused v4 import, fix types import
import { APDObject, LibraryItem, isLineTool, isRectTool } from '../types';

interface UseCanvasDrawingProps {
    stageRef: React.RefObject<Konva.Stage>;
    selectedTool: LibraryItem | null;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => APDObject;
    setSelectedTool: (tool: LibraryItem | null) => void;
    onTextCreate: (obj: APDObject) => void;
}

export const useCanvasDrawing = ({
    stageRef,
    selectedTool,
    addObject,
    setSelectedTool,
    onTextCreate,
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

    const finishDrawing = useCallback(() => {
        if (!selectedTool) return;

        if (isRectTool(selectedTool.type) && currentRect && startPosRef.current) {
            // Normalize rect (handle negative width/height)
            const finalX = currentRect.width < 0 ? startPosRef.current.x + currentRect.width : startPosRef.current.x;
            const finalY = currentRect.height < 0 ? startPosRef.current.y + currentRect.height : startPosRef.current.y;
            const finalWidth = Math.abs(currentRect.width);
            const finalHeight = Math.abs(currentRect.height);

            if (finalWidth > 5 && finalHeight > 5) {
                const newObj = addObject(selectedTool, { x: finalX, y: finalY }, {
                    width: finalWidth,
                    height: finalHeight,
                    fill: selectedTool.initialProps?.fill || 'rgba(200, 200, 200, 0.5)',
                    stroke: selectedTool.initialProps?.stroke || '#000000',
                    strokeWidth: selectedTool.initialProps?.strokeWidth || 1,
                });

                // For Text, we trigger edit mode even if it was dragged out
                if (selectedTool.type === 'text') {
                    onTextCreate(newObj);
                }
            }
        } else if (isLineTool(selectedTool.type) && currentPoints.length >= 4) {
            // Lines need at least 2 points (4 coords). 
            const pointsToSave = [...currentPoints];

            const minX = Math.min(...pointsToSave.filter((_, i) => i % 2 === 0));
            const minY = Math.min(...pointsToSave.filter((_, i) => i % 2 !== 0));

            const relativePoints = pointsToSave.map((val, i) => i % 2 === 0 ? val - minX : val - minY);

            addObject(selectedTool, { x: minX, y: minY }, {
                points: relativePoints,
                stroke: selectedTool.initialProps?.stroke || '#000000',
                strokeWidth: selectedTool.initialProps?.strokeWidth || 2,
                dash: selectedTool.initialProps?.dash,
                tension: selectedTool.initialProps?.tension,
            });
        }

        // Reset
        setIsDrawing(false);
        setCurrentPoints([]);
        setCurrentRect(null);
        startPosRef.current = null;
        setSelectedTool(null);
    }, [isDrawing, selectedTool, currentRect, currentPoints, addObject, setSelectedTool, onTextCreate]);

    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!selectedTool || e.target !== stageRef.current) return;

        // RIGHT CLICK (Button 2) -> FINISH (for lines)
        if (e.evt.button === 2) {
            e.evt.preventDefault();
            if (isDrawing && isLineTool(selectedTool.type)) {
                finishDrawing();
            }
            return;
        }

        // LEFT CLICK (Button 0) -> ACTION
        if (e.evt.button !== 0) return;

        const pos = getRelativePointerPosition();

        if (selectedTool.type === 'text' && !isDrawing) {
            // Special case for Text: Click to place immediately
            const newObj = addObject(selectedTool, { x: pos.x, y: pos.y }, {
                width: selectedTool.initialProps?.width || 100,
                height: selectedTool.initialProps?.height || 50,
                text: selectedTool.initialProps?.text || 'Text',
                fontSize: selectedTool.initialProps?.fontSize || 24,
                fill: selectedTool.initialProps?.fill || '#000000',
            });
            onTextCreate(newObj);
            setSelectedTool(null);
            return;
        }

        if (isRectTool(selectedTool.type)) {
            // Start dragging for Rect (Schakt)
            setIsDrawing(true);
            startPosRef.current = pos;
            setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        } else if (isLineTool(selectedTool.type)) {
            if (!isDrawing) {
                // Start new line
                setIsDrawing(true);
                // Start with 2 identical points (start, end-ghost)
                setCurrentPoints([pos.x, pos.y, pos.x, pos.y]);
            } else {
                // Add point to existing line. 
                setCurrentPoints(prev => [...prev, pos.x, pos.y]);
            }
        }
    }, [selectedTool, isDrawing, getRelativePointerPosition, stageRef, finishDrawing, addObject, setSelectedTool, onTextCreate]);

    const handleMouseMove = useCallback(() => {
        if (!isDrawing || !selectedTool) return;

        const pos = getRelativePointerPosition();

        if (isRectTool(selectedTool.type) && startPosRef.current && currentRect) {
            // Update Rect size
            const newWidth = pos.x - startPosRef.current.x;
            const newHeight = pos.y - startPosRef.current.y;
            setCurrentRect({
                ...currentRect,
                width: newWidth,
                height: newHeight,
            });
        } else if (isLineTool(selectedTool.type)) {
            // Update last point (ghost point) to follow mouse
            setCurrentPoints(prev => {
                if (prev.length < 2) return prev;
                const newPoints = [...prev];
                newPoints[newPoints.length - 2] = pos.x;
                newPoints[newPoints.length - 1] = pos.y;
                return newPoints;
            });
        }
    }, [isDrawing, selectedTool, getRelativePointerPosition, currentRect]);

    const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !selectedTool) return;

        // Only Left Click release matters
        if (e.evt.button !== 0) return;

        if (isRectTool(selectedTool.type)) {
            // Finish dragging Rect
            finishDrawing();
        }
        // For Lines, MouseUp does nothing (we wait for next click or right click)
    }, [isDrawing, selectedTool, finishDrawing]);

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
        setSelectedTool(null);
    }, [setSelectedTool]);

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
