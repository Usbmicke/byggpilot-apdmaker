
import React, { useRef, useState, useEffect, useCallback, forwardRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Transformer, Rect, Circle } from 'react-konva';
import useImage from 'use-image';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import { APDObject, LibraryItem, isRectTool, isLineTool, isCrane } from '../../types/index';
import DraggableObject from '../draggable/DraggableObject';
import { useStageInteraction } from '../../hooks/useStageInteraction';
import { useDrawing } from '../../hooks/useDrawing';
import { useCanvasDrawing } from '../../hooks/useCanvasDrawing';

const CRANE_ANCHORS = ['middle-left', 'middle-right'];

const UndoRedoControls = React.memo(({ undo, redo, canUndo, canRedo }: { undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean }) => (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={undo} disabled={!canUndo} className="bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm text-white font-bold p-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 19H6.22857C4.54714 19 3.55357 17.5119 4.10238 15.9881L5.78333 11.5833M10 19V16.5C10 14.8333 11.3333 13.5 13 13.5H15.5M10 19H14C15.1046 19 16 18.1046 16 17V15.5M5.78333 11.5833L7.14524 8.2381C7.59762 7.15476 8.65952 6.5 9.80952 6.5H16.5C17.8807 6.5 19 7.61929 19 9V12.5C19 13.8807 17.8807 15 16.5 15H13C11.3333 15 10 16.3333 10 18V19M5.78333 11.5833C4.10238 11.5833 3 10.481 3 8.8V6.2C3 5.0799 3.89543 4.2 5 4.2H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        <button onClick={redo} disabled={!canRedo} className="bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm text-white font-bold p-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="scale(-1, 1)"><path d="M10 19H6.22857C4.54714 19 3.55357 17.5119 4.10238 15.9881L5.78333 11.5833M10 19V16.5C10 14.8333 11.3333 13.5 13 13.5H15.5M10 19H14C15.1046 19 16 18.1046 16 17V15.5M5.78333 11.5833L7.14524 8.2381C7.59762 7.15476 8.65952 6.5 9.80952 6.5H16.5C17.8807 6.5 19 7.61929 19 9V12.5C19 13.8807 17.8807 15 16.5 15H13C11.3333 15 10 16.3333 10 18V19M5.78333 11.5833C4.10238 11.5833 3 10.481 3 8.8V6.2C3 5.0799 3.89543 4.2 5 4.2H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
    </div>
));

const WelcomeScreen: React.FC<{ onFileSelect: (file: File) => void, isGlobalDragging: boolean }> = ({ onFileSelect, isGlobalDragging }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [{ isOverLocal }, drop] = useDrop(() => ({ accept: [NativeTypes.FILE], drop: (item: { files: File[] }) => onFileSelect(item.files[0]), collect: (monitor) => ({ isOverLocal: monitor.isOver() && monitor.canDrop() }) }));

    // Highlight if hovering locally OR if dragging globally (anywhere on screen)
    const isHighlighted = isOverLocal || isGlobalDragging;

    return (
        <div ref={drop} className={`absolute inset-0 flex items-center justify-center z-10 bg-[#09090b]/50 transition-all ${isHighlighted ? 'bg-[#09090b]/70' : ''}`}>
            <div className={`relative flex flex-col items-center justify-center w-4/5 max-w-2xl p-16 border-4 border-dashed rounded-2xl bg-zinc-900 group transition-all duration-300 ${isHighlighted ? 'border-zinc-400 scale-105 shadow-2xl shadow-zinc-500/50' : 'border-zinc-700 group-hover:border-zinc-500'}`} onClick={() => fileInputRef.current?.click()}>
                <svg className={`w-20 h-20 text-zinc-600 group-hover:text-zinc-400 transition-colors duration-300 mb-6 ${isHighlighted ? 'text-zinc-300' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <h2 className="text-3xl font-bold text-white mb-2">Dra & Släpp Din Ritning Här</h2>
                <p className="text-zinc-400 mb-8">Börja ditt projekt genom att ladda upp en PDF, PNG eller JPG.</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,.apd" onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} />
                <button className="sparkle-button sparkle-premium" onClick={() => fileInputRef.current?.click()}><span className="spark"></span><span className="text">Eller Klicka För Att Välja Fil</span></button>
            </div>
        </div>
    );
};

// DropIndicator removed as per user request (integrated into WelcomeScreen)

interface CanvasPanelProps {
    stageRef: React.RefObject<any>;
    objects: APDObject[];
    background: { url: string; width: number; height: number; } | null;
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
    checkDeselect: (e: any) => void;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => APDObject;
    updateObject: (id: string, attrs: Partial<APDObject>, immediate: boolean) => void;
    removeObjects: (ids: string[]) => void;
    handleFile: (file: File) => void;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    selectedTool: LibraryItem | null;
    setSelectedTool: (item: LibraryItem | null) => void;
    isCalibrating?: boolean;
    onCalibrationFinished?: (pixels: number) => void;
    scale?: number;
}

export interface CanvasPanelRef { }

const CanvasPanel = forwardRef<CanvasPanelRef, CanvasPanelProps>((
    { stageRef, objects, background, selectedIds, setSelectedIds, checkDeselect, addObject, updateObject, removeObjects, handleFile, canUndo, canRedo, undo, redo, selectedTool, setSelectedTool, isCalibrating, onCalibrationFinished, scale = 1 }, ref
) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        // Global drop handled by wrapper, but if we need local logic:
    };




    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const trRef = useRef<any>(null);
    const [isTransforming, setIsTransforming] = useState(false);

    const imageUrl = background?.url || '';
    const isDataUrl = imageUrl.startsWith('data:') || imageUrl.startsWith('blob:');
    const [bgImage] = useImage(imageUrl, isDataUrl ? undefined : 'anonymous');

    const { drop, isOver, canDrop, draggedItemType } = useDrawing({ stageRef, selectedTool, addObject, setSelectedTool, onTextCreate: (obj) => { /* Text creation handled by tool */ }, onFileDrop: handleFile, objects });

    const { isDrawing, currentPoints, currentRect, handleMouseDown: handleDrawingMouseDown, handleMouseMove: handleDrawingMouseMove, handleMouseUp: handleDrawingMouseUp, finishDrawing, cancelDrawing, isSnappedToStart } = useCanvasDrawing({ stageRef, selectedTool, addObject, setSelectedTool, isCalibrating: isCalibrating || false, onCalibrationFinished });

    const isInteractionBlocked = isDrawing || isTransforming || (!!selectedTool && (isLineTool(selectedTool.type) || isRectTool(selectedTool.type))) || !!isCalibrating;

    const { selectionBox, selectionRectRef, handleMouseDown: handleSelectionMouseDown, handleMouseMove: handleSelectionMouseMove, handleMouseUp: handleSelectionMouseUp } = useStageInteraction({ stageRef, objects, selectedIds, setSelectedIds, checkDeselect, isInteractionBlocked });

    useEffect(() => {
        if (trRef.current && stageRef.current) {
            // Safer selection: explicitly find nodes by ID
            const selectedNodes = selectedIds
                .map(id => stageRef.current.findOne('#' + id))
                .filter(node => node !== undefined && node !== null);
            trRef.current.nodes(selectedNodes);

            selectedNodes.forEach((node: any) => {
                node.draggable(!isTransforming);
            });

            trRef.current.getLayer()?.batchDraw();
        }
    }, [selectedIds, isTransforming, stageRef, objects]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const isDrawingToolActive = selectedTool && (isLineTool(selectedTool.type) || isRectTool(selectedTool.type));
            container.style.cursor = isDrawingToolActive ? 'crosshair' : 'default';
        }
    }, [selectedTool]);

    useEffect(() => { if (containerRef.current) drop(containerRef.current); }, [drop]);

    const handleObjectClick = (e: any) => {
        if (isDrawing) return;
        const id = e.currentTarget.id(); // UX FIX: Use currentTarget to get the Group ID, not the inner Shape ID
        const isShift = e.evt.shiftKey;
        const newSelectedIds = isShift
            ? (selectedIds.includes(id) ? selectedIds.filter(sid => sid !== id) : [...selectedIds, id])
            : (selectedIds.length === 1 && selectedIds[0] === id ? [] : [id]);
        setSelectedIds(newSelectedIds);
    };

    const handleStageMouseDown = (e: any) => {
        if (e.target !== e.target.getStage()) return;
        if (isDrawing || isCalibrating || (selectedTool && (isLineTool(selectedTool.type) || isRectTool(selectedTool.type)))) {
            handleDrawingMouseDown(e);
        } else {
            handleSelectionMouseDown(e);
            checkDeselect(e);
        }
    };

    const handleStageMouseMove = (e: any) => {
        if (isDrawing) handleDrawingMouseMove();
        else handleSelectionMouseMove(e);
    }

    const handleStageMouseUp = (e: any) => {
        if (isDrawing) handleDrawingMouseUp(e);
        else handleSelectionMouseUp(e);
    }

    const handleContextMenu = (e: any) => {
        e.evt.preventDefault();
        if (isDrawing) {
            finishDrawing();
        }
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedIds.length > 0) removeObjects(selectedIds); }
        if (e.key === 'Escape') {
            if (isDrawing) {
                cancelDrawing();
            } else {
                setSelectedIds([]);
                if (selectedTool) setSelectedTool(null);
            }
        }
        if (e.key === 'Enter' && isDrawing) finishDrawing();
    }, [selectedIds.length, removeObjects, undo, redo, setSelectedIds, selectedTool, setSelectedTool, isDrawing, cancelDrawing, finishDrawing]);

    useEffect(() => {
        const checkSize = () => { if (containerRef.current) setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); };
        checkSize();
        const observer = new ResizeObserver(checkSize);
        if (containerRef.current) observer.observe(containerRef.current);
        window.addEventListener('keydown', handleKeyDown);
        return () => { observer.disconnect(); window.removeEventListener('keydown', handleKeyDown); }
    }, [handleKeyDown]);

    useEffect(() => {
        if (background && bgImage && stageRef.current && size.width > 0) {
            const stage = stageRef.current;
            const scale = Math.min(size.width / background.width, size.height / background.height) * 0.95;
            stage.scale({ x: scale, y: scale });
            stage.position({ x: (size.width - background.width * scale) / 2, y: (size.height - background.height * scale) / 2 });
        }
    }, [background, bgImage, size, stageRef]);

    const onTransformStart = () => {
        setIsTransforming(true);
    };

    const onTransformEnd = (e: any) => {
        const node = e.target;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        const obj = objects.find(o => o.id === node.id());
        if (!obj) {
            setIsTransforming(false);
            return;
        }

        const attrs: Partial<APDObject> = {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
        };

        if (isCrane(obj)) {
            const currentRadius = obj.radius || 100;
            const newRadius = Math.max(20, currentRadius * scaleX);
            attrs.radius = newRadius;
        } else {
            attrs.width = Math.max(5, node.width() * scaleX);
            attrs.height = Math.max(5, node.height() * scaleY);
        }

        updateObject(node.id(), attrs, true);
        setIsTransforming(false);
    };

    const selectedObject = selectedIds.length === 1 ? objects.find(obj => obj.id === selectedIds[0]) : undefined;
    const isSingleCraneSelected = selectedObject && isCrane(selectedObject);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 bg-zinc-600 overflow-hidden outline-none" tabIndex={0}>
            {!background && <WelcomeScreen onFileSelect={handleFile} isGlobalDragging={isOver && canDrop && draggedItemType === NativeTypes.FILE} />}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div className="bg-zinc-800 text-white px-3 py-1 rounded shadow text-sm">{Math.round(size.width)} x {Math.round(size.height)} px</div>
            </div>
            <UndoRedoControls undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} />
            {/* TRASH CAN OVERLAY */}
            {/* Visible if something is selected or we act like it's a drop zone */}
            <div
                className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${selectedIds.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}
            >
                <div className="bg-red-500 text-white p-3 rounded-full shadow-lg flex items-center gap-2 border-2 border-white">
                    {/* Trash Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="font-bold text-sm">Dra hit för att ta bort</span>
                </div>
            </div>
            {background && (
                <Stage
                    ref={stageRef}
                    width={size.width}
                    height={size.height}
                    onMouseDown={handleStageMouseDown}
                    onMouseMove={handleStageMouseMove}
                    onMouseUp={handleStageMouseUp}
                    onClick={checkDeselect}
                    onContextMenu={handleContextMenu}
                >
                    <Layer>
                        {bgImage && background.width > 0 && background.height > 0 && (
                            <KonvaImage
                                image={bgImage}
                                width={background.width}
                                height={background.height}
                                listening={false}
                            />
                        )}
                        {objects.map((obj) => (
                            <DraggableObject
                                key={obj.id}
                                obj={obj}
                                objects={objects}
                                isSelected={selectedIds.includes(obj.id)}
                                onSelect={handleObjectClick}
                                onChange={(attrs, immediate) => updateObject(obj.id, attrs, immediate)}
                                onDelete={() => {
                                    removeObjects([obj.id]);
                                    setSelectedIds([]);
                                }}
                                isDrawing={isDrawing || isTransforming}
                                scale={scale}
                            />
                        ))}
                        <Transformer
                            ref={trRef}
                            boundBoxFunc={(oldBox, newBox) => newBox.width < 1 || newBox.height < 1 ? oldBox : newBox}
                            anchorStroke="#a1a1aa" // Zinc 400
                            anchorFill="#18181b" // Zinc 900
                            anchorSize={10}
                            borderStroke="#a1a1aa"
                            borderDash={[6, 2]}
                            keepRatio={true}
                            enabledAnchors={isSingleCraneSelected ? CRANE_ANCHORS : undefined}
                            onTransformStart={onTransformStart}
                            onTransformEnd={onTransformEnd}
                        />
                        <Rect ref={selectionRectRef} {...selectionBox} fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.5)" strokeWidth={1} listening={false} />
                        {isDrawing && currentRect && <Rect x={currentRect.x} y={currentRect.y} width={currentRect.width} height={currentRect.height} fill={selectedTool?.initialProps?.fill || "rgba(255, 255, 255, 0.1)"} stroke={selectedTool?.initialProps?.stroke || "white"} strokeWidth={1} listening={false} />}
                        {isDrawing && currentPoints.length > 0 && (
                            <>
                                <Line points={currentPoints} stroke={selectedTool?.initialProps?.stroke || (isCalibrating ? "#ff00ff" : "white")} strokeWidth={isCalibrating ? 3 : 2} dash={isCalibrating ? undefined : [5, 5]} listening={false} />
                                {isSnappedToStart && (
                                    <React.Fragment>
                                        <Circle
                                            x={currentPoints[0]}
                                            y={currentPoints[1]}
                                            radius={3}
                                            fill="#4ade80"
                                            stroke="#ffffff"
                                            strokeWidth={1.5}
                                            opacity={0.8}
                                            listening={false}
                                        />
                                        <Circle
                                            x={currentPoints[0]}
                                            y={currentPoints[1]}
                                            radius={6}
                                            stroke="#4ade80"
                                            strokeWidth={1}
                                            opacity={0.5}
                                            listening={false}
                                        />
                                    </React.Fragment>
                                )}
                            </>
                        )}
                    </Layer>
                </Stage>
            )}
        </div>
    );
});

export default CanvasPanel;
