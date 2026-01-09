
import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import { APDObject, LibraryItem, isLineTool, isRectTool } from '../types';

interface UseCanvasDrawingProps {
    stageRef: React.RefObject<Konva.Stage>;
    selectedTool: LibraryItem | null;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => APDObject;
    setSelectedTool: (tool: LibraryItem | null) => void;
    isCalibrating?: boolean;
    onCalibrationFinished?: (pixels: number) => void;
}

export const useCanvasDrawing = ({
    stageRef,
    selectedTool,
    addObject,
    setSelectedTool,
    isCalibrating,
    onCalibrationFinished
}: UseCanvasDrawingProps) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<number[]>([]);
    const [currentRect, setCurrentRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const startPosRef = useRef<{ x: number, y: number } | null>(null);
    const [isSnappedToStart, setIsSnappedToStart] = useState(false);

    // ... getRelativePointerPosition (unchanged) ...
    const getRelativePointerPosition = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return { x: 0, y: 0 };
        const pos = stage.getPointerPosition();
        if (!pos) return { x: 0, y: 0 };
        const transform = stage.getAbsoluteTransform().copy().invert();
        return transform.point(pos);
    }, [stageRef]);

    const finishDrawing = useCallback(() => {
        if (isCalibrating && currentPoints.length >= 4) {
            const startX = currentPoints[0];
            const startY = currentPoints[1];
            const endX = currentPoints[currentPoints.length - 2];
            const endY = currentPoints[currentPoints.length - 1];
            const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            if (onCalibrationFinished) onCalibrationFinished(dist);

            setIsDrawing(false);
            setCurrentPoints([]);
            return;
        }

        if (!selectedTool) return;

        if (isRectTool(selectedTool.type) && currentRect && startPosRef.current) {
            const finalX = currentRect.width < 0 ? startPosRef.current.x + currentRect.width : startPosRef.current.x;
            const finalY = currentRect.height < 0 ? startPosRef.current.y + currentRect.height : startPosRef.current.y;
            const finalWidth = Math.abs(currentRect.width);
            const finalHeight = Math.abs(currentRect.height);

            if (finalWidth > 2 && finalHeight > 2) {
                addObject(selectedTool, { x: finalX, y: finalY }, {
                    ...selectedTool.initialProps,
                    width: finalWidth,
                    height: finalHeight,
                });
            }
        } else if (isLineTool(selectedTool.type) && currentPoints.length >= 4) {
            // B-1 & UX-2 Fix: Convert points to be relative to the object's origin (the first point)
            const startX = currentPoints[0];
            const startY = currentPoints[1];

            const relativePoints = currentPoints.map((val, i) =>
                i % 2 === 0 ? val - startX : val - startY
            );

            // Calculate width and height from the relative points
            const xCoords = relativePoints.filter((_, i) => i % 2 === 0);
            const yCoords = relativePoints.filter((_, i) => i % 2 !== 0);
            const width = Math.max(...xCoords) - Math.min(...xCoords);
            const height = Math.max(...yCoords) - Math.min(...yCoords);

            if (width > 2 || height > 2) {
                addObject(selectedTool, { x: startX, y: startY }, {
                    ...selectedTool.initialProps,
                    points: relativePoints,
                    width: width,
                    height: height,
                });
            }
        }

        setIsDrawing(false);
        setCurrentPoints([]);
        setCurrentRect(null);
        startPosRef.current = null;
        setSelectedTool(null);
    }, [selectedTool, currentRect, currentPoints, addObject, setSelectedTool, isCalibrating, onCalibrationFinished]);

    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if ((!selectedTool && !isCalibrating) || e.target !== stageRef.current) return;

        if (e.evt.button === 2) {
            e.evt.preventDefault();
            if (isDrawing && (isCalibrating || (selectedTool && isLineTool(selectedTool.type)))) {
                finishDrawing();
            }
            return;
        }

        if (e.evt.button !== 0) return;

        const pos = getRelativePointerPosition();

        if (isCalibrating) {
            if (!isDrawing) {
                setIsDrawing(true);
                setCurrentPoints([pos.x, pos.y, pos.x, pos.y]);
            } else {
                setCurrentPoints(prev => [...prev, pos.x, pos.y]);
            }
            return;
        }

        if (isRectTool(selectedTool!.type)) {
            setIsDrawing(true);
            startPosRef.current = pos;
            setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        } else if (isLineTool(selectedTool!.type)) {
            if (!isDrawing) {
                setIsDrawing(true);
                setCurrentPoints([pos.x, pos.y, pos.x, pos.y]);
            } else {
                setCurrentPoints(prev => [...prev, pos.x, pos.y]);
            }
        }
    }, [selectedTool, isDrawing, getRelativePointerPosition, stageRef, finishDrawing, isCalibrating]);

    const handleMouseMove = useCallback(() => {
        if (!isDrawing) return;
        const pos = getRelativePointerPosition();

        if (isCalibrating) {
            setCurrentPoints(prev => {
                if (prev.length < 2) return prev;
                const newPoints = [...prev];
                newPoints[newPoints.length - 2] = pos.x;
                newPoints[newPoints.length - 1] = pos.y;
                return newPoints;
            });
            return;
        }

        if (!selectedTool) return;

        if (isRectTool(selectedTool.type) && startPosRef.current && currentRect) {
            const newWidth = pos.x - startPosRef.current.x;
            const newHeight = pos.y - startPosRef.current.y;
            setCurrentRect({ ...currentRect, width: newWidth, height: newHeight });
        } else if (isLineTool(selectedTool.type)) {
            setCurrentPoints(prev => {
                if (prev.length < 2) return prev;

                let x = pos.x;
                let y = pos.y;
                let snapped = false;

                // Snap to start point logic
                if (prev.length >= 4) { // Need at least start point + one other point to snap back
                    const startX = prev[0];
                    const startY = prev[1];
                    const dist = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));

                    if (dist < 15) { // Increased to 15px for better "magnetic" feel
                        x = startX;
                        y = startY;
                        snapped = true;
                    }
                }

                if (snapped !== isSnappedToStart) {
                    setIsSnappedToStart(snapped);
                }

                const newPoints = [...prev];
                newPoints[newPoints.length - 2] = x;
                newPoints[newPoints.length - 1] = y;
                return newPoints;
            });
        }
    }, [isDrawing, selectedTool, getRelativePointerPosition, currentRect, isCalibrating, isSnappedToStart]);

    const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || e.evt.button !== 0) return;

        if (isCalibrating) return; // Keep line open for multiple clicks? No, usually 2 points.
        // If we want simple drag-line:
        // Actually, logic above supports polyline.
        // For calibration, maybe just 2 points? 
        // Let's keep polyline behavior for consistency, user right-clicks to finish.

        if (!selectedTool) return;
        if (isRectTool(selectedTool.type)) {
            finishDrawing();
        }
    }, [isDrawing, selectedTool, finishDrawing, isCalibrating]);

    const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (isDrawing && (isCalibrating || (selectedTool && isLineTool(selectedTool.type)))) {
            finishDrawing();
        }
    }, [isDrawing, selectedTool, finishDrawing, isCalibrating]);

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
        isSnappedToStart,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleDoubleClick,
        finishDrawing,
        cancelDrawing
    };
};
