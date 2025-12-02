
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import useImage from 'use-image';
import { APDObject, LibraryItem, isLineTool } from '../types/index';
import DraggableObject from './DraggableObject';
import toast from 'react-hot-toast';

// WelcomeScreen komponenten är oförändrad...
type DrawingState = { type: 'walkway' | 'fence' | 'construction-traffic' | 'pen'; points: number[]; item: LibraryItem; } | null;

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
}

const WelcomeScreen: React.FC<{ handleFile: (file: File) => void }> = ({ handleFile }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleDivClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    };
    return (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none bg-slate-900">
            <div className="relative flex flex-col items-center justify-center w-4/5 max-w-2xl p-10 md:p-16 border-4 border-dashed border-slate-600 rounded-2xl hover:border-blue-500 transition-all duration-300 bg-slate-800/50 group pointer-events-auto cursor-pointer" onClick={handleDivClick}>
                <svg className="w-20 h-20 text-slate-500 group-hover:text-blue-500 transition-colors duration-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <h2 className="text-3xl font-bold text-white mb-2">Dra & Släpp Din Ritning Här</h2>
                <p className="text-slate-400 mb-8">Börja ditt projekt genom att ladda upp en PDF, PNG eller JPG.</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                <button className="sparkle-button sparkle-blue"><span className="spark"></span><span className="text">Eller Klicka För Att Välja Fil</span></button>
            </div>
        </div>
    );
};

const CanvasPanel: React.FC<CanvasPanelProps> = ({ 
    stageRef, objects, background, selectedId, setSelectedId, checkDeselect, addObject, updateObject, removeObject, 
    drawingState, setDrawingState, pendingItem, setPendingItem, onSnapshot, handleFile 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [bgImage] = useImage(background?.url || '');
    const [size, setSize] = useState<{ width: number; height: number; }>({ width: 0, height: 0 });
    const [tempLinePoints, setTempLinePoints] = useState<number[]>([]);

    useEffect(() => { /* ... size effect ... */ }, []);
    useEffect(() => { /* ... background zoom effect ... */ }, [background, size, stageRef]);

    const getRelativePointerPosition = (node: any) => {
        const transform = node.getAbsoluteTransform().copy();
        transform.invert();
        const pos = node.getStage().getPointerPosition();
        return transform.point(pos);
    };

    // *** Logik för att placera ut objekt eller starta ritning ***
    const handleStageClick = (e: any) => {
        if (e.target !== e.target.getStage()) { // Klick på ett objekt, inte canvas
            checkDeselect(e);
            return;
        }

        const stage = stageRef.current;
        const pos = getRelativePointerPosition(stage);

        if (pendingItem) {
            addObject(pendingItem, pos);
            setPendingItem(null);
        } else if (drawingState) {
            setDrawingState(prev => {
                if (!prev) return null;
                return { ...prev, points: [...prev.points, pos.x, pos.y] };
            });
        }
    };

    // *** NYTT: Högerklick för att avsluta ritning *** 
    const handleContextMenu = (e: any) => {
        e.evt.preventDefault();
        if (drawingState && drawingState.points.length > 0) {
            addObject(drawingState.item, { x: 0, y: 0 }, { points: drawingState.points });
            setDrawingState(null);
            setTempLinePoints([]);
            toast.success(`${drawingState.item.name} skapad!`);
        }
    };

    const handleMouseMove = () => {
        if (!drawingState || drawingState.points.length === 0) return;
        const stage = stageRef.current;
        const pos = getRelativePointerPosition(stage);
        setTempLinePoints([...drawingState.points, pos.x, pos.y]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
            return;
        }
        const itemStr = e.dataTransfer.getData('application/json');
        if (!itemStr) return;
        const item: LibraryItem = JSON.parse(itemStr);
        const stage = stageRef.current;
        if (stage) {
            stage.setPointersPositions(e);
            const pos = getRelativePointerPosition(stage);
            addObject(item, pos);
        }
    };
    
    const handleWheel = (e: any) => { /* ... oförändrad ... */ };

    return (
        <div 
            className={`flex-1 relative overflow-hidden bg-slate-900 touch-none ${drawingState || pendingItem ? 'cursor-crosshair' : 'cursor-default'}`}
            ref={containerRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            {!background ? (
                <WelcomeScreen handleFile={handleFile} />
            ) : (
                <Stage
                    ref={stageRef}
                    width={size.width}
                    height={size.height}
                    onMouseDown={checkDeselect}
                    onClick={handleStageClick}
                    onContextMenu={handleContextMenu} // <-- Nytt event
                    onMouseMove={handleMouseMove}   // <-- Nytt event
                    onWheel={handleWheel}
                    draggable={!drawingState && !selectedId}
                >
                    <Layer>
                        <KonvaImage image={bgImage} listening={false} x={0} y={0} width={background.width} height={background.height} />
                    </Layer>
                    <Layer>
                        {/* Ritningsfeedback */}
                        {tempLinePoints.length > 0 && drawingState && (
                             <Line
                                points={tempLinePoints}
                                stroke={drawingState.item.stroke || '#ff0000'}
                                strokeWidth={drawingState.item.strokeWidth || 5}
                                dash={drawingState.item.dash}
                                tension={isLineTool(drawingState.type) ? 0 : 0.5}
                                lineCap="round"
                                listening={false}
                            />
                        )}
                        {objects.map((obj) => (
                            <DraggableObject
                                key={obj.id}
                                obj={obj}
                                isSelected={obj.id === selectedId}
                                onSelect={() => setSelectedId(obj.id)}
                                onChange={(attrs) => { onSnapshot(); updateObject(obj.id, attrs); }}
                                onInteractionStart={onSnapshot}
                                onTextDblClick={()=>{}}/>
                        ))}
                    </Layer>
                </Stage>
            )}
        </div>
    );
};

export default CanvasPanel;
