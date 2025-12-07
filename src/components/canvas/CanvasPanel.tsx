
import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Transformer, Rect } from 'react-konva';
import useImage from 'use-image';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import { APDObject, LibraryItem, DrawingTool, isRectTool, isLineTool, isText } from '../../types/index';
import DraggableObject from '../draggable/DraggableObject';
import { EditingTextState, TextEditor } from './TextEditor';
import { useStageInteraction } from '../../hooks/useStageInteraction';
import { useDrawing } from '../../hooks/useDrawing';
import { useCanvasDrawing } from '../../hooks/useCanvasDrawing';
import { ItemTypes } from '../library/LibraryPanel';

// --- Helper Components ---

const UndoRedoControls = React.memo(({ undo, redo, canUndo, canRedo }: { undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean }) => (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={undo} disabled={!canUndo} className="bg-slate-700/80 hover:bg-slate-600/80 backdrop-blur-sm text-white font-bold p-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 19H6.22857C4.54714 19 3.55357 17.5119 4.10238 15.9881L5.78333 11.5833M10 19V16.5C10 14.8333 11.3333 13.5 13 13.5H15.5M10 19H14C15.1046 19 16 18.1046 16 17V15.5M5.78333 11.5833L7.14524 8.2381C7.59762 7.15476 8.65952 6.5 9.80952 6.5H16.5C17.8807 6.5 19 7.61929 19 9V12.5C19 13.8807 17.8807 15 16.5 15H13C11.3333 15 10 16.3333 10 18V19M5.78333 11.5833C4.10238 11.5833 3 10.481 3 8.8V6.2C3 5.0799 3.89543 4.2 5 4.2H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        <button onClick={redo} disabled={!canRedo} className="bg-slate-700/80 hover:bg-slate-600/80 backdrop-blur-sm text-white font-bold p-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="scale(-1, 1)"><path d="M10 19H6.22857C4.54714 19 3.55357 17.5119 4.10238 15.9881L5.78333 11.5833M10 19V16.5C10 14.8333 11.3333 13.5 13 13.5H15.5M10 19H14C15.1046 19 16 18.1046 16 17V15.5M5.78333 11.5833L7.14524 8.2381C7.59762 7.15476 8.65952 6.5 9.80952 6.5H16.5C17.8807 6.5 19 7.61929 19 9V12.5C19 13.8807 17.8807 15 16.5 15H13C11.3333 15 10 16.3333 10 18V19M5.78333 11.5833C4.10238 11.5833 3 10.481 3 8.8V6.2C3 5.0799 3.89543 4.2 5 4.2H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
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
    onTextCreate: (obj: APDObject) => void; // Callback to trigger text editing
}

export interface CanvasPanelRef {
    startTextEdit: (obj: APDObject) => void;
}

const CanvasPanel = forwardRef<CanvasPanelRef, CanvasPanelProps>(({
    stageRef, objects, background, selectedIds, setSelectedIds, checkDeselect, addObject, updateObject,
    removeObjects, handleFile, canUndo, canRedo, undo, redo, selectedTool, setSelectedTool, onTextCreate
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [editingText, setEditingText] = useState<EditingTextState | null>(null);
    const [pendingEditId, setPendingEditId] = useState<string | null>(null);
    const [bgImage] = useImage(background?.url || '', 'anonymous');

    const {
        drop, isOver, canDrop, draggedItemType
    } = useDrawing({ stageRef, selectedTool, addObject, setSelectedTool, onTextCreate });

    // --- Drawing Hook Integration ---
    const {
        isDrawing,
        currentPoints,
        currentRect,
        handleMouseDown: handleDrawingMouseDown,
        handleMouseMove: handleDrawingMouseMove,
        handleMouseUp: handleDrawingMouseUp,
        handleDoubleClick: handleDrawingDoubleClick,
        finishDrawing,
        cancelDrawing
    } = useCanvasDrawing({ stageRef, selectedTool, addObject, setSelectedTool, onTextCreate });

    const isInteractionBlocked = !!editingText || isDrawing || (!!selectedTool && (isLineTool(selectedTool.type) || isRectTool(selectedTool.type)));

    const {
        selectionBox, selectionRectRef,
        handleMouseDown: handleSelectionMouseDown,
        handleMouseMove: handleSelectionMouseMove,
        handleMouseUp: handleSelectionMouseUp,
        handleWheel
    } = useStageInteraction({ stageRef, objects, selectedIds, setSelectedIds, checkDeselect, isInteractionBlocked });

    useEffect(() => { if (containerRef.current) drop(containerRef.current); }, [drop]);

    const handleStartTextEdit = useCallback((obj: APDObject) => {
        const stage = stageRef.current;
        if (!stage) return;

        const textNode = stage.findOne('.' + obj.id);
        if (!textNode) {
            // Node not found yet (race condition), queue it
            setPendingEditId(obj.id);
            return;
        }

        // Node found, clear pending if it matches
        if (pendingEditId === obj.id) setPendingEditId(null);

        setSelectedIds([]);
        updateObject(obj.id, { visible: false }, false);

        // Get scaled and rotated position
        const transform = textNode.getAbsoluteTransform();
        const pos = { x: transform.getMatrix()[4], y: transform.getMatrix()[5] };

        const stageBox = stage.container().getBoundingClientRect();

        setEditingText({
            id: obj.id,
            text: obj.text || '',
            x: stageBox.left + pos.x,
            y: stageBox.top + pos.y,
            width: textNode.width() * textNode.scaleX(),
            height: textNode.height() * textNode.scaleY(),
            fontSize: obj.fontSize || 16,
            fontFamily: obj.fontFamily || 'sans-serif',
            fill: obj.fill || '#000',
            rotation: textNode.rotation(),
        });
    }, [stageRef, updateObject, setSelectedIds, pendingEditId]);

    // Effect to process pending edit when objects update
    useEffect(() => {
        if (pendingEditId) {
            const obj = objects.find(o => o.id === pendingEditId);
            if (obj) {
                // Try to start edit again. 
                // We need a slight delay or check to ensure Konva has drawn? 
                // Usually React update -> Effect -> Konva update (via props) -> Ref update.
                // Let's try calling it. logic inside handles check.
                handleStartTextEdit(obj);
            }
        }
    }, [objects, pendingEditId, handleStartTextEdit]);

    useImperativeHandle(ref, () => ({
        startTextEdit: handleStartTextEdit
    }));

    const handleObjectClick = (e: any) => {
        if (editingText || isDrawing) return;
        const id = e.target.id();
        const isShift = e.evt.shiftKey;
        const newSelectedIds = isShift ? (selectedIds.includes(id) ? selectedIds.filter(sid => sid !== id) : [...selectedIds, id]) : (selectedIds.length === 1 && selectedIds[0] === id ? [] : [id]);
        setSelectedIds(newSelectedIds);
    };

    const handleStageMouseDown = (e: any) => {
        if (e.target !== e.target.getStage()) return;

        if (selectedTool && (isLineTool(selectedTool.type) || isRectTool(selectedTool.type))) {
            handleDrawingMouseDown(e);
        } else {
            handleSelectionMouseDown(e);
            checkDeselect(e);
        }
    };

    const handleStageMouseMove = (e: any) => {
        if (isDrawing) {
            handleDrawingMouseMove();
        } else {
            handleSelectionMouseMove(e);
        }
    }

    const handleStageMouseUp = (e: any) => {
        if (isDrawing) {
            handleDrawingMouseUp(e);
        } else {
            handleSelectionMouseUp(e);
        }
    }

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedIds.length > 0 && !editingText) removeObjects(selectedIds); }
        if (e.key === 'Escape') {
            if (isDrawing) {
                cancelDrawing();
                setSelectedTool(null);
            } else {
                setSelectedIds([]);
                if (selectedTool) setSelectedTool(null);
            }
        }
        if (e.key === 'Enter') {
            if (isDrawing) {
                finishDrawing();
            }
        }
    }, [selectedIds.length, removeObjects, undo, redo, setSelectedIds, selectedTool, setSelectedTool, isDrawing, cancelDrawing, finishDrawing, editingText]);

    useEffect(() => {
        const checkSize = () => { if (containerRef.current) setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); };
        checkSize(); window.addEventListener('resize', checkSize);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('resize', checkSize);
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown]);

    useEffect(() => {
        if (background && bgImage && stageRef.current && size.width > 0) {
            const stage = stageRef.current;
            const scale = Math.min(size.width / background.width, size.height / background.height) * 0.95;
            stage.scale({ x: scale, y: scale });
            stage.position({ x: (size.width - background.width * scale) / 2, y: (size.height - background.height * scale) / 2 });
        }
    }, [background, bgImage, size, stageRef]);

    const handleTextUpdate = (newText: string, newWidth: number, newHeight: number) => {
        if (editingText) {
            updateObject(editingText.id, { text: newText, width: newWidth, height: newHeight, visible: true }, true);
            setSelectedIds([editingText.id]); // Re-select the object so it can be moved/resized immediately
            setEditingText(null);
        }
    };

    const handleTextCancel = () => {
        if (editingText) {
            updateObject(editingText.id, { visible: true }, false);
            setEditingText(null);
        }
    };

    return (
        <div className={`flex-1 relative overflow-hidden bg-slate-900 touch-none ${selectedTool ? 'cursor-crosshair' : 'cursor-grab'}`} ref={containerRef}>
            {!background ? <WelcomeScreen onFileSelect={handleFile} /> : (
                <>
                    <DropIndicator isOver={isOver && canDrop && draggedItemType === NativeTypes.FILE} />
                    <UndoRedoControls undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} />
                    <Stage
                        ref={stageRef}
                        width={size.width} height={size.height}
                        onMouseDown={handleStageMouseDown}
                        onMouseMove={handleStageMouseMove}
                        onMouseUp={handleStageMouseUp}
                        onDblClick={handleDrawingDoubleClick}
                        onWheel={handleWheel}
                        draggable={!isInteractionBlocked}
                    >
                        <Layer>
                            {bgImage && <KonvaImage image={bgImage} width={background.width} height={background.height} listening={false} />}
                        </Layer>
                        <Layer>
                            {objects.map((obj) => (
                                <DraggableObject
                                    key={obj.id}
                                    obj={obj}
                                    isSelected={selectedIds.includes(obj.id)}
                                    onSelect={handleObjectClick}
                                    onChange={(attrs, imm) => updateObject(obj.id, attrs, imm)}
                                    onTextDblClick={() => isText(obj) && handleStartTextEdit(obj)}
                                    isDrawing={isDrawing || !!selectedTool} // Pass isDrawing OR if a tool is selected (to be safe)
                                />
                            ))}
                            <Transformer
                                boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox}
                                anchorStroke="#007bff"
                                anchorFill="#fff"
                                anchorSize={10}
                                borderStroke="#007bff"
                                borderDash={[6, 2]}
                            />
                            <Rect ref={selectionRectRef} {...selectionBox} fill="rgba(0, 123, 255, 0.2)" stroke="rgba(0, 123, 255, 0.6)" strokeWidth={1} listening={false} />

                            {/* PREVIEW OF DRAWING */}
                            {isDrawing && currentRect && (
                                <Rect
                                    x={currentRect.x}
                                    y={currentRect.y}
                                    width={currentRect.width}
                                    height={currentRect.height}
                                    fill="rgba(0, 255, 0, 0.3)"
                                    stroke="green"
                                    strokeWidth={1}
                                />
                            )}
                            {isDrawing && currentPoints.length > 0 && (
                                <Line
                                    points={currentPoints}
                                    stroke="blue"
                                    strokeWidth={2}
                                    dash={[5, 5]}
                                />
                            )}

                        </Layer>
                    </Stage>
                    {editingText && <TextEditor editingState={editingText} onUpdate={handleTextUpdate} onCancel={handleTextCancel} />}
                </>
            )}
        </div>
    );
});

export default CanvasPanel;
