
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import LibraryPanel from '../components/LibraryPanel';
import CanvasPanel from '../components/CanvasPanel';
import LegendPanel from '../components/LegendPanel';
import Header from '../components/Header';
const ThreeDView = React.lazy(() => import('../components/ThreeDView'));
import { LibraryItem, APDObject, CustomLegendItem, isCrane, isWalkway, isFence, isSchakt, isConstructionTraffic, ProjectInfo } from '../types/index';
import { isPointInCircle, isPointInRotatedRect } from '../utils/geometry';
import { useHistory } from '../hooks/useHistory';

type DrawingState = {
    type: 'walkway' | 'fence' | 'construction-traffic' | 'pen';
    points: number[];
    item: LibraryItem;
} | null;


const App: React.FC = () => {
    const {
        state: objects,
        setState: setObjects,
        snapshot,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory
    } = useHistory<APDObject[]>([]);

    const [customLegendItems, setCustomLegendItems] = useState<CustomLegendItem[]>([]);
    const [background, setBackground] = useState<{ url: string, width: number, height: number } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    
    const [drawingState, setDrawingState] = useState<DrawingState>(null);
    const [pendingItem, setPendingItem] = useState<LibraryItem | null>(null);

    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false); 
    const [show3D, setShow3D] = useState(false);
    
    const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
        company: '',
        projectName: '',
        projectId: ''
    });
    
    const stageRef = useRef<any>(null); 
    const mainContainerRef = useRef<HTMLDivElement>(null);

    const checkDeselect = (e: any) => {
        if (drawingState || pendingItem) return;
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    const addObject = useCallback((item: LibraryItem, position: { x: number; y: number }, extraProps: Partial<APDObject> = {}) => {
        snapshot();
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
        setObjects([...objects, newObject]);
        setDrawingState(null);
        setPendingItem(null);
    }, [objects, snapshot, setObjects]);
    
    const updateObject = useCallback((id: string, attrs: Partial<APDObject>) => {
        setObjects(prev => prev.map(obj => (obj.id === id ? { ...obj, ...attrs } : obj)));
    }, [setObjects]);

    const removeObject = useCallback((id: string) => {
        snapshot();
        setObjects(prev => prev.filter(obj => obj.id !== id));
        setSelectedId(null);
    }, [snapshot, setObjects]);

    const clearProject = useCallback(() => {
      snapshot();
      setObjects([]);
      setCustomLegendItems([]);
      setBackground(null);
      setSelectedId(null);
      setDrawingState(null);
      setPendingItem(null);
      setProjectInfo({ company: '', projectName: '', projectId: '' });
    }, [snapshot, setObjects]);

    const loadProjectData = useCallback((data: { objects?: APDObject[], customLegendItems?: CustomLegendItem[], projectInfo?: ProjectInfo }) => {
        if (data.objects) resetHistory(data.objects);
        if (data.customLegendItems) setCustomLegendItems(data.customLegendItems);
        if (data.projectInfo) setProjectInfo(data.projectInfo);
    }, [resetHistory]);

    // Anropas när man klickar på ett objekt i biblioteket
    const handleLibraryItemSelect = useCallback((item: LibraryItem) => {
        if (item.type === 'walkway' || item.type === 'fence' || item.type === 'construction-traffic' || item.type === 'pen') {
            setSelectedId(null);
            setPendingItem(null);
            setDrawingState({ type: item.type as any, points: [], item: item });
        } else {
            // För vanliga ikoner, sätt i "pending"-läge för placering
            setSelectedId(null);
            setDrawingState(null);
            setPendingItem(item);
        }
        
        // Stäng biblioteket på mobil för att se kartan
        if (window.innerWidth < 768) {
            setIsLibraryOpen(false);
        }
    }, []);

    const cancelActions = useCallback(() => {
        setDrawingState(null);
        setPendingItem(null);
    }, []);


    // Tangentbordsgenvägar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    if(canRedo) redo();
                } else {
                    if(canUndo) undo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                if(canRedo) redo();
            }

            if (e.key === 'Escape') {
                if (drawingState || pendingItem) {
                    cancelActions();
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
    }, [selectedId, drawingState, pendingItem, cancelActions, removeObject, undo, redo, canUndo, canRedo]);

    // Riskzon-logik
    useEffect(() => {
        const cranes = objects.filter(isCrane);
        const schakts = objects.filter(isSchakt);
        
        const hasRiskZones = cranes.length > 0 || schakts.length > 0;
        
        if (!hasRiskZones) {
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
                for (let i = 0; i < obj.points.length; i += 2) {
                    const point = { x: obj.points[i], y: obj.points[i+1] };
                    for (const crane of cranes) {
                        if (isPointInCircle(point, { x: crane.x, y: crane.y }, crane.radius)) {
                            isInRiskZone = true;
                            break;
                        }
                    }
                    if (isInRiskZone) break;
                    for (const schakt of schakts) {
                        if (isPointInRotatedRect(point, schakt)) {
                            isInRiskZone = true;
                            break;
                        }
                    }
                    if (isInRiskZone) break;
                }
                if (obj.isInRiskZone !== isInRiskZone) {
                    return { ...obj, isInRiskZone };
                }
            }
            return obj;
        });

        if (JSON.stringify(objects) !== JSON.stringify(updatedObjects)) {
            setObjects(updatedObjects);
        }
    }, [objects, setObjects]);


    return (
        <div className="flex flex-col h-screen font-sans bg-slate-800 text-slate-300">
            <Header
                stageRef={stageRef}
                mainContainerRef={mainContainerRef}
                background={background}
                setBackground={setBackground}
                objects={objects}
                loadProjectData={loadProjectData}
                customLegendItems={customLegendItems}
                projectInfo={projectInfo}
                setProjectInfo={setProjectInfo}
                clearProject={clearProject}
                toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
                toggleLegend={() => setIsLegendOpen(!isLegendOpen)}
                show3D={show3D}
                setShow3D={setShow3D}
            />
            <div className="flex flex-1 overflow-hidden" ref={mainContainerRef}>
                {show3D ? (
                    <Suspense fallback={
                        <div className="flex items-center justify-center w-full h-full bg-slate-900 overflow-hidden flex-col z-50">
                             <div className="construction-loader">
                                 <div className="relative">
                                    <svg className="helmet-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 38 C 8 20, 56 20, 56 38 L 56 42 L 8 42 Z" fill="#FFC107" stroke="#fff" strokeWidth="2"/>
                                        <path d="M4 42 L 60 42 L 60 48 C 60 50, 4 50, 4 48 Z" fill="#FFC107" stroke="#fff" strokeWidth="2"/>
                                        <rect x="28" y="18" width="8" height="12" fill="#FFE082"/>
                                    </svg>
                                    <svg className="hammer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/.svg">
                                        <path d="M14.5 5.5L18.5 9.5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M12 8L16 12L7 21L3 17L12 8Z" fill="#a16207" stroke="#fff" strokeWidth="1"/>
                                        <path d="M16 3L21 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M13 6L18 11" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                 </div>
                                 <div className="loader-text-main">BYGGPILOT</div>
                                 <div className="loader-text-sub">Startar 3D-vy</div>
                            </div>
                        </div>
                    }>
                         <ThreeDView 
                            objects={objects} 
                            background={background}
                            updateObject={updateObject}
                         />
                    </Suspense>
                ) : (
                    <>
                        <LibraryPanel 
                            onItemSelect={handleLibraryItemSelect}
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
                            pendingItem={pendingItem}
                            setPendingItem={setPendingItem}
                            onSnapshot={snapshot}
                            undo={undo}
                            redo={redo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                        />
                        <LegendPanel
                            objects={objects}
                            customItems={customLegendItems}
                            setCustomItems={setCustomLegendItems}
                            isOpen={isLegendOpen}
                            onClose={() => setIsLegendOpen(false)}
                        />
                    </>
                )}
            </div>
            
            {/* Instruktions-overlay (Endast i 2D) */}
             {!show3D && (drawingState || pendingItem) && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-700 text-white py-3 px-6 rounded-full shadow-lg text-sm z-20 flex items-center space-x-3 whitespace-nowrap border border-slate-500 animate-fade-in-up">
                     <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>
                        {pendingItem ? (
                            <>Klicka på kartan för att placera <b>{pendingItem.name}</b></>
                        ) : (
                            drawingState?.type === 'pen' 
                            ? <>Ritläge: <b>Håll nere och rita</b></>
                            : <>Klicka: <b>Lägg punkt</b>. Avsluta: <b>Högerklick / Enter</b></>
                        )}
                        <span className="ml-3 text-slate-400 border-l border-slate-500 pl-3">ESC för att avbryta</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default App;
