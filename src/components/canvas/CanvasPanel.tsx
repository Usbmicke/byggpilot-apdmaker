
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Transformer, Rect, Group } from 'react-konva';
import useImage from 'use-image';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import { APDObject, LibraryItem, DrawingTool, isRectTool, isLineTool, isSymbol } from '../../types/index';
import DraggableObject from '../draggable/DraggableObject';
import { ItemTypes } from '../library/LibraryPanel';

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

interface CanvasPanelProps {
    stageRef: React.RefObject<any>;
    objects: APDObject[];
    background: { url: string; width: number; height: number; } | null;
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
    checkDeselect: (e: any) => void;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => void;
    updateObject: (id: string, attrs: Partial<APDObject>, immediate: boolean) => void;
    removeObjects: (ids: string[]) => void; 
    drawingState: { type: DrawingTool; points: number[]; item: LibraryItem; } | null;
    setDrawingState: React.Dispatch<React.SetStateAction<{ type: DrawingTool; points: number[]; item: LibraryItem; } | null>>;
    pendingItem: LibraryItem | null;
    setPendingItem: (item: LibraryItem | null) => void;
    handleFile: (file: File) => void;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({ 
    stageRef, objects, background, selectedIds, setSelectedIds, checkDeselect, addObject, updateObject, 
    removeObjects, drawingState, setDrawingState, pendingItem, setPendingItem, handleFile, 
    canUndo, canRedo, undo, redo
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trRef = useRef<any>(null);
    const [bgImage] = useImage(background?.url || '', 'anonymous');
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [tempLinePoints, setTempLinePoints] = useState<number[]>([]);
    const [editingText, setEditingText] = useState<APDObject | null>(null);
    const textEditRef = useRef<HTMLTextAreaElement>(null);
    const selectionRectRef = useRef<any>(null);
    const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });
    
    const [{ isOver, canDrop, draggedItemType }, drop] = useDrop(() => ({
        accept: [ItemTypes.LIBRARY_ITEM, NativeTypes.FILE],
        drop: (item: any, monitor) => {
            const stage = stageRef.current;
            if (!stage) return;
            const type = monitor.getItemType();

            if (type === NativeTypes.FILE) {
                if (item.files && item.files.length > 0) handleFile(item.files[0]);
            } else if (type === ItemTypes.LIBRARY_ITEM) {
                const offset = monitor.getClientOffset();
                if (!offset) return;
                
                const stageRect = stage.container().getBoundingClientRect();
                const relativePos = {
                    x: (offset.x - stageRect.left - stage.x()) / stage.scaleX(),
                    y: (offset.y - stageRect.top - stage.y()) / stage.scaleY(),
                };

                if (isSymbol(item.type)) {
                    addObject(item, relativePos);
                } else {
                    setPendingItem(item);
                }
            }
        },
        collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop(), draggedItemType: monitor.getItemType() }),
    }), [stageRef, handleFile, addObject, setPendingItem]);

    useEffect(() => {
        if (containerRef.current) drop(containerRef.current);
    }, [drop]);
    
    useEffect(() => {
        const checkSize = () => {
            if (containerRef.current) setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
        };
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    useEffect(() => {
        if (background && bgImage && stageRef.current && size.width > 0) {
            const stage = stageRef.current;
            const imageAspectRatio = background.width / background.height;
            const containerAspectRatio = size.width / size.height;
            let scale = (imageAspectRatio > containerAspectRatio ? size.width / background.width : size.height / background.height) * 0.95;
            stage.scale({ x: scale, y: scale });
            stage.position({ x: (size.width - background.width * scale) / 2, y: (size.height - background.height * scale) / 2 });
        }
    }, [background, bgImage, size, stageRef]);

    useEffect(() => {
        if (editingText && textEditRef.current) {
            textEditRef.current.focus();
            textEditRef.current.select();
        }
    }, [editingText]);

    useEffect(() => {
        if (trRef.current) {
            const stage = stageRef.current;
            const nodes = selectedIds.map(id => stage.findOne('.' + id)).filter(Boolean);
            trRef.current.nodes(nodes);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selectedIds, objects]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && drawingState && drawingState.points.length > 2) {
                e.preventDefault();
                addObject(drawingState.item, { x: 0, y: 0 }, { points: [...drawingState.points] });
                setDrawingState(null);
                setTempLinePoints([]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [drawingState, addObject, setDrawingState]);
    
    const getRelativePointerPosition = (stage: any) => {
        const pos = stage.getPointerPosition();
        if (!pos) return { x: 0, y: 0 };
        const transform = stage.getAbsoluteTransform().copy().invert();
        return transform.point(pos);
    };

    const handleObjectClick = (e: any) => {
        if (editingText) setEditingText(null);
        const id = e.target.id();
        const isShift = e.evt.shiftKey;
        const newSelectedIds = isShift
            ? selectedIds.includes(id) ? selectedIds.filter(sid => sid !== id) : [...selectedIds, id]
            : selectedIds.includes(id) && selectedIds.length === 1 ? [] : [id];
        setSelectedIds(newSelectedIds);
    };
    
    const handleStageClick = (e: any) => {
        if (e.target !== e.target.getStage()) return;
        const pos = getRelativePointerPosition(e.target.getStage());
        if (pendingItem) {
             if (isLineTool(pendingItem.type)) {
                setDrawingState({ type: pendingItem.type, points: [pos.x, pos.y], item: pendingItem });
            } else if (isRectTool(pendingItem.type)) {
                addObject(pendingItem, pos);
            }
            setPendingItem(null);
        } else if (drawingState) {
            setDrawingState(prev => prev ? { ...prev, points: [...prev.points, pos.x, pos.y] } : null);
        }
    };
    
    const handleStageMouseDown = (e: any) => {
        if (e.target !== stageRef.current || e.evt.button !== 0 || drawingState || pendingItem) return;
        const pos = getRelativePointerPosition(e.target.getStage());
        setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
        if (!e.evt.shiftKey) checkDeselect(e);
    };

    const handleStageMouseMove = (e: any) => {
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = getRelativePointerPosition(stage);
        if (drawingState && drawingState.points.length > 0) {
            setTempLinePoints([...drawingState.points, pos.x, pos.y]);
        } else if (selectionBox.visible) {
            setSelectionBox(prev => ({ ...prev, width: pos.x - prev.x, height: pos.y - prev.y }));
        }
    };

    const handleStageMouseUp = (e: any) => {
        if (selectionBox.visible && selectionRectRef.current) {
            const stage = stageRef.current;
            const box = selectionRectRef.current.getClientRect();
            const newSelectedIds = objects.reduce((acc, obj) => {
                const node = stage.findOne('.' + obj.id);
                if (node && !(box.x > node.getClientRect().x + node.getClientRect().width || box.x + box.width < node.getClientRect().x || box.y > node.getClientRect().y + node.getClientRect().height || box.y + box.height < node.getClientRect().y)) {
                    acc.push(obj.id);
                }
                return acc;
            }, [] as string[]);
            setSelectedIds(e.evt.shiftKey ? [...new Set([...selectedIds, ...newSelectedIds])] : newSelectedIds);
        }
        setSelectionBox({ ...selectionBox, visible: false });
    };
    
    const handleContextMenu = (e: any) => {
        e.evt.preventDefault();
        if (drawingState && drawingState.points.length > 2) {
            addObject(drawingState.item, { x: 0, y: 0 }, { points: [...drawingState.points] });
        }
        setDrawingState(null);
        setTempLinePoints([]);
    };

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = stageRef.current; if (!stage) return;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition(); if(!pointer) return;
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
        stage.scale({ x: newScale, y: newScale });
        stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    };

    const handleTextDblClick = (obj: APDObject) => {
        setSelectedIds([]);
        setEditingText(obj);
    };

    const handleTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (editingText) {
            updateObject(editingText.id, { text: e.target.value }, true);
            setEditingText(null);
        }
    };

    const getTextareaStyle = (node: any): React.CSSProperties => {
        if (!node) return { display: 'none' };
        const textPos = node.absolutePosition();
        const stageBox = stageRef.current.container().getBoundingClientRect();
        return {
            position: 'absolute', top: `${stageBox.top + textPos.y}px`, left: `${stageBox.left + textPos.x}px`,
            width: `${node.width() * node.scaleX()}px`, height: `${node.height() * node.scaleY() + 5}px`,
            fontSize: `${node.fontSize() * node.scaleY()}px`, lineHeight: node.lineHeight(), fontFamily: node.fontFamily(),
            transform: `rotate(${node.rotation()}deg)`, color: node.fill(),
            border: '2px solid #007bff', borderRadius: '3px', padding: '0px', margin: '0px', background: 'rgba(255, 255, 255, 0.9)', 
            outline: 'none', resize: 'none', overflow: 'hidden', transformOrigin: 'left top'
        };
    };

    return (
        <div className={`flex-1 relative overflow-hidden bg-slate-900 touch-none ${pendingItem ? 'cursor-copy' : drawingState ? 'cursor-crosshair' : 'cursor-grab'}`} ref={containerRef}>
            {!background ? (
                <WelcomeScreen onFileSelect={handleFile} />
            ) : (
                <>
                    <DropIndicator isOver={isOver && canDrop && draggedItemType === NativeTypes.FILE} />
                    <UndoRedoControls undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} />
                    <Stage
                        ref={stageRef}
                        width={size.width} height={size.height}
                        onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp}
                        onClick={handleStageClick} onContextMenu={handleContextMenu} onWheel={handleWheel}
                        draggable={!selectedIds.length && !drawingState && !pendingItem && !editingText}
                    >
                        <Layer>
                            {bgImage && <KonvaImage image={bgImage} width={background.width} height={background.height} listening={false} />}
                        </Layer>
                        <Layer>
                            {tempLinePoints.length > 0 && drawingState && (
                                <Line 
                                    points={tempLinePoints} 
                                    stroke={drawingState.item.stroke || '#ff0000'} 
                                    strokeWidth={drawingState.item.strokeWidth || 5} 
                                    dash={drawingState.item.dash}
                                    tension={isLineTool(drawingState.type) && drawingState.type === 'pen' ? 0.5 : 0} 
                                    lineCap="round" 
                                    listening={false}/>
                            )}
                            {objects.map((obj) => (
                                <DraggableObject
                                    key={obj.id}
                                    obj={obj}
                                    isSelected={selectedIds.includes(obj.id)}
                                    onSelect={(e) => handleObjectClick(e)}
                                    onChange={(attrs, immediate) => updateObject(obj.id, attrs, immediate)}
                                    onTextDblClick={() => isRectTool(obj.type) && obj.type === 'text' && handleTextDblClick(obj)}
                                />
                            ))}
                            <Transformer
                                ref={trRef}
                                boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox}
                                anchorStroke="#007bff" anchorFill="#fff" anchorSize={10} borderStroke="#007bff" borderDash={[6, 2]}
                                rotateEnabled={!selectedIds.some(id => {
                                    const obj = objects.find(o => o.id === id);
                                    return obj && isLineTool(obj.type);
                                })}
                                onTransformEnd={(e) => {
                                    e.target.nodes().forEach((node: any) => {
                                        const scaleX = node.scaleX();
                                        const scaleY = node.scaleY();
                                        node.scaleX(1); 
                                        node.scaleY(1);
                                        updateObject(node.id(), { 
                                            x: node.x(), 
                                            y: node.y(), 
                                            rotation: node.rotation(), 
                                            width: node.width() * scaleX, 
                                            height: node.height() * scaleY,
                                            scaleX: 1,
                                            scaleY: 1,
                                        }, true);
                                    });
                                }}
                            />
                             <Rect ref={selectionRectRef} fill="rgba(0, 123, 255, 0.2)" stroke="rgba(0, 123, 255, 0.6)" strokeWidth={1} visible={selectionBox.visible} x={selectionBox.x} y={selectionBox.y} width={selectionBox.width} height={selectionBox.height} listening={false} />
                        </Layer>
                    </Stage>
                    {editingText && (
                        <textarea
                            ref={textEditRef}
                            defaultValue={editingText.text}
                            onBlur={handleTextareaBlur}
                            style={getTextareaStyle(stageRef.current.findOne('.' + editingText.id))}/>
                    )}
                </>
            )}
        </div>
    );
};

export default CanvasPanel;
