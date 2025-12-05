
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { APDObject, LibraryItem, ProjectInfo, DrawingTool, CustomLegendItem, isRectTool } from './types';
import { defaultProjectInfo, defaultCustomLegend } from './utils/defaults';
import { useHistory } from './hooks/useHistory';

import Header from './components/header/Header';
import Library from './components/library/LibraryPanel';
import Legend from './components/legend/LegendPanel';
import CanvasPanel from './components/canvas/CanvasPanel';
import ThreeDView from './components/3d/ThreeDView';
import { LIBRARY_CATEGORIES } from './constants/libraryItems';
import { loadAPD } from './utils/apdFileHandler';
import { handlePDF } from './utils/pdfHandler';

const App: React.FC = () => {
    const stageRef = useRef<any>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);

    const { state: objects, setState: setObjects, undo, redo, canUndo, canRedo, resetHistory } = useHistory<APDObject[]>([]);
    
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
        if (backgroundUrl && (backgroundUrl.startsWith('blob:') || backgroundUrl.startsWith('data:'))) {
            return () => URL.revokeObjectURL(backgroundUrl);
        }
    }, [background?.url]);

    const removeObjects = useCallback((ids: string[]) => {
        if (ids.length === 0) return;
        setObjects(objects.filter(obj => !ids.includes(obj.id)), true);
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    }, [objects, setObjects]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) return;
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

    const addObject = useCallback((item: LibraryItem, position: {x: number, y: number}, extraProps: Partial<APDObject> = {}) => {
        const baseProps = { ...item.initialProps, width: item.width || item.initialProps?.width || 50, height: item.height || item.initialProps?.height || 50 };
        
        let newObject: APDObject = {
            id: uuidv4(), rotation: 0, scaleX: 1, scaleY: 1,
            ...baseProps,
            type: item.type, item: item, quantity: 1, 
            x: position.x, y: position.y,
            ...extraProps,
        };

        if (isRectTool(newObject.type) && newObject.type === 'text') {
            newObject = {
                ...newObject,
                text: newObject.text || 'Text',
                fill: newObject.fill || '#000000',
                fontSize: newObject.fontSize || 24,
                padding: newObject.padding || 10, 
                width: newObject.width || 100,
                height: newObject.height || 30,
            };
        }

        setObjects([...objects, newObject], true);
    }, [objects, setObjects]);

    const updateObject = useCallback((id: string, attrs: Partial<APDObject>, immediate: boolean) => {
        const newObjects = objects.map(obj => (obj.id === id ? { ...obj, ...attrs } : obj));
        setObjects(newObjects, immediate);
    }, [objects, setObjects]);

    const handleUpdateGroupQuantity = (itemId: string, newQuantity: number) => {
        const groupObjects = objects.filter(obj => obj.item.id === itemId);
        const currentTotal = groupObjects.reduce((sum, obj) => sum + obj.quantity, 0);
        const diff = newQuantity - currentTotal;

        if (diff > 0) {
             // Öka kvantiteten på det sista objektet i gruppen
            const lastObject = groupObjects[groupObjects.length - 1];
            if (lastObject) {
                updateObject(lastObject.id, { quantity: lastObject.quantity + diff }, true);
            }
        } else if (diff < 0) {
            // Minska kvantiteten eller ta bort objekt
            let remainingToRemove = -diff;
            const updatedObjects = [...objects];

            for (let i = groupObjects.length - 1; i >= 0 && remainingToRemove > 0; i--) {
                const obj = groupObjects[i];
                if (obj.quantity <= remainingToRemove) {
                    remainingToRemove -= obj.quantity;
                    const index = updatedObjects.findIndex(o => o.id === obj.id);
                    if (index !== -1) updatedObjects.splice(index, 1);
                } else {
                    const index = updatedObjects.findIndex(o => o.id === obj.id);
                    if (index !== -1) updatedObjects[index] = { ...obj, quantity: obj.quantity - remainingToRemove };
                    remainingToRemove = 0;
                }
            }
            setObjects(updatedObjects, true);
        }
    };
    
    const resetProjectForNewBackground = (newBackground: { url: string; width: number; height: number; }) => {
        setBackground(newBackground);
        resetHistory([]);
        setProjectInfo(defaultProjectInfo);
        setCustomLegendItems(defaultCustomLegend);
        setSelectedIds([]);
    };

    const handleFile = async (file: File) => {
        const toastId = toast.loading(`Laddar ${file.name}...`);
        try {
            let data;
            if (file.name.endsWith('.apd')) data = await loadAPD(file);
            else if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    resetProjectForNewBackground({ url, width: img.width, height: img.height });
                    toast.success('Bilden har laddats!');
                };
                img.onerror = () => { toast.error('Kunde inte ladda bildfilen.'); URL.revokeObjectURL(url); }
                img.src = url;
                toast.dismiss(toastId);
                return;
            } else if (file.type === 'application/pdf') {
                const bg = await handlePDF(file);
                resetProjectForNewBackground(bg);
                toast.success('PDF-filen har laddats!');
                toast.dismiss(toastId);
                return;
            } else {
                throw new Error('Filtypen stöds inte. Välj en .apd, bild- eller PDF-fil.');
            }
            
            setProjectInfo(data.projectInfo);
            setBackground(data.background);
            resetHistory(data.objects);
            setCustomLegendItems(data.customLegendItems);
            toast.success('Projektet har laddats!');

        } catch (error) {
            console.error(error);
            toast.error(`Kunde inte ladda filen: ${error instanceof Error ? error.message : 'Okänt fel'}`);
        } finally {
            toast.dismiss(toastId);
        }
    };

    const clearProject = () => {
        toast((t) => (
            <span className='flex flex-col gap-3'>
              Är du säker? Allt kommer att raderas.
              <div className='flex gap-2'>
                <button className='bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded w-full' onClick={() => {
                    setBackground(null);
                    resetHistory([]);
                    setProjectInfo(defaultProjectInfo);
                    setCustomLegendItems(defaultCustomLegend);
                    setSelectedIds([]);
                    toast.dismiss(t.id);
                    toast.success('Projektet har rensats!');
                }}>
                  Ja, Rensa Allt
                </button>
                <button className='bg-slate-500 hover:bg-slate-400 text-white font-bold py-2 px-4 rounded w-full' onClick={() => toast.dismiss(t.id)}>
                  Avbryt
                </button>
              </div>
            </span>
          ), { duration: 6000 });
    };

    return (
        <DndProvider backend={HTML5Backend}>
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
                        {show3D ? <ThreeDView 
                                    objects={objects}
                                    background={background}
                                    libraryCategories={LIBRARY_CATEGORIES}
                                    selectedId={selectedIds.length > 0 ? selectedIds[0] : null}
                                    onSelect={(id) => setSelectedIds(id ? [id] : [])}
                                    onObjectChange={(id, attrs) => updateObject(id, attrs, false)} // Debounced update
                                />
                               : <CanvasPanel 
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
                                    handleFile={handleFile}
                                    undo={undo}
                                    redo={redo}
                                    canUndo={canUndo}
                                    canRedo={canRedo}
                                />}
                    </div>
                    {background && <Legend 
                                    isOpen={isLegendOpen}
                                    projectInfo={projectInfo}
                                    setProjectInfo={setProjectInfo}
                                    objects={objects}
                                    customItems={customLegendItems}
                                    setCustomItems={setCustomLegendItems}
                                    onRemoveObject={removeObjects}
                                    onUpdateObject={handleUpdateGroupQuantity}
                                 />}
                </div>
            </div>
        </DndProvider>
    );
};

export default App;
