
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Transformer, Rect } from 'react-konva';
import useImage from 'use-image';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import { APDObject, LibraryItem, DrawingTool, isRectTool, isLineTool } from '../../types/index';
import DraggableObject from '../draggable/DraggableObject';
import { EditingTextState, TextEditor } from './TextEditor';
import { useStageInteraction } from '../../hooks/useStageInteraction';
import { useDrawing } from '../../hooks/useDrawing';
import { ItemTypes } from '../library/LibraryPanel';

// --- Helper Components ---

const UndoRedoControls = React.memo(({ undo, redo, canUndo, canRedo }: { undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean }) => (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={undo} disabled={!canUndo} className="bg-slate-700/80 hover:bg-slate-600/80 backdrop-blur-sm text-white font-bold p-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 19H6.22857C4.54714 19 3.55357 17.5119 4.10238 15.9881L5.78333 11.5833M10 19V16.5C10 14.8333 11.3333 13.5 13 13.5H15.5M10 19H14C15.1046 19 16 18.1046 16 17V15.5M5.78333 11.5833L7.14524 8.2381C7.59762 7.15476 8.65952 6.5 9.80952 6.5H16.5C17.8807 6.5 19 7.61929 19 9V12.5C19 13.8807 17.8807 15 16.5 15H13C11.3333 15 10 16.3333 10 18V19M5.78333 11.5833C4.10238 11.5833 3 10.481 3 8.8V6.2C3 5.0799 3.89543 4.2 5 4.2H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <button onClick={redo} disabled={!canRedo} className="bg-slate-700/80 hover:bg-slate-600/80 backdrop-blur-sm text-white font-bold p-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="scale(-1, 1)"><path d="M10 19H6.22857C4.54714 19 3.55357 17.5119 4.10238 15.9881L5.78333 11.5833M10 19V16.5C10 14.8333 11.3333 13.5 13 13.5H15.5M10 19H14C15.1046 19 16 18.1046 16 17V15.5M5.78333 11.5833L7.14524 8.2381C7.59762 7.15476 8.65952 6.5 9.80952 6.5H16.5C17.8807 6.5 19 7.61929 19 9V12.5C19 13.8807 17.8807 15 16.5 15H13C11.3333 15 10 16.3333 10 18V19M5.78333 11.5833C4.10238 11.5833 3 10.481 3 8.8V6.2C3 5.0799 3.89543 4.2 5 4.2H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
    </div>
));

const WelcomeScreen: React.FC<{ onFileSelect: (file: File) => void }> = ({ onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [{ isOver }, drop] = useDrop(() => ({
        accept: [NativeTypes.FILE],
        drop: (item: { files: File[] }) => onFileSelect(item.files[0]),
        collect: (monitor) => ({ isOver: monitor.isOver() && monitor.canDrop() })
    }));
    return (
        <div ref={drop} className={`absolute inset-0 flex items-center justify-center z-10 bg-slate-900/50 transition-all ${isOver ? 'bg-blue-900/70' : ''}`}>
            <div className={`relative flex flex-col items-center justify-center w-4/5 max-w-2xl p-16 border-4 border-dashed rounded-2xl bg-slate-800 group transition-all duration-300 ${isOver ? 'border-blue-400' : 'border-slate-600 group-hover:border-blue-500'}`} onClick={() => fileInputRef.current?.click()}>
                <svg className={`w-20 h-20 text-slate-500 group-hover:text-blue-500 transition-colors duration-300 mb-6 ${isOver ? 'text-blue-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <h2 className="text-3xl font-bold text-white mb-2">Dra & Släpp Din Ritning Här</h2>
                <p className="text-slate-400 mb-8">Börja ditt projekt genom att ladda upp en PDF, PNG, JPG eller "APD-fil".</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,.apd" onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} />
                <button className="sparkle-button sparkle-blue" onClick={() => fileInputRef.current?.click()}><span className="spark"></span><span className="text">Eller Klicka För Att Välja Fil</span></button>
            </div>
        </div>
    );
};

const DropIndicator: React.FC<{ isOver: boolean }> = ({ isOver }) => {
    if (!isOver) return null;
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-blue-900/50 border-4 border-dashed border-blue-400 rounded-lg pointer-events-none">
            <h2 className="text-3xl font-bold text-white">Släpp filen för att ladda upp</h2>
        </div>
    );
}

// --- Main Canvas Panel Component ---

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
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({ 
    stageRef, objects, background, selectedIds, setSelectedIds, checkDeselect, addObject, updateObject, 
    removeObjects, handleFile, canUndo, canRedo, undo, redo, selectedTool, setSelectedTool
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trRef = useRef<any>(null);
    const [bgImage] = useImage(background?.url || '', 'anonymous');
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [editingText, setEditingText] = useState<EditingTextState | null>(null);
    const [textToEditOnLoad, setTextToEditOnLoad] = useState<string | null>(null);

    const {
        drop, isOver, canDrop, draggedItemType, tempLinePoints, drawingState, isInteractionBlocked: isDrawingBlocked,
        startDrawing, cancelDrawing,
        handleStageClick: handleDrawingClick,
        handleMouseMove: handleDrawingMouseMove,
        handleContextMenu: handleDrawingContextMenu,
    } = useDrawing({ stageRef, addObject, handleFile, setTextToEditOnLoad });

    useEffect(() => {
        if (selectedTool && isLineTool(selectedTool.type)) {
            startDrawing(selectedTool);
            setSelectedTool(null);
        }
    }, [selectedTool, startDrawing, setSelectedTool]);

    const isInteractionBlocked = isDrawingBlocked || !!editingText;

    const { 
        selectionBox, selectionRectRef,
        handleMouseDown: handleSelectionMouseDown,
        handleMouseMove: handleSelectionMouseMove,
        handleMouseUp: handleSelectionMouseUp,
        handleWheel 
    } = useStageInteraction({ stageRef, objects, selectedIds, setSelectedIds, checkDeselect, isInteractionBlocked });

    useEffect(() => { if (containerRef.current) drop(containerRef.current); }, [drop]);
    
    const handleTextDblClick = useCallback((obj: APDObject) => {
        const stage = stageRef.current; if (!stage) return;
        const textNode = stage.findOne('.' + obj.id);
        if (!textNode) return;
        setSelectedIds([]); trRef.current?.nodes([]);
        updateObject(obj.id, { visible: false }, false);
        const textPosition = textNode.getAbsolutePosition();
        const stageBox = stage.container().getBoundingClientRect();
        setEditingText({
            id: obj.id, 
            text: obj.text || '',
            x: stageBox.left + textPosition.x, 
            y: stageBox.top + textPosition.y,
            width: textNode.getAttr('width') * textNode.getAttr('scaleX'),
            height: textNode.getAttr('height') * textNode.getAttr('scaleY'),
            fontSize: textNode.getAttr('fontSize'),
            fontFamily: textNode.getAttr('fontFamily'),
            fill: textNode.getAttr('fill'),
            rotation: textNode.getAttr('rotation'),
        });
    }, [stageRef, updateObject, setSelectedIds]);

    useEffect(() => {
        if (textToEditOnLoad && stageRef.current) {
            const objectToEdit = objects.find(o => o.id === textToEditOnLoad);
            if (objectToEdit) {
                setTimeout(() => {
                    handleTextDblClick(objectToEdit);
                    setTextToEditOnLoad(null);
                }, 50);
            }
        }
    }, [textToEditOnLoad, objects, handleTextDblClick]);

    const handleObjectClick = (e: any) => {
        if (editingText || drawingState) return;
        const id = e.target.id();
        const isShift = e.evt.shiftKey;
        const newSelectedIds = isShift ? (selectedIds.includes(id) ? selectedIds.filter(sid => sid !== id) : [...selectedIds, id]) : (selectedIds.length === 1 && selectedIds[0] === id ? [] : [id]);
        setSelectedIds(newSelectedIds);
    };

    const handleStageMouseDown = (e: any) => {
        if (drawingState) return;
        handleSelectionMouseDown(e);
    };

    const handleStageMouseMove = (e: any) => {
        handleSelectionMouseMove(e);
        handleDrawingMouseMove(e);
    };

    const handleStageClick = (e: any) => {
        if (e.target !== e.target.getStage()) return;
        if (editingText) { document.querySelector('textarea')?.blur(); return; }
        handleDrawingClick(e);
    };
    
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (drawingState) cancelDrawing();
            if (selectedIds.length > 0) setSelectedIds([]);
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedIds.length > 0) removeObjects(selectedIds); }

    }, [drawingState, cancelDrawing, selectedIds, setSelectedIds, undo, redo, removeObjects]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        const checkSize = () => { if (containerRef.current) setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); };
        checkSize(); window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    useEffect(() => {
        if (background && bgImage && stageRef.current && size.width > 0) {
            const stage = stageRef.current;
            const scale = Math.min(size.width / background.width, size.height / background.height) * 0.95;
            stage.scale({ x: scale, y: scale });
            stage.position({ x: (size.width - background.width * scale) / 2, y: (size.height - background.height * scale) / 2 });
        }
    }, [background, bgImage, size, stageRef]);

    useEffect(() => {
        if (trRef.current && stageRef.current) {
            const nodes = selectedIds.map(id => stageRef.current.findOne('.' + id)).filter(Boolean);
            trRef.current.nodes(nodes);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selectedIds, objects]);

    const handleTextUpdate = (newText: string, newWidth: number, newHeight: number) => {
        if (editingText) {
            updateObject(editingText.id, { text: newText, width: newWidth, height: newHeight, visible: true }, true);
            setEditingText(null);
        }
    };

    const handleTextCancel = () => {
        if (editingText) {
            updateObject(editingText.id, { visible: true }, false);
            setEditingText(null);
        }
    };

    const handleTransformEnd = () => {
        if (!trRef.current) return;
        trRef.current.nodes().forEach((node: any) => {
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            updateObject(
                node.id(), 
                { 
                    x: node.x(), 
                    y: node.y(), 
                    rotation: node.rotation(), 
                    width: Math.max(5, node.width() * scaleX), 
                    height: Math.max(5, node.height() * scaleY), 
                }, 
                true
            );
        });
    };

    return (
        <div className={`flex-1 relative overflow-hidden bg-slate-900 touch-none ${drawingState ? 'cursor-crosshair' : 'cursor-grab'}`} ref={containerRef}>
            {!background ? <WelcomeScreen onFileSelect={handleFile} /> : (
                <>
                    <DropIndicator isOver={isOver && canDrop && draggedItemType === ItemTypes.FILE} />
                    <UndoRedoControls undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} />
                    <Stage
                        ref={stageRef}
                        width={size.width} height={size.height}
                        onMouseDown={handleStageMouseDown}
                        onMouseMove={handleStageMouseMove}
                        onMouseUp={handleSelectionMouseUp}
                        onClick={handleStageClick}
                        onContextMenu={handleDrawingContextMenu}
                        onWheel={handleWheel}
                        draggable={!isInteractionBlocked && !selectedIds.length}
                    >
                        <Layer>
                            {bgImage && <KonvaImage image={bgImage} width={background.width} height={background.height} listening={false} />}
                        </Layer>
                        <Layer>
                            {tempLinePoints.length > 0 && drawingState && (
                                <Line points={tempLinePoints} stroke={drawingState.item.initialProps?.stroke || '#ff0000'} strokeWidth={drawingState.item.initialProps?.strokeWidth || 5} dash={drawingState.item.initialProps?.dash} tension={isLineTool(drawingState.type) && drawingState.type === 'pen' ? 0.5 : 0} lineCap="round" listening={false}/>
                            )}
                            {objects.map((obj) => (
                                <DraggableObject key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)} onSelect={handleObjectClick} onChange={(attrs, imm) => updateObject(obj.id, attrs, imm)} onTextDblClick={() => isRectTool(obj.type) && obj.type === 'text' && handleTextDblClick(obj)}/>
                            ))}
                            <Transformer 
                                ref={trRef} 
                                boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} 
                                anchorStroke="#007bff" 
                                anchorFill="#fff" 
                                anchorSize={10} 
                                borderStroke="#007bff" 
                                borderDash={[6, 2]} 
                                rotateEnabled={!selectedIds.some(id => { const obj = objects.find(o => o.id === id); return obj && isLineTool(obj.type);})}
                                onTransformEnd={handleTransformEnd} />
                            <Rect ref={selectionRectRef} {...selectionBox} fill="rgba(0, 123, 255, 0.2)" stroke="rgba(0, 123, 255, 0.6)" strokeWidth={1} listening={false} />
                        </Layer>
                    </Stage>
                    {editingText && <TextEditor editingState={editingText} onUpdate={handleTextUpdate} onCancel={handleTextCancel} />}
                </>
            )}
        </div>
    );
};

export default CanvasPanel;
