import React, { useState, useRef, useEffect, useCallback } from 'react';
import LibraryPanel from './components/LibraryPanel';
import CanvasPanel from './components/CanvasPanel';
import LegendPanel from './components/LegendPanel';
import Header from './components/Header';
import { LibraryItem, APDObject, CustomLegendItem, isCrane, isWalkway, isFence, isSchakt, isConstructionTraffic } from './types/index';
import { isPointInCircle, isPointInRotatedRect } from './utils/geometry';

type DrawingState = {
    type: 'walkway' | 'fence' | 'construction-traffic';
    points: number[];
    item: LibraryItem;
} | null;


const App: React.FC = () => {
    const [objects, setObjects] = useState<APDObject[]>([]);
    const [customLegendItems, setCustomLegendItems] = useState<CustomLegendItem[]>([]);
    const [background, setBackground] = useState<{ url: string, width: number, height: number } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawingState, setDrawingState] = useState<DrawingState>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false); // Start with legend closed
    
    const stageRef = useRef<any>(null); // Konva.Stage
    const mainContainerRef = useRef<HTMLDivElement>(null);

    const checkDeselect = (e: any) => {
        // Avmarkera inte om vi är i ritläge
        if (drawingState) return;

        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    const addObject = useCallback((item: LibraryItem, position: { x: number; y: number }, extraProps: Partial<APDObject> = {}) => {
        const newObject = {
            id: `${item.type}-${Date.now()}`,
            x: position.x,
            y: position.y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            label: item.name,
            type: item.type,
            ...item.initialProps,
            ...extraProps
        } as APDObject;
        setObjects(prev => [...prev, newObject]);
        setDrawingState(null); // Avsluta ritläget efter att ha lagt till
    }, []);
    
    const updateObject = useCallback((id: string, attrs: Partial<APDObject>) => {
        setObjects(prev => prev.map(obj => (obj.id === id ? { ...obj, ...attrs } : obj)));
    }, []);

    const removeObject = useCallback((id: string) => {
        setObjects(prev => prev.filter(obj => obj.id !== id));
        setSelectedId(null);
    }, []);

    const clearProject = useCallback(() => {
      setObjects([]);
      setCustomLegendItems([]);
      setBackground(null);
      setSelectedId(null);
      setDrawingState(null);
    }, []);

    const startDrawing = useCallback((item: LibraryItem) => {
        if (item.type === 'walkway' || item.type === 'fence' || item.type === 'construction-traffic') {
            setSelectedId(null);
            setDrawingState({ type: item.type as 'walkway' | 'fence' | 'construction-traffic', points: [], item: item });
            setIsLibraryOpen(false); // Stäng biblioteket på mobilen när ritning påbörjas
        }
    }, []);

    const cancelDrawing = useCallback(() => {
        setDrawingState(null);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (drawingState) {
                    cancelDrawing();
                } else if (selectedId) {
                    setSelectedId(null);
                }
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                const activeEl = document.activeElement;
                if (activeEl && (['INPUT', 'TEXTAREA'].includes(activeEl.tagName))) {
                    return;
                }
                removeObject(selectedId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, drawingState, cancelDrawing, removeObject]);

    useEffect(() => {
        const cranes = objects.filter(isCrane);
        const schakts = objects.filter(isSchakt);
        
        const hasRiskZones = cranes.length > 0 || schakts.length > 0;
        
        if (!hasRiskZones) {
             // Om inga riskzoner, se till att alla linjer inte är markerade som i riskzon
            const needsUpdate = objects.some(obj => (isWalkway(obj) || isFence(obj) || isConstructionTraffic(obj)) && obj.isInRiskZone);
            if (needsUpdate) {
                setObjects(prev => prev.map(obj => {
                    if ((isWalkway(obj) || isFence(obj) || isConstructionTraffic(obj)) && obj.isInRiskZone) {
                        return { ...obj, isInRiskZone: false };
                    }
                    return obj;
                }));
            }
            return;
        }

        const updatedObjects = objects.map(obj => {
            if (isWalkway(obj) || isFence(obj) || isConstructionTraffic(obj)) {
                let isInRiskZone = false;
                // En linjes punkter är relativa till dess (x,y), vilket är 0,0 för linjer.
                // Så vi behöver inte addera obj.x/y.
                for (let i = 0; i < obj.points.length; i += 2) {
                    const point = { x: obj.points[i], y: obj.points[i+1] };
                    
                    // Kontrollera mot kranar
                    for (const crane of cranes) {
                        if (isPointInCircle(point, { x: crane.x, y: crane.y }, crane.radius)) {
                            isInRiskZone = true;
                            break;
                        }
                    }
                    if (isInRiskZone) break;

                    // Kontrollera mot schakter
                    for (const schakt of schakts) {
                        if (isPointInRotatedRect(point, schakt)) {
                            isInRiskZone = true;
                            break;
                        }
                    }
                    if (isInRiskZone) break;
                }
                 // Uppdatera endast om statusen är annorlunda för att undvika oändliga loopar
                if (obj.isInRiskZone !== isInRiskZone) {
                    return { ...obj, isInRiskZone };
                }
            }
            return obj;
        });

        // Sätt state endast om det finns faktiska ändringar
        if (JSON.stringify(objects) !== JSON.stringify(updatedObjects)) {
            setObjects(updatedObjects);
        }
    }, [objects]);


    return (
        <div className="flex flex-col h-screen font-sans bg-slate-800 text-slate-300">
            <Header
                stageRef={stageRef}
                mainContainerRef={mainContainerRef}
                background={background}
                setBackground={setBackground}
                objects={objects}
                setObjects={setObjects}
                customLegendItems={customLegendItems}
                setCustomLegendItems={setCustomLegendItems}
                clearProject={clearProject}
                toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
                toggleLegend={() => setIsLegendOpen(!isLegendOpen)}
            />
            <div className="flex flex-1 overflow-hidden" ref={mainContainerRef}>
                <LibraryPanel 
                    startDrawing={startDrawing}
                    isOpen={isLibraryOpen}
                    onClose={() => setIsLibraryOpen(false)}
                />
                <CanvasPanel
                    stageRef={stageRef}
                    objects={objects}
                    background={background}
                    setBackground={setBackground}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    checkDeselect={checkDeselect}
                    addObject={addObject}
                    updateObject={updateObject}
                    removeObject={removeObject}
                    drawingState={drawingState}
                    setDrawingState={setDrawingState}
                />
                <LegendPanel
                    objects={objects}
                    customItems={customLegendItems}
                    setCustomItems={setCustomLegendItems}
                    isOpen={isLegendOpen}
                    onClose={() => setIsLegendOpen(false)}
                />
            </div>
             {drawingState && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-700 text-white py-2 px-4 rounded-full shadow-lg text-sm z-10 flex items-center space-x-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <span>Ritläge: Klicka för att rita. Högerklicka för att slutföra. [ESC] för att avbryta.</span>
                </div>
            )}
        </div>
    );
};

export default App;