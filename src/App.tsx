
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { APDObject, LibraryItem, ProjectInfo, DrawingTool, isTextTool, CustomLegendItem } from '../types';
import { defaultProjectInfo, defaultCustomLegend } from '../constants/libraryItems'; // Korrigerad sökväg
import useHistory from '../hooks/useHistory';

import Header from '../components/Header';
import Library from '../components/LibraryPanel';
import Legend from '../components/LegendPanel';
import CanvasPanel from '../components/CanvasPanel';
import { loadAPD, saveAPD } from '../utils/apdFileHandler';
import { handlePDF } from '../utils/pdfHandler';

// Konfigurera PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const App: React.FC = () => {
    const stageRef = useRef<any>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);

    const [objects, setObjects, { undo, redo, canUndo, canRedo, snapshot }] = useHistory<APDObject[]>([]);
    const [background, setBackground] = useState<{ url: string; width: number; height: number; } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [projectInfo, setProjectInfo] = useState<ProjectInfo>(defaultProjectInfo);
    const [customLegendItems, setCustomLegendItems] = useState<CustomLegendItem[]>(defaultCustomLegend);
    
    const [drawingState, setDrawingState] = useState<{ type: DrawingTool, points: number[], item: LibraryItem } | null>(null);
    const [pendingItem, setPendingItem] = useState<LibraryItem | null>(null);
    
    const [isLibraryOpen, setIsLibraryOpen] = useState(true);
    const [isLegendOpen, setIsLegendOpen] = useState(true);
    const [show3D, setShow3D] = useState(false); 

    // Effekt för att spara automatiskt
    useEffect(() => {
        const handle = setTimeout(() => saveAPD({ projectInfo, background, objects, customLegendItems }), 2000);
        return () => clearTimeout(handle);
    }, [objects, background, projectInfo, customLegendItems]);

    // Effekt för att hantera kortkommandon
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); undo(); }
                if (e.key === 'y' || (e.key === 'Z' && e.shiftKey)) { e.preventDefault(); redo(); }
            }
            if (e.key === 'Escape') {
                setDrawingState(null);
                setPendingItem(null);
                setSelectedId(null);
            }
            if(e.key === 'Delete' || e.key === 'Backspace') {
                if(selectedId) removeObject(selectedId)
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, selectedId]);


    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    const addObject = (item: LibraryItem, position: {x: number, y: number}, extraProps: Partial<APDObject> = {}) => {
        snapshot(); // Spara nuvarande state för ångra
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

    const removeObject = (id: string) => {
        snapshot();
        setObjects(prev => prev.filter(obj => obj.id !== id));
        setSelectedId(null);
    }

    const updateObject = (id: string, attrs: Partial<APDObject>) => {
        setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...attrs } : obj));
    };

    const handleFile = async (file: File) => {
        const toastId = toast.loading(`Laddar ${file.name}...`);
        try {
            if (file.name.endsWith('.apd')) {
                const data = await loadAPD(file);
                snapshot();
                setProjectInfo(data.projectInfo);
                setBackground(data.background);
                setObjects(data.objects);
                setCustomLegendItems(data.customLegendItems);
                toast.success('Projektet har laddats!');
            } else if (file.type.startsWith('image')) {
                snapshot();
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => setBackground({ url, width: img.width, height: img.height });
            } else if (file.type === 'application/pdf') {
                snapshot();
                const bg = await handlePDF(file);
                setBackground(bg);
            }
            toast.success(`${file.name} har laddats som bakgrund.`);
        } catch (error) {
            console.error(error);
            toast.error(`Kunde inte ladda filen: ${error instanceof Error ? error.message : 'Okänt fel'}`);
        } finally {
            toast.dismiss(toastId);
        }
    };

    const clearProject = () => {
        snapshot();
        setObjects([]);
        setBackground(null);
        setProjectInfo(defaultProjectInfo);
        setCustomLegendItems(defaultCustomLegend);
        setSelectedId(null);
        toast.success('Projektet har rensats!');
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white font-sans overflow-hidden" ref={mainContainerRef}>
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
                        customItems={customLegendItems}
                        setCustomItems={setCustomLegendItems} 
                    />
                )}
            </div>
        </div>
    );
};

export default App;
