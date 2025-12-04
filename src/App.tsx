
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { APDObject, LibraryItem, ProjectInfo, DrawingTool, CustomLegendItem } from './types';
import { defaultProjectInfo, defaultCustomLegend } from './utils/defaults';
import { useHistory } from './hooks/useHistory';

import Header from './components/header/Header';
import Library from './components/library/LibraryPanel';
import Legend from './components/legend/LegendPanel';
import CanvasPanel from './components/canvas/CanvasPanel';

import { loadAPD } from './utils/apdFileHandler';
import { handlePDF } from './utils/pdfHandler';

const App: React.FC = () => {
    const stageRef = useRef<any>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);

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
    
    const [background, setBackground] = useState<{ url: string; width: number; height: number; } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [projectInfo, setProjectInfo] = useState<ProjectInfo>(defaultProjectInfo);
    const [customLegendItems, setCustomLegendItems] = useState<CustomLegendItem[]>(defaultCustomLegend);
    
    const [drawingState, setDrawingState] = useState<{ type: DrawingTool, points: number[], item: LibraryItem } | null>(null);
    const [pendingItem, setPendingItem] = useState<LibraryItem | null>(null);
    
    const [isLibraryOpen, setIsLibraryOpen] = useState(true);
    const [isLegendOpen, setIsLegendOpen] = useState(true);
    const [show3D, setShow3D] = useState(false); 

    useEffect(() => {
        const backgroundUrl = background?.url;
        if (backgroundUrl && backgroundUrl.startsWith('blob:')) {
            return () => {
                URL.revokeObjectURL(backgroundUrl);
            };
        }
    }, [background?.url]);


    const removeObjects = useCallback((ids: string[]) => {
        if (ids.length === 0) return;
        snapshot();
        setObjects(prev => prev.filter(obj => !ids.includes(obj.id)));
        setSelectedIds([]);
    }, [snapshot, setObjects]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); undo(); }
                if (e.key === 'y' || (e.key === 'Z' && e.shiftKey)) { e.preventDefault(); redo(); }
            }
            if (e.key === 'Escape') {
                setDrawingState(null);
                setPendingItem(null);
                setSelectedIds([]);
            }
            if(e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.length > 0) removeObjects(selectedIds);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, selectedIds, removeObjects]);

    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) setSelectedIds([]);
    };

    const addObject = (item: LibraryItem, position: {x: number, y: number}, extraProps: Partial<APDObject> = {}) => {
        snapshot();
        const newObject: APDObject = {
            id: uuidv4(),
            item: item,
            type: item.type,
            x: position.x,
            y: position.y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            ...extraProps
        };
        setObjects(prev => [...prev, newObject]);
    };

    const updateObject = (id: string, attrs: Partial<APDObject>) => {
        setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...attrs } : obj));
    };

    const handleFile = async (file: File) => {
        const toastId = toast.loading(`Laddar ${file.name}...`);
        try {
            if (file.name.endsWith('.apd')) {
                const data = await loadAPD(file);
                setProjectInfo(data.projectInfo);
                setBackground(data.background);
                setObjects(data.objects);
                setCustomLegendItems(data.customLegendItems);
                resetHistory(data.objects);
                toast.success('Projektet har laddats!');
            } else if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    setBackground({ url, width: img.width, height: img.height });
                    resetHistory([]);
                    setObjects([]);
                    setProjectInfo(defaultProjectInfo);
                    setCustomLegendItems(defaultCustomLegend);
                    setSelectedIds([]);
                    toast.success('Bilden har laddats!');
                };
                img.onerror = () => {
                    toast.error('Kunde inte ladda bildfilen.');
                    URL.revokeObjectURL(url); 
                }
                img.src = url;
            } else if (file.type === 'application/pdf') {
                const bg = await handlePDF(file);
                setBackground(bg);
                resetHistory([]);
                setObjects([]);
                setProjectInfo(defaultProjectInfo);
                setCustomLegendItems(defaultCustomLegend);
                setSelectedIds([]);
                toast.success('PDF-filen har laddats!');
            } else {
                toast.error('Filtypen stöds inte. Välj en .apd, bild- eller PDF-fil.');
            }
        } catch (error) {
            console.error(error);
            toast.error(`Kunde inte ladda filen: ${error instanceof Error ? error.message : 'Okänt fel'}`);
        } finally {
            toast.dismiss(toastId);
        }
    };

    const clearProject = () => {
        resetHistory([]);
        setBackground(null);
        setProjectInfo(defaultProjectInfo);
        setCustomLegendItems(defaultCustomLegend);
        setSelectedIds([]);
        toast.success('Projektet har rensats!');
    };

    return (
        <div 
            className="flex flex-col h-screen bg-slate-900 text-white font-sans overflow-hidden"
            ref={mainContainerRef}
        >
            <Toaster position="bottom-center" toastOptions={{ className: 'bg-slate-700 text-white', duration: 4000 }} />
            
            <Header 
                stageRef={stageRef}
                mainContainerRef={mainContainerRef}
                background={background}
                handleFile={handleFile}
                objects={objects}
                customLegendItems={customLegendItems}
                projectInfo={projectInfo}
                setProjectInfo={setProjectInfo}
                clearProject={clearProject}
                toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
                toggleLegend={() => setIsLegendOpen(!isLegendOpen)}
                show3D={show3D}
                setShow3D={setShow3D}
            />

            <div className="flex flex-1 overflow-hidden">
                <Library 
                    isOpen={isLibraryOpen}
                    setPendingItem={setPendingItem}
                    setDrawingState={setDrawingState}
                />

                <div className="flex-1 flex flex-col relative">
                    <CanvasPanel 
                        stageRef={stageRef}
                        objects={objects}
                        background={background}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        checkDeselect={checkDeselect}
                        addObject={addObject}
                        updateObject={updateObject}
                        removeObjects={removeObjects}
                        drawingState={drawingState}
                        setDrawingState={setDrawingState}
                        pendingItem={pendingItem}
                        setPendingItem={setPendingItem}
                        onSnapshot={snapshot}
                        handleFile={handleFile}
                        undo={undo}
                        redo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                </div>
                
                {!show3D && background && (
                    <Legend 
                        isOpen={isLegendOpen}
                        projectInfo={projectInfo}
                        setProjectInfo={setProjectInfo}
                        objects={objects}
                        customItems={customLegendItems}
                        setCustomItems={setCustomLegendItems} 
                    />
                )}
            </div>
        </div>
    );
};

export default App;
