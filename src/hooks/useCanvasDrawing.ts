
import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
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
            const finalX = currentRect.width < 0 ? startPosRef.current.x + currentRect.width : startPosRef.current.x;
            const finalY = currentRect.height < 0 ? startPosRef.current.y + currentRect.height : startPosRef.current.y;
            const finalWidth = Math.abs(currentRect.width);
            const finalHeight = Math.abs(currentRect.height);

            if (finalWidth > 5 && finalHeight > 5) {
                addObject(selectedTool, { x: finalX, y: finalY }, {
                    ...selectedTool.initialProps,
                    width: finalWidth,
                    height: finalHeight,
                });
            }
        } else if (isLineTool(selectedTool.type) && currentPoints.length >= 4) {
            const pointsToSave = [...currentPoints];
            const minX = Math.min(...pointsToSave.filter((_, i) => i % 2 === 0));
            const minY = Math.min(...pointsToSave.filter((_, i) => i % 2 !== 0));
            const relativePoints = pointsToSave.map((val, i) => i % 2 === 0 ? val - minX : val - minY);

            addObject(selectedTool, { x: minX, y: minY }, { 
                ...selectedTool.initialProps,
                points: relativePoints,
            });
        }

        setIsDrawing(false);
        setCurrentPoints([]);
        setCurrentRect(null);
        startPosRef.current = null;
        setSelectedTool(null);
    }, [selectedTool, currentRect, currentPoints, addObject, setSelectedTool]);

    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!selectedTool || e.target !== stageRef.current) return;

        if (e.evt.button === 2) { // Right click
            e.evt.preventDefault();
            if (isDrawing && isLineTool(selectedTool.type)) {
                finishDrawing();
            }
            return;
        }

        if (e.evt.button !== 0) return; // Not a left click

        const pos = getRelativePointerPosition();

        if (isRectTool(selectedTool.type)) {
            setIsDrawing(true);
            startPosRef.current = pos;
            setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        } else if (isLineTool(selectedTool.type)) {
            if (!isDrawing) {
                setIsDrawing(true);
                setCurrentPoints([pos.x, pos.y, pos.x, pos.y]);
            } else {
                setCurrentPoints(prev => [...prev, pos.x, pos.y]);
            }
        }
    }, [selectedTool, isDrawing, getRelativePointerPosition, stageRef, finishDrawing, addObject, setSelectedTool]);

    const handleMouseMove = useCallback(() => {
        if (!isDrawing || !selectedTool) return;
        const pos = getRelativePointerPosition();
        if (isRectTool(selectedTool.type) && startPosRef.current && currentRect) {
            const newWidth = pos.x - startPosRef.current.x;
            const newHeight = pos.y - startPosRef.current.y;
            setCurrentRect({ ...currentRect, width: newWidth, height: newHeight });
        } else if (isLineTool(selectedTool.type)) {
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
        if (!isDrawing || !selectedTool || e.evt.button !== 0) return;
        if (isRectTool(selectedTool.type)) {
            finishDrawing();
        }
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
