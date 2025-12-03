
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import useImage from 'use-image';
import { APDObject, LibraryItem, isLineTool, DrawingTool, isTextTool } from '../../types/index';
import DraggableObject from '../draggable/DraggableObject';
import toast from 'react-hot-toast';

// Ny komponent för Ångra/Gör om-knappar
const UndoRedoControls = ({ undo, redo, canUndo, canRedo }: { undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean }) => (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={undo} disabled={!canUndo} className="bg-slate-700/80 hover:bg-slate-600/80 backdrop-blur-sm text-white font-bold p-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 19H6.22857C4.54714 19 3.55357 17.5119 4.10238 15.9881L5.78333 11.5833M10 19V16.5C10 14.8333 11.3333 13.5 13 13.5H15.5M10 19H14C15.1046 19 16 18.1046 16 17V15.5M5.78333 11.5833L7.14524 8.2381C7.59762 7.15476 8.65952 6.5 9.80952 6.5H16.5C17.8807 6.5 19 7.61929 19 9V12.5C19 13.8807 17.8807 15 16.5 15H13C11.3333 15 10 16.3333 10 18V19M5.78333 11.5833C4.10238 11.5833 3 10.481 3 8.8V6.2C3 5.0799 3.89543 4.2 5 4.2H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={redo} disabled={!canRedo} className="bg-slate-700/80 hover:bg-slate-600/80 backdrop-blur-sm text-white font-bold p-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="scale(-1, 1)"><path d="M10 19H6.22857C4.54714 19 3.55357 17.5119 4.10238 15.9881L5.78333 11.5833M10 19V16.5C10 14.8333 11.3333 13.5 13 13.5H15.5M10 19H14C15.1046 19 16 18.1046 16 17V15.5M5.78333 11.5833L7.14524 8.2381C7.59762 7.15476 8.65952 6.5 9.80952 6.5H16.5C17.8807 6.5 19 7.61929 19 9V12.5C19 13.8807 17.8807 15 16.5 15H13C11.3333 15 10 16.3333 10 18V19M5.78333 11.5833C4.10238 11.5833 3 10.481 3 8.8V6.2C3 5.0799 3.89543 4.2 5 4.2H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
    </div>
);

type DrawingState = { type: DrawingTool; points: number[]; item: LibraryItem; } | null;

interface CanvasPanelProps {
    stageRef: React.RefObject<any>;
    objects: APDObject[];
    background: { url: string; width: number; height: number; } | null;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    checkDeselect: (e: any) => void;
    addObject: (item: LibraryItem, position: { x: number; y: number }, extraProps?: Partial<APDObject>) => void;
    updateObject: (id: string, attrs: Partial<APDObject>) => void;
    removeObject: (id: string) => void;
    drawingState: DrawingState;
    setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
    pendingItem: LibraryItem | null;
    setPendingItem: (item: LibraryItem | null) => void;
    onSnapshot: () => void; 
    handleFile: (file: File) => void;
    // Nya props för undo/redo
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
}

const WelcomeScreen: React.FC<{ onFileDrop: (file: File) => void }> = ({ onFileDrop }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleDivClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) onFileDrop(e.target.files[0]);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileDrop(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto bg-slate-900/50" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <div className="relative flex flex-col items-center justify-center w-4/5 max-w-2xl p-10 md:p-16 border-4 border-dashed border-slate-600 rounded-2xl hover:border-blue-500 transition-all duration-300 bg-slate-800 group cursor-pointer" onClick={handleDivClick}>
                <svg className="w-20 h-20 text-slate-500 group-hover:text-blue-500 transition-colors duration-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <h2 className="text-3xl font-bold text-white mb-2">Dra & Släpp Din Ritning Här</h2>
                <p className="text-slate-400 mb-8">Börja ditt projekt genom att ladda upp en PDF, PNG, JPG eller APD-fil.</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,.apd" onChange={handleFileChange} />
                <button className="sparkle-button sparkle-blue"><span className="spark"></span><span className="text">Eller Klicka För Att Välja Fil</span></button>
            </div>
        </div>
    );
};


const CanvasPanel: React.FC<CanvasPanelProps> = ({ 
    stageRef, objects, background, selectedId, setSelectedId, checkDeselect, addObject, updateObject, 
    drawingState, setDrawingState, pendingItem, setPendingItem, onSnapshot, handleFile,
    canUndo, canRedo, undo, redo
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [bgImage] = useImage(background?.url || '');
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [tempLinePoints, setTempLinePoints] = useState<number[]>([]);
    const [editingText, setEditingText] = useState<APDObject | null>(null);
    const textEditRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const checkSize = () => {
            if (containerRef.current) {
                setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
            }
        };
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    useEffect(() => {
        if (background && bgImage && stageRef.current && size.width > 0) {
            const stage = stageRef.current;
            const scale = Math.min(size.width / background.width, size.height / background.height) * 0.95;
            stage.scale({ x: scale, y: scale });
            stage.position({ 
                x: (size.width - background.width * scale) / 2,
                y: (size.height - background.height * scale) / 2 
            });
        }
    }, [background, bgImage, size, stageRef]);

    useEffect(() => {
        if (editingText && textEditRef.current) {
            textEditRef.current.focus();
            textEditRef.current.select();
        }
    }, [editingText]);

    const getRelativePointerPosition = (node: any) => {
        const transform = node.getAbsoluteTransform().copy().invert();
        const pos = node.getStage().getPointerPosition();
        return transform.point(pos);
    };

    const handleStageClick = (e: any) => {
        if (e.target !== e.target.getStage()) return;
        const pos = getRelativePointerPosition(stageRef.current);
        if (pendingItem) {
            addObject(pendingItem, pos, isTextTool(pendingItem.type) ? { text: 'Text' } : {});
            setPendingItem(null);
        } else if (drawingState) {
            setDrawingState(prev => prev ? { ...prev, points: [...prev.points, pos.x, pos.y] } : null);
        }
    };

    const handleContextMenu = (e: any) => {
        e.evt.preventDefault();
        if (drawingState && drawingState.points.length > 2) {
            onSnapshot();
            addObject(drawingState.item, {x:0, y:0}, { points: tempLinePoints });
            setDrawingState(null);
            setTempLinePoints([]);
        } else {
            setDrawingState(null);
            setTempLinePoints([]);
        }
    };

    const handleMouseMove = () => {
        if (!drawingState || drawingState.points.length === 0) return;
        const pos = getRelativePointerPosition(stageRef.current);
        setTempLinePoints([...drawingState.points, pos.x, pos.y]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        stage.setPointersPositions(e);
        const pos = getRelativePointerPosition(stage);

        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
            return;
        }
        const itemStr = e.dataTransfer.getData('application/json');
        if (itemStr) {
            const item = JSON.parse(itemStr);
            addObject(item, pos);
        }
    };
    
    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
        stage.scale({ x: newScale, y: newScale });
        const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
        stage.position(newPos);
    };

    const handleTextDblClick = (obj: APDObject) => {
        setSelectedId(null); 
        setEditingText(obj);
    };

    const handleTextEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (editingText) {
            updateObject(editingText.id, { text: e.target.value });
        }
    };

    const handleTextareaBlur = () => {
        onSnapshot();
        setEditingText(null);
    };

    const getTextareaStyle = (node: any): React.CSSProperties => {
        const textPosition = node.absolutePosition();
        const stage = stageRef.current;
        const stageBox = stage.container().getBoundingClientRect();

        return {
            position: 'absolute',
            top: stageBox.top + textPosition.y + 'px',
            left: stageBox.left + textPosition.x + 'px',
            width: node.width() * node.scaleX() - node.padding() * 2 + 'px',
            height: node.height() * node.scaleY() - node.padding() * 2 + 5 + 'px',
            fontSize: node.fontSize() * node.scaleY() + 'px',
            border: 'none',
            padding: '0px',
            margin: '0px',
            overflow: 'hidden',
            background: 'none',
            outline: 'none',
            resize: 'none',
            lineHeight: node.lineHeight(),
            fontFamily: node.fontFamily(),
            transformOrigin: 'left top',
            transform: `rotate(${node.rotation()}deg)`,
            color: node.fill(),
        };
    };

    return (
        <div 
            className={`flex-1 relative overflow-hidden bg-slate-900 touch-none ${drawingState ? 'cursor-crosshair' : 'cursor-grab'}`}
            ref={containerRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            {!background ? (
                <WelcomeScreen onFileDrop={handleFile} />
            ) : (
                <>
                    <UndoRedoControls undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} />
                    <Stage
                        ref={stageRef}
                        width={size.width}
                        height={size.height}
                        onMouseDown={checkDeselect}
                        onClick={handleStageClick}
                        onContextMenu={handleContextMenu}
                        onMouseMove={handleMouseMove}
                        onWheel={handleWheel}
                        draggable={!drawingState && !selectedId && !editingText}
                    >
                        <Layer>
                            <KonvaImage image={bgImage} listening={false} x={0} y={0} width={background.width} height={background.height} />
                        </Layer>
                        <Layer>
                            {tempLinePoints.length > 0 && drawingState && (
                                <Line
                                    points={tempLinePoints}
                                    stroke={drawingState.item.stroke || '#ff0000'}
                                    strokeWidth={drawingState.item.strokeWidth || 5}
                                    dash={drawingState.item.dash}
                                    tension={0.5} 
                                    lineCap="round"
                                    listening={false}
                                />
                            )}
                            {objects.map((obj) => (
                                <DraggableObject
                                    key={obj.id}
                                    obj={{...obj, visible: editingText ? editingText.id !== obj.id : true}}
                                    isSelected={obj.id === selectedId}
                                    onSelect={() => !editingText && setSelectedId(obj.id)}
                                    onChange={(attrs) => updateObject(obj.id, attrs)}
                                    onInteractionStart={onSnapshot}
                                    onTextDblClick={() => isTextTool(obj.type) && handleTextDblClick(obj)}
                                />
                            ))}
                        </Layer>
                    </Stage>
                    {editingText && (
                        <textarea
                            ref={textEditRef}
                            value={editingText.text}
                            onChange={handleTextEdit}
                            onBlur={handleTextareaBlur}
                            style={getTextareaStyle(stageRef.current.findOne('.' + editingText.id))}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default CanvasPanel;
