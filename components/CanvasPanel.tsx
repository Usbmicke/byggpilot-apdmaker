
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Transformer, Circle, Line, Rect, Group as KonvaGroup } from 'react-konva';
import useImage from 'use-image';
import { APDObject, LibraryItem, isCrane, isText, isWalkway, isFence, isSchakt, isConstructionTraffic, isPen, TextAPDObject, isLineTool } from '../types/index';

type DrawingState = {
    type: 'walkway' | 'fence' | 'construction-traffic' | 'pen';
    points: number[];
    item: LibraryItem;
} | null;

interface CanvasPanelProps {
    stageRef: React.RefObject<any>;
    objects: APDObject[];
    background: { url: string; width: number; height: number; } | null;
    setBackground: (bg: { url: string, width: number, height: number } | null) => void;
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
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const DraggableObject: React.FC<{
    obj: APDObject;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onChange: (attrs: Partial<APDObject>) => void;
    onTextDblClick: (obj: APDObject, node: any) => void;
    onInteractionStart: () => void;
}> = ({ obj, isSelected, onSelect, onChange, onTextDblClick, onInteractionStart }) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    React.useEffect(() => {
        if (isSelected && trRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const commonProps = {
        id: obj.id,
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        draggable: true,
        onClick: () => onSelect(obj.id),
        onTap: () => onSelect(obj.id),
        onDragStart: () => {
            onSelect(obj.id);
            onInteractionStart();
        },
        onDragEnd: (e: any) => onChange({ x: e.target.x(), y: e.target.y() }),
        onTransformStart: () => {
            onInteractionStart();
        },
        onTransformEnd: () => {
            const node = shapeRef.current;
            if (node) {
                const changedProps: Partial<APDObject> & { x: number, y: number, scaleX: number, scaleY: number, rotation: number } = {
                    x: node.x(),
                    y: node.y(),
                    scaleX: node.scaleX(),
                    scaleY: node.scaleY(),
                    rotation: node.rotation(),
                };
                if (isSchakt(obj)) {
                    (changedProps as any).width = node.width() * node.scaleX();
                    (changedProps as any).height = node.height() * node.scaleY();
                    changedProps.scaleX = 1;
                    changedProps.scaleY = 1;
                }
                onChange(changedProps);
            }
        },
    };
    
    const renderObject = () => {
        if (isText(obj)) {
            return (
                <Text
                    ref={shapeRef}
                    text={obj.text}
                    fontSize={obj.fontSize}
                    fill={obj.fill}
                    stroke="white"
                    strokeWidth={0.5}
                    shadowColor="black"
                    shadowBlur={1}
                    shadowOpacity={0.3}
                    shadowOffset={{x:1, y:1}}
                    onDblClick={(e) => onTextDblClick(obj, e.target)}
                    onDblTap={(e) => onTextDblClick(obj, e.target)}
                    {...commonProps}
                />
            );
        } else if (isWalkway(obj) || isFence(obj) || isConstructionTraffic(obj) || isPen(obj)) {
            return (
              <Line
                ref={shapeRef}
                points={obj.points}
                stroke={obj.isInRiskZone ? '#ef4444' : obj.stroke}
                strokeWidth={obj.strokeWidth}
                dash={obj.dash}
                tension={isPen(obj) ? obj.tension : 0}
                lineCap={isPen(obj) ? 'round' : 'butt'}
                lineJoin={isPen(obj) ? 'round' : 'miter'}
                bezier={isPen(obj)}
                closed={false}
                draggable={true}
                hitStrokeWidth={20}
                onClick={() => onSelect(obj.id)}
                onTap={() => onSelect(obj.id)}
                onDragStart={() => {
                    onSelect(obj.id);
                    onInteractionStart();
                }}
                onDragEnd={(e: any) => {
                    const deltaX = e.target.x();
                    const deltaY = e.target.y();
                    const newPoints = obj.points.map((p, i) => i % 2 === 0 ? p + deltaX : p + deltaY);
                    onChange({ points: newPoints, x: 0, y: 0 });
                    e.target.position({x:0, y:0});
                }}
              />
            );
        } else if (isCrane(obj)) {
            const rotationRad = obj.rotation * Math.PI / 180;
            const handleX = obj.x + obj.radius * Math.cos(rotationRad);
            const handleY = obj.y + obj.radius * Math.sin(rotationRad);
            const craneYellow = '#FFD700';
            const craneDarkYellow = '#DAA520';
            
            return (
                <React.Fragment>
                    <Circle x={obj.x} y={obj.y} radius={obj.radius} stroke="rgba(239, 68, 68, 0.7)" strokeWidth={2} dash={[10, 5]} listening={false}/>
                    <KonvaGroup ref={shapeRef} {...commonProps}>
                        <Rect x={-10} y={-10} width={20} height={20} fill={craneYellow} stroke={craneDarkYellow} strokeWidth={1}/>
                        <Line points={[0, 0, obj.radius, 0]} stroke={craneYellow} strokeWidth={5} />
                        <Line points={[0, 0, -20, 0]} stroke={craneYellow} strokeWidth={5} />
                        <Rect x={-30} y={-5} width={10} height={10} fill="#696969" />
                        <Rect x={0} y={-15} width={15} height={10} fill={craneYellow} stroke={craneDarkYellow} strokeWidth={1} />
                    </KonvaGroup>
                    <Circle 
                        x={handleX}
                        y={handleY}
                        radius={10} fill="#ef4444" draggable 
                        onDragStart={() => onInteractionStart()}
                        onDragMove={(e) => {
                             const node = e.target;
                             const dx = node.x() - obj.x;
                             const dy = node.y() - obj.y;
                             const newRadius = Math.sqrt(dx*dx + dy*dy);
                             onChange({ radius: Math.max(20, newRadius) });
                        }}
                        cursor="ew-resize"
                    />
                </React.Fragment>
            );
        } else if (isSchakt(obj)) {
             return (
                <Rect
                    ref={shapeRef}
                    width={obj.width}
                    height={obj.height}
                    fill={obj.fill}
                    stroke={obj.stroke}
                    strokeWidth={2}
                    dash={[10, 5]}
                    offsetX={obj.width / 2}
                    offsetY={obj.height / 2}
                    {...commonProps}
                />
             );
        }
        else {
            const [iconImage] = useImage(obj.iconUrl);
            return (
                <KonvaImage ref={shapeRef} image={iconImage} width={40} height={40} offsetX={20} offsetY={20} {...commonProps} />
            );
        }
    };
    
    return (
        <React.Fragment>
            {renderObject()}
            {isSelected && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox} />}
        </React.Fragment>
    );
};

const CanvasPanel: React.FC<CanvasPanelProps> = ({ stageRef, objects, background, setBackground, selectedId, setSelectedId, checkDeselect, addObject, updateObject, removeObject, drawingState, setDrawingState, pendingItem, setPendingItem, onSnapshot, undo, redo, canUndo, canRedo }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [bgImage] = useImage(background?.url || '');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
    const [tempLinePoints, setTempLinePoints] = useState<number[]>([]);
    const [cursorPosition, setCursorPosition] = useState<{x: number, y: number} | null>(null);
    const [size, setSize] = useState<{ width: number; height: number; }>({ width: 0, height: 0 });
    const lastDist = useRef<number>(0);
    const isDrawingRef = useRef(false);

    const getRelativePointerPosition = (node: any) => {
        const transform = node.getAbsoluteTransform().copy();
        transform.invert();
        const pos = node.getStage().getPointerPosition();
        return transform.point(pos);
    };

    useEffect(() => {
        const checkSize = () => {
            if (containerRef.current) {
                setSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        checkSize();
        const resizeObserver = new ResizeObserver(checkSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!drawingState) {
            setTempLinePoints([]);
            setCursorPosition(null);
            isDrawingRef.current = false;
        }
    }, [drawingState]);

    const finishDrawing = () => {
        if (drawingState && drawingState.points.length >= 4) {
             addObject(drawingState.item, { x: 0, y: 0 }, { points: drawingState.points });
        }
        if (drawingState?.type !== 'pen') {
            setDrawingState(null);
            setTempLinePoints([]);
        }
    }

    const handleStageRightClick = (e: any) => {
        e.evt.preventDefault();
        if (drawingState) {
            finishDrawing();
            return; 
        }
        setContextMenu(null); 
        const target = e.target;
        if (target !== target.getStage()) {
            const id = target.id();
            if (id) {
                setSelectedId(id);
                const container = containerRef.current?.getBoundingClientRect();
                if (!container) return;
                setContextMenu({ x: e.evt.clientX - container.left, y: e.evt.clientY - container.top, id: id });
            }
        }
    };

    useEffect(() => {
        const handleGlobalKeys = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && drawingState) {
                finishDrawing();
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, [drawingState]); 

    const handleLabelChange = (id: string) => {
        const obj = objects.find(o => o.id === id);
        const newLabel = prompt(`Ange ny etikett för "${obj?.label}":`, obj?.label);
        if (newLabel) {
            onSnapshot();
            updateObject(id, { label: newLabel });
        }
        setContextMenu(null);
    };

    const getDistance = (p1: any, p2: any) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const getCenter = (p1: any, p2: any) => {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
        };
    };

    const handleTouchMove = (e: any) => {
        const stage = e.target.getStage();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        if (drawingState && touch1 && !touch2) {
             const pos = getRelativePointerPosition(stage);
             setCursorPosition(pos);
             
             if (drawingState.type === 'pen') {
                 if (isDrawingRef.current) {
                    setTempLinePoints(prev => [...prev, pos.x, pos.y]);
                 }
             } else if (drawingState.points.length >= 2) {
                setTempLinePoints([...drawingState.points, pos.x, pos.y]);
            }
            return;
        }

        if (touch1 && touch2) {
            e.evt.preventDefault();
            
            const p1 = { x: touch1.clientX, y: touch1.clientY };
            const p2 = { x: touch2.clientX, y: touch2.clientY };

            if (!lastDist.current) {
                lastDist.current = getDistance(p1, p2);
            }

            const newDist = getDistance(p1, p2);
            const distScale = newDist / lastDist.current;

            const oldScale = stage.scaleX();
            const newScale = oldScale * distScale;

            if (newScale > 5 || newScale < 0.05) return;

            const center = getCenter(p1, p2);
            const stageBox = stage.container().getBoundingClientRect();
            const pointerPosition = {
                x: center.x - stageBox.left,
                y: center.y - stageBox.top
            };

            const mousePointTo = {
                x: (pointerPosition.x - stage.x()) / oldScale,
                y: (pointerPosition.y - stage.y()) / oldScale,
            };

            const newPos = {
                x: pointerPosition.x - mousePointTo.x * newScale,
                y: pointerPosition.y - mousePointTo.y * newScale,
            };

            stage.scale({ x: newScale, y: newScale });
            stage.position(newPos);
            stage.batchDraw();
            
            lastDist.current = newDist;
        }
    };

    const handleTouchEnd = () => {
        lastDist.current = 0;
        if (drawingState?.type === 'pen' && isDrawingRef.current) {
            isDrawingRef.current = false;
            if (tempLinePoints.length > 0) {
                addObject(drawingState.item, { x: 0, y: 0 }, { points: tempLinePoints });
                setTempLinePoints([]);
            }
        }
    };


    const handleStageClick = (e: any) => {
        if (contextMenu) {
            setContextMenu(null);
        }
        
        if (pendingItem) {
            const stage = e.target.getStage();
            const pos = getRelativePointerPosition(stage);
            addObject(pendingItem, pos);
            return;
        }

        if (!drawingState) {
            checkDeselect(e);
            return;
        }

        if (drawingState.type === 'pen') return;

        const stage = e.target.getStage();
        const pos = getRelativePointerPosition(stage);
        
        // Add point to drawing state
        setDrawingState(s => {
            if (!s) return null;
            return { ...s, points: [...s.points, pos.x, pos.y] };
        });
        
        // Update temporary line immediately
        setTempLinePoints(prev => [...(drawingState.points), pos.x, pos.y, pos.x, pos.y]); // Add extra to connect to cursor
    };
    
    const handleStageMouseDown = (e: any) => {
        if (e.evt.button === 2) return;
        setContextMenu(null);

        if (drawingState?.type === 'pen') {
             isDrawingRef.current = true;
             const stage = e.target.getStage();
             const pos = getRelativePointerPosition(stage);
             setTempLinePoints([pos.x, pos.y]);
        }
    }
    
    const handleStageMouseUp = (e: any) => {
         if (drawingState?.type === 'pen' && isDrawingRef.current) {
             isDrawingRef.current = false;
             if (tempLinePoints.length > 0) {
                 addObject(drawingState.item, { x: 0, y: 0 }, { points: tempLinePoints });
                 setTempLinePoints([]);
             }
         }
    }

    const handleStageMouseMove = (e: any) => {
        if (!drawingState) {
            setTempLinePoints([]);
            setCursorPosition(null);
            return;
        }
        const stage = e.target.getStage();
        const pos = getRelativePointerPosition(stage);
        setCursorPosition(pos);
        
        if (drawingState.type === 'pen') {
            if (isDrawingRef.current) {
                setTempLinePoints(prev => [...prev, pos.x, pos.y]);
            }
        } else if (drawingState.points.length >= 2) {
            // "Rubber band" effect: Connect existing points + current cursor position
            setTempLinePoints([...drawingState.points, pos.x, pos.y]);
        } else {
             // First point clicked, waiting for second point
             // Just track cursor if needed
        }
    };

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
        stage.scale({ x: newScale, y: newScale });
        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
        stage.batchDraw();
    };

    const resetView = () => {
         const stage = stageRef.current;
         if(stage) {
             stage.position({x:0, y:0});
             stage.scale({x:1, y:1});
             stage.batchDraw();
         }
    }

    const processFile = async (file: File) => {
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                setBackground({ url, width: img.width, height: img.height });
            };
            img.src = url;
        } else if (file.type === 'application/pdf') {
            const fileReader = new FileReader();
            fileReader.onload = async () => {
                try {
                    const typedarray = new Uint8Array(fileReader.result as ArrayBuffer);
                    const pdf = await (window as any).pdfjsLib.getDocument(typedarray).promise;
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    if (context) {
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        await page.render({ canvasContext: context, viewport: viewport }).promise;
                        setBackground({ url: canvas.toDataURL(), width: canvas.width, height: canvas.height });
                    }
                } catch (error) {
                    console.error("Error processing PDF:", error);
                }
            };
            fileReader.readAsArrayBuffer(file);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
        event.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); 
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        // Handle files drop
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            processFile(file);
            return;
        }

        // Handle library items drop
        const json = e.dataTransfer.getData('application/json');
        if (json) {
            try {
                const item = JSON.parse(json) as LibraryItem;
                const stage = stageRef.current;
                
                if (isLineTool(item)) {
                     setDrawingState({ type: item.type as any, points: [], item: item });
                     // We could optionally set the first point here based on drop position
                     return;
                }

                if (stage && containerRef.current) {
                    const stageRect = containerRef.current.getBoundingClientRect();
                    const rawX = e.clientX - stageRect.left;
                    const rawY = e.clientY - stageRect.top;
                    const transform = stage.getAbsoluteTransform().copy();
                    transform.invert();
                    const pos = transform.point({ x: rawX, y: rawY });
                    addObject(item, pos);
                }
            } catch (err) {
                console.error("Drag and drop failed:", err);
            }
        }
    };


    return (
        <div 
            className={`flex-1 relative overflow-hidden bg-slate-900 touch-none ${drawingState || pendingItem ? 'cursor-crosshair' : 'cursor-default'}`} 
            ref={containerRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Stage
                ref={stageRef}
                width={size.width}
                height={size.height}
                onMouseDown={handleStageMouseDown}
                onMouseUp={handleStageMouseUp}
                onMouseMove={handleStageMouseMove}
                onClick={handleStageClick}
                onTap={handleStageClick}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                onContextMenu={handleStageRightClick}
                draggable={!drawingState && !pendingItem}
            >
                <Layer>
                    {bgImage && (
                        <KonvaImage
                            image={bgImage}
                            width={background?.width}
                            height={background?.height}
                            listening={false}
                        />
                    )}
                </Layer>
                <Layer>
                    {objects.map((obj) => (
                        <DraggableObject
                            key={obj.id}
                            obj={obj}
                            isSelected={obj.id === selectedId}
                            onSelect={(id) => {
                                if (!drawingState && !pendingItem) setSelectedId(id);
                            }}
                            onChange={(attrs) => {
                                onSnapshot();
                                updateObject(obj.id, attrs);
                            }}
                            onTextDblClick={(o, node) => {
                                const newText = prompt("Ändra text:", (o as TextAPDObject).text);
                                if (newText !== null) {
                                    onSnapshot();
                                    updateObject(o.id, { text: newText });
                                }
                            }}
                            onInteractionStart={onSnapshot}
                        />
                    ))}
                    
                    {/* VISUAL FEEDBACK FOR DRAWING TOOLS */}
                    {drawingState && (
                        <>
                             {/* Gummiband-linje (Elastisk) */}
                             {tempLinePoints.length >= 2 && (
                                <Line
                                    points={tempLinePoints}
                                    stroke={drawingState.type === 'pen' ? (drawingState.item.initialProps as any).stroke : "white"}
                                    strokeWidth={drawingState.type === 'pen' ? (drawingState.item.initialProps as any).strokeWidth : 2}
                                    dash={drawingState.type !== 'pen' ? [5, 5] : undefined}
                                    opacity={0.8}
                                    tension={drawingState.type === 'pen' ? 0.5 : 0}
                                    lineCap="round"
                                    lineJoin="round"
                                    bezier={drawingState.type === 'pen'}
                                    listening={false}
                                />
                            )}
                            
                            {/* Noder/Punkter för Staket, Gångväg etc (Ej Penna) */}
                            {drawingState.type !== 'pen' && drawingState.points.map((_, i) => {
                                if (i % 2 !== 0) return null; // Skip y coords
                                const x = drawingState.points[i];
                                const y = drawingState.points[i+1];
                                return (
                                    <Circle 
                                        key={i}
                                        x={x} 
                                        y={y} 
                                        radius={4} 
                                        fill="white" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        listening={false}
                                    />
                                );
                            })}
                        </>
                    )}
                </Layer>
            </Stage>

             {!bgImage && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-slate-800/80 p-8 rounded-xl border border-slate-600 text-center pointer-events-auto shadow-2xl">
                        <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white mb-2">Välkommen till APD-Maker</h2>
                        <p className="text-slate-400 mb-6">Börja med att importera din ritning (PDF eller Bild)</p>
                        <div 
                            className="border-2 border-dashed border-slate-500 rounded-lg p-8 hover:border-blue-500 hover:bg-slate-700/50 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files?.[0]; if(file) processFile(file); }}
                        >
                            <input 
                                type="file" 
                                id="file-upload"
                                className="hidden" 
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                            />
                            <span className="text-blue-400 font-semibold">Klicka här</span>
                            <span className="text-slate-400"> eller dra och släpp filen</span>
                        </div>
                    </div>
                </div>
            )}
            
             <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                {selectedId && (
                    <button 
                        onClick={() => removeObject(selectedId)}
                        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-transform active:scale-90 mb-4 flex items-center justify-center"
                        title="Ta bort vald"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}

                 <button 
                    onClick={resetView}
                    className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg" 
                    title="Centrera vy"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
                
                <div className="flex flex-col bg-slate-700 rounded-full shadow-lg overflow-hidden">
                    <button 
                        onClick={() => {
                            const stage = stageRef.current;
                            if(stage) {
                                const oldScale = stage.scaleX();
                                const newScale = oldScale * 1.2;
                                stage.scale({x: newScale, y: newScale});
                                stage.batchDraw();
                            }
                        }}
                        className="p-3 hover:bg-slate-600 text-white border-b border-slate-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => {
                            const stage = stageRef.current;
                            if(stage) {
                                const oldScale = stage.scaleX();
                                const newScale = oldScale * 0.8;
                                stage.scale({x: newScale, y: newScale});
                                stage.batchDraw();
                            }
                        }}
                        className="p-3 hover:bg-slate-600 text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-2 z-20">
                 <button 
                    onClick={undo} 
                    disabled={!canUndo}
                    className={`p-2 rounded-full shadow-lg transition-all ${!canUndo ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-600 hover:scale-105'}`}
                    title="Ångra"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>
                <button 
                    onClick={redo} 
                    disabled={!canRedo}
                    className={`p-2 rounded-full shadow-lg transition-all ${!canRedo ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-600 hover:scale-105'}`}
                    title="Gör om"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                </button>
            </div>

            {contextMenu && (
                <div 
                    className="absolute bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden min-w-[150px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 text-sm"
                        onClick={() => handleLabelChange(contextMenu.id)}
                    >
                        Byt namn
                    </button>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-red-900/50 text-red-400 text-sm"
                        onClick={() => {
                            removeObject(contextMenu.id);
                            setContextMenu(null);
                        }}
                    >
                        Ta bort
                    </button>
                </div>
            )}
        </div>
    );
};

export default CanvasPanel;
