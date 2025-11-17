import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Transformer, Circle, Line, Rect, Group as KonvaGroup } from 'react-konva';
import useImage from 'use-image';
import { APDObject, LibraryItem, isCrane, isText, isWalkway, isFence, isSchakt, isConstructionTraffic } from '../types/index';

type DrawingState = {
    type: 'walkway' | 'fence' | 'construction-traffic';
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
}

const DraggableObject: React.FC<{
    obj: APDObject;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (attrs: Partial<APDObject>) => void;
    onTextDblClick: (obj: APDObject, node: any) => void;
}> = ({ obj, isSelected, onSelect, onChange, onTextDblClick }) => {
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

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
        // FIX: Wrapped onSelect in an arrow function to match event handler signature.
        onClick: () => onSelect(),
        // FIX: Wrapped onSelect in an arrow function to match event handler signature.
        onTap: () => onSelect(),
        onDragEnd: (e: any) => onChange({ x: e.target.x(), y: e.target.y() }),
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
                    onDblClick={(e) => onTextDblClick(obj, e.target)}
                    onDblTap={(e) => onTextDblClick(obj, e.target)}
                    {...commonProps}
                />
            );
        } else if (isWalkway(obj) || isFence(obj) || isConstructionTraffic(obj)) {
            return (
              <Line
                ref={shapeRef}
                points={obj.points}
                stroke={obj.isInRiskZone ? '#ef4444' : obj.stroke} // red-500
                strokeWidth={obj.strokeWidth}
                dash={obj.dash}
                tension={0}
                closed={false}
                draggable={true}
                onClick={() => onSelect()}
                onTap={() => onSelect()}
                onDragEnd={(e: any) => {
                    const deltaX = e.target.x();
                    const deltaY = e.target.y();
                    const newPoints = obj.points.map((p, i) => i % 2 === 0 ? p + deltaX : p + deltaY);
                    onChange({ points: newPoints });
                    e.target.position({x:0, y:0}); // Återställ drag-position
                }}
              />
            );
        } else if (isCrane(obj)) {
            const rotationRad = obj.rotation * Math.PI / 180;
            const handleX = obj.x + obj.radius * Math.cos(rotationRad);
            const handleY = obj.y + obj.radius * Math.sin(rotationRad);
            const craneYellow = '#FFD700'; // Construction yellow
            const craneDarkYellow = '#DAA520';
            
            return (
                <React.Fragment>
                    <Circle x={obj.x} y={obj.y} radius={obj.radius} stroke="rgba(239, 68, 68, 0.7)" strokeWidth={2} dash={[10, 5]} listening={false}/>
                    <KonvaGroup ref={shapeRef} {...commonProps}>
                        {/* Tower Base */}
                        <Rect x={-10} y={-10} width={20} height={20} fill={craneYellow} stroke={craneDarkYellow} strokeWidth={1}/>
                        {/* Jib (main arm) */}
                        <Line points={[0, 0, obj.radius, 0]} stroke={craneYellow} strokeWidth={5} />
                        {/* Counter-Jib (short arm) */}
                        <Line points={[0, 0, -20, 0]} stroke={craneYellow} strokeWidth={5} />
                         {/* Counterweight */}
                        <Rect x={-30} y={-5} width={10} height={10} fill="#696969" />
                        {/* Cabin */}
                        <Rect x={0} y={-15} width={15} height={10} fill={craneYellow} stroke={craneDarkYellow} strokeWidth={1} />
                    </KonvaGroup>
                    <Circle 
                        x={handleX}
                        y={handleY}
                        radius={10} fill="#ef4444" draggable 
                        onDragMove={(e) => {
                             const stage = e.target.getStage();
                             const mousePos = stage.getPointerPosition();
                             if (!mousePos) return;
                             const dx = mousePos.x - obj.x;
                             const dy = mousePos.y - obj.y;
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
                    fill="rgba(239, 68, 68, 0.2)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dash={[10, 5]}
                    offsetX={obj.width / 2}
                    offsetY={obj.height / 2}
                    {...commonProps}
                />
             );
        }
        else { // Generiskt ikonobjekt
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


const CanvasPanel: React.FC<CanvasPanelProps> = ({ stageRef, objects, background, setBackground, selectedId, setSelectedId, checkDeselect, addObject, updateObject, removeObject, drawingState, setDrawingState }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [bgImage] = useImage(background?.url || '');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
    const [tempLinePoints, setTempLinePoints] = useState<number[]>([]);
    const [blinkerVisible, setBlinkerVisible] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [size, setSize] = useState<{ width: number; height: number; }>({ width: 0, height: 0 });

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
                // eslint-disable-next-line react-hooks/exhaustive-deps
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (drawingState && drawingState.points.length > 0) {
            setBlinkerVisible(true); // Se till att den syns direkt när en ny punkt läggs till
            const interval = setInterval(() => {
                setBlinkerVisible(v => !v);
            }, 500);
            return () => clearInterval(interval);
        }
    }, [drawingState]);


    const handleLibraryDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!stageRef.current || drawingState) return;

        stageRef.current.setPointersPositions(e);
        const position = stageRef.current.getPointerPosition();
        if (!position) return;
        
        try {
            const item = JSON.parse(e.dataTransfer.getData('application/json')) as LibraryItem;
            addObject(item, position);
        } catch (error) {
            console.error("Failed to parse dropped data:", error);
        }
    };
    
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
                const typedarray = new Uint8Array(fileReader.result as ArrayBuffer);
                const pdf = await (window as any).pdfjsLib.getDocument(typedarray).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                setBackground({ url: canvas.toDataURL(), width: canvas.width, height: canvas.height });
            };
            fileReader.readAsArrayBuffer(file);
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        processFile(file);
        event.target.value = ''; // Reset input
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Stop it from bubbling to the main drop handler
        const file = e.dataTransfer.files?.[0];
        if (!file || !(file.type.startsWith('image/') || file.type === 'application/pdf')) return;
        processFile(file);
    };


    const handleStageRightClick = (e: any) => {
        e.evt.preventDefault();
        
        // If we are in drawing mode, the right-click finishes the drawing.
        if (drawingState) {
            if (drawingState.points.length >= 4) { // Need at least 2 points for a line.
                addObject(drawingState.item, { x: 0, y: 0 }, { points: drawingState.points });
            }
            setDrawingState(null); // Exit drawing mode.
            return; // Important: Do not proceed to show the context menu.
        }

        // If not drawing, handle the context menu for objects.
        setContextMenu(null); // Close any existing menu
        const target = e.target;
        // Show context menu only if we clicked on an object, not the stage itself.
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

    const handleLabelChange = (id: string) => {
        const obj = objects.find(o => o.id === id);
        const newLabel = prompt(`Ange ny etikett för "${obj?.label}":`, obj?.label);
        if (newLabel) {
            updateObject(id, { label: newLabel });
        }
        setContextMenu(null);
    };

    const handleStageClick = (e: any) => {
        if (contextMenu) {
            setContextMenu(null);
        }
        if (!drawingState) {
            checkDeselect(e);
            return;
        }

        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;
        setDrawingState(s => s ? ({...s, points: [...s.points, pos.x, pos.y] }) : null);
    };

    const handleStageDblClick = (e: any) => {
        if (!drawingState || drawingState.points.length < 4) return;
        
        const finalPoints = [...drawingState.points];
        addObject(drawingState.item, { x: 0, y: 0 }, { points: finalPoints });
        setDrawingState(null);
    };
    
    const handleStageMouseMove = (e: any) => {
        if (!drawingState || drawingState.points.length === 0) {
            setTempLinePoints([]);
            return;
        }
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;
        setTempLinePoints([...drawingState.points, pos.x, pos.y]);
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

        const newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
        stage.scale({ x: newScale, y: newScale });
        
        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
    };

    const zoom = (factor: number) => {
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = stage.scaleX();
        const newScale = oldScale * factor;
        const center = {
            x: stage.width() / 2,
            y: stage.height() / 2,
        };
        const mousePointTo = {
            x: (center.x - stage.x()) / oldScale,
            y: (center.y - stage.y()) / oldScale,
        };
         const newPos = {
            x: center.x - mousePointTo.x * newScale,
            y: center.y - mousePointTo.y * newScale,
        };
        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
    };

    const handleTextDblClick = (obj: APDObject, node: any) => {
        if (!isText(obj)) return;
        setSelectedId(null);

        const textPosition = node.absolutePosition();
        const stage = node.getStage();
        const areaPosition = {
            x: stage.container().offsetLeft + textPosition.x,
            y: stage.container().offsetTop + textPosition.y,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        textarea.value = obj.text;
        textarea.style.position = 'absolute';
        textarea.style.top = areaPosition.y + 'px';
        textarea.style.left = areaPosition.x + 'px';
        textarea.style.width = node.width() - node.padding() * 2 + 'px';
        textarea.style.height = node.height() - node.padding() * 2 + 5 + 'px';
        textarea.style.fontSize = node.fontSize() * stage.scaleX() + 'px';
        textarea.style.border = '1px solid #ddd';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = node.lineHeight();
        textarea.style.fontFamily = node.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = node.align();
        textarea.style.color = node.fill();
        const rotation = node.rotation();
        let transform = '';
        if (rotation) {
            transform += 'rotateZ(' + rotation + 'deg)';
        }
        textarea.style.transform = transform;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 3 + 'px';
        textarea.focus();

        const removeTextarea = () => {
            if (document.body.contains(textarea)) {
                 updateObject(obj.id, { text: textarea.value });
                 document.body.removeChild(textarea);
            }
        }
        
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                removeTextarea();
            }
            if (e.key === 'Escape') {
                document.body.removeChild(textarea);
            }
        });
        textarea.addEventListener('blur', removeTextarea);
    }

    return (
        <main 
            ref={containerRef} 
            className="flex-1 bg-white relative" 
            onDrop={handleLibraryDrop} 
            onDragOver={e => e.preventDefault()}
            style={{ cursor: drawingState ? 'crosshair' : 'default' }}
        >
            {!background && (
                <div 
                    onDrop={handleFileDrop} 
                    onDragOver={(e) => e.preventDefault()} 
                    className="absolute inset-2 md:inset-4 flex items-center justify-center z-10"
                >
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-4 border-dashed border-slate-300 rounded-2xl p-8 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-700 mb-2">Dra & Släpp Ritning Här</h2>
                        <p className="text-slate-500 mb-6">eller klicka för att ladda upp en PDF- eller bildfil</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-6 rounded-lg shadow-sm hover:shadow transition-all"
                        >
                            Importera Ritning
                        </button>
                    </div>
                </div>
            )}
            {contextMenu && (
                <div style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute z-50 bg-slate-800 shadow-xl rounded-lg py-1.5 w-48 border border-slate-700">
                    <button onClick={() => handleLabelChange(contextMenu.id)} className="block w-full text-left px-4 py-1.5 text-sm text-slate-300 hover:bg-slate-700">Ändra etikett</button>
                    <button onClick={() => { removeObject(contextMenu.id); setContextMenu(null); }} className="block w-full text-left px-4 py-1.5 text-sm text-red-500 hover:bg-slate-700">Ta bort</button>
                </div>
            )}
            <Stage
                ref={stageRef}
                width={size.width}
                height={size.height}
                onClick={handleStageClick}
                onDblClick={handleStageDblClick}
                onMouseMove={handleStageMouseMove}
                onTouchStart={checkDeselect}
                onWheel={handleWheel}
                onMouseDown={(e) => { if (e.evt.button !== 2) setContextMenu(null) }}
                onContextMenu={handleStageRightClick}
            >
                <Layer>
                    {background && <KonvaImage image={bgImage} width={background.width} height={background.height} />}
                </Layer>
                <Layer>
                    {objects.map(obj => (
                        <DraggableObject
                            key={obj.id}
                            obj={obj}
                            isSelected={obj.id === selectedId}
                            onSelect={() => setSelectedId(obj.id)}
                            onChange={(attrs) => updateObject(obj.id, attrs)}
                            onTextDblClick={handleTextDblClick}
                        />
                    ))}
                     {drawingState && <Line points={tempLinePoints} stroke={(drawingState.item.initialProps as any).stroke || 'black'} strokeWidth={(drawingState.item.initialProps as any).strokeWidth || 2} dash={(drawingState.item.initialProps as any).dash} />}
                     {drawingState && drawingState.points.length > 0 && (
                        <Circle
                            x={drawingState.points[drawingState.points.length - 2]}
                            y={drawingState.points[drawingState.points.length - 1]}
                            radius={6}
                            fill="#ef4444"
                            stroke="white"
                            strokeWidth={1}
                            visible={blinkerVisible}
                            listening={false}
                            shadowColor="black"
                            shadowBlur={5}
                            shadowOpacity={0.5}
                        />
                    )}
                </Layer>
            </Stage>
            <div className="absolute bottom-4 left-4 bg-slate-800 rounded-lg shadow-md flex flex-col border border-slate-700">
                <button onClick={() => zoom(1.2)} className="p-2 text-slate-300 hover:bg-slate-700 border-b border-slate-700 transition-colors rounded-t-md" aria-label="Zooma in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => zoom(1 / 1.2)} className="p-2 text-slate-300 hover:bg-slate-700 transition-colors rounded-b-md" aria-label="Zooma ut">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                </button>
            </div>
        </main>
    );
};

export default CanvasPanel;