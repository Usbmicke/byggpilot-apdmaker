
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { APDObject, LibraryItem, ProjectInfo, CustomLegendItem, isCrane, isLineTool, isRectTool } from './types';
import { defaultProjectInfo, defaultCustomLegend } from './utils/defaults';
import { useHistory } from './hooks/useHistory';
import Header from './components/header/Header';
import Library from './components/library/LibraryPanel';
import Legend from './components/legend/LegendPanel';
import CanvasPanel, { CanvasPanelRef } from './components/canvas/CanvasPanel';
import ThreeDView, { ThreeDViewHandles } from './components/3d/ThreeDView';
import { LIBRARY_CATEGORIES } from './constants/libraryItems';
import { handlePDF } from './utils/pdfHandler';
import { exportPlan } from './lib/exportUtils';

const App: React.FC = () => {
    const stageRef = useRef<any>(null);
    const canvasPanelRef = useRef<CanvasPanelRef>(null);
    const threeDViewRef = useRef<ThreeDViewHandles>(null);

    const { state: objects, setState: setObjects, undo, redo, canUndo, canRedo, resetHistory } = useHistory<APDObject[]>([]);

    const [background, setBackground] = useState<{ url: string; width: number; height: number; } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [projectInfo, setProjectInfo] = useState<ProjectInfo>(defaultProjectInfo);
    const [customLegendItems, setCustomLegendItems] = useState<CustomLegendItem[]>(defaultCustomLegend);
    const [isLocked, setIsLocked] = useState(false);

    const [selectedTool, setSelectedTool] = useState<LibraryItem | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(true);
    const [isLegendOpen, setIsLegendOpen] = useState(true);
    const [show3D, setShow3D] = useState(false);

    useEffect(() => {
        const backgroundUrl = background?.url;
        if (backgroundUrl && (backgroundUrl.startsWith('blob:') || backgroundUrl.startsWith('data:'))) {
            return () => URL.revokeObjectURL(backgroundUrl);
        }
    }, [background?.url]);

    // FIX UX-2: Global cursor change for drawing tools
    useEffect(() => {
        const isDrawing = selectedTool && (isLineTool(selectedTool.type) || isRectTool(selectedTool.type));
        if (isDrawing) {
            document.body.classList.add('drawing-cursor');
        } else {
            document.body.classList.remove('drawing-cursor');
        }

        // Cleanup function
        return () => {
            document.body.classList.remove('drawing-cursor');
        };
    }, [selectedTool]);

    const removeObjects = useCallback((ids: string[]) => {
        if (ids.length === 0) return;
        setObjects(objects.filter(obj => !ids.includes(obj.id)), true);
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    }, [objects, setObjects]);

    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) setSelectedIds([]);
    };

    const addObject = useCallback((item: LibraryItem, position: { x: number, y: number }, extraProps: Partial<APDObject> = {}): APDObject => {
        const baseDimension = background ? Math.max(background.width, background.height) : 2000;
        const dynamicSize = Math.max(20, baseDimension / 40);
        const baseProps = { ...item.initialProps, width: item.width || item.initialProps?.width || dynamicSize, height: item.height || item.initialProps?.height || dynamicSize };
        let newObject: APDObject = {
            id: uuidv4(), rotation: 0, scaleX: 1, scaleY: 1, ...baseProps, type: item.type, item: item, quantity: 1, x: position.x, y: position.y, visible: true, ...extraProps,
        };
        if (isCrane(newObject)) {
            newObject.radius = newObject.radius || baseDimension / 10;
            newObject.width = newObject.width || dynamicSize * 1.5;
            newObject.height = newObject.height || dynamicSize * 1.5;
        }
        setObjects([...objects, newObject], true);
        return newObject;
    }, [objects, setObjects, background]);

    const updateObject = useCallback((id: string, attrs: Partial<APDObject>, immediate: boolean) => {
        const newObjects = objects.map(obj => (obj.id === id ? { ...obj, ...attrs } : obj));
        setObjects(newObjects, immediate);
    }, [objects, setObjects]);

    const handleUpdateGroupQuantity = (groupId: string, newQuantity: number) => {
        const groupObjects = objects.filter(obj => (obj.item.id || obj.type) === groupId);
        const otherObjects = objects.filter(obj => (obj.item.id || obj.type) !== groupId);
        const template = groupObjects[0];
        if (!template) return;
        let finalObjects = otherObjects;
        if (newQuantity > 0) {
            const representativeObject: APDObject = { ...template, id: uuidv4(), quantity: newQuantity, x: template.x, y: template.y };
            finalObjects = [...otherObjects, representativeObject];
        } 
        setObjects(finalObjects, true);
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
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    resetProjectForNewBackground({ url, width: img.width, height: img.height });
                    toast.success('Bilden har laddats!', { id: toastId });
                };
                img.onerror = () => { toast.error('Kunde inte ladda bildfilen.', { id: toastId }); URL.revokeObjectURL(url); }
                img.src = url;
                return;
            } else if (file.type === 'application/pdf') {
                const bg = await handlePDF(file);
                resetProjectForNewBackground(bg);
                toast.success('PDF-filen har laddats!', { id: toastId });
                return;
            } else {
                throw new Error('Filtypen stöds inte. Välj en bild- eller PDF-fil.');
            }
        } catch (error) {
            console.error(error);
            toast.error(`Kunde inte ladda filen: ${error instanceof Error ? error.message : 'Okänt fel'}`, { id: toastId });
        }
    };

    const clearProject = () => {
        setBackground(null);
        resetHistory([]);
        setProjectInfo(defaultProjectInfo);
        setCustomLegendItems(defaultCustomLegend);
        setSelectedIds([]);
        toast.success('Projektet har rensats!');
    };

    const handleExport = async (format: 'jpeg' | 'pdf', imagePromise: Promise<{ url: string; width: number; height: number; } | null>) => {
        const toastId = toast.loading('Förbereder export...');
        try {
            const image = await imagePromise;
            if (!image) {
                throw new Error('Kunde inte skapa bild för export.');
            }
            const result = await exportPlan(format, { projectInfo, objects, customLegendItems, image });
            if (result.status === 'success') {
                toast.success('Exporten är klar!', { id: toastId });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast.error(`Export misslyckades: ${error instanceof Error ? error.message : 'Okänt fel'}`, { id: toastId, duration: 6000 });
        }
    };

    const handleExport2D = (format: 'jpeg' | 'pdf') => {
        const imagePromise = new Promise<{ url: string; width: number; height: number; } | null>((resolve) => {
            if (stageRef.current) {
                const url = stageRef.current.toDataURL({ pixelRatio: 2 });
                resolve({ url, width: stageRef.current.width(), height: stageRef.current.height() });
            } else {
                resolve(null);
            }
        });
        handleExport(format, imagePromise);
    };

    const handleExport3D = (format: 'jpeg' | 'pdf') => {
        const imagePromise = new Promise<{ url: string; width: number; height: number; } | null>((resolve) => {
            if (threeDViewRef.current) {
                const imageData = threeDViewRef.current.capture();
                resolve(imageData);
            } else {
                resolve(null);
            }
        });
        handleExport(format, imagePromise);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col h-screen bg-slate-900 text-white font-sans overflow-hidden">
                <Toaster position="bottom-center" toastOptions={{ className: 'bg-slate-700 text-white', duration: 4000 }} />
                <Header
                    handleFile={handleFile}
                    clearProject={clearProject}
                    toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
                    toggleLegend={() => setIsLegendOpen(!isLegendOpen)}
                    show3D={show3D}
                    setShow3D={setShow3D}
                    onExport2D={handleExport2D}
                    onExport3D={handleExport3D}
                    backgroundIsLoaded={!!background}
                />
                <div className="flex flex-1 overflow-hidden">
                    <Library isOpen={isLibraryOpen} selectedTool={selectedTool} onSelectTool={setSelectedTool} />
                    <div className="flex-1 flex flex-col relative">
                        {show3D ? <ThreeDView ref={threeDViewRef} objects={objects} background={background} libraryCategories={LIBRARY_CATEGORIES} selectedId={selectedIds.length > 0 ? selectedIds[0] : null} onSelect={(id) => setSelectedIds(id ? [id] : [])} onObjectChange={(id, attrs) => updateObject(id, attrs, false)} onSnapshotRequest={() => setObjects(objects, true)} isLocked={isLocked} setIsLocked={setIsLocked} />
                            : <CanvasPanel ref={canvasPanelRef} stageRef={stageRef} objects={objects} background={background} selectedIds={selectedIds} setSelectedIds={setSelectedIds} checkDeselect={checkDeselect} addObject={addObject} updateObject={updateObject} removeObjects={removeObjects} handleFile={handleFile} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} selectedTool={selectedTool} setSelectedTool={setSelectedTool} />}
                    </div>
                    {background && <Legend isOpen={isLegendOpen} projectInfo={projectInfo} setProjectInfo={setProjectInfo} objects={objects} customItems={customLegendItems} setCustomItems={setCustomLegendItems} onRemoveObject={removeObjects} onUpdateObject={handleUpdateGroupQuantity} />}
                </div>
            </div>
        </DndProvider>
    );
};

export default App;
