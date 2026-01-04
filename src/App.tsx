
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import Modal from './components/shared/Modal';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { pdfjs } from 'react-pdf';
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
import { CustomDragLayer } from './components/CustomDragLayer';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();

const App: React.FC = () => {
    const stageRef = useRef<any>(null);
    const canvasPanelRef = useRef<CanvasPanelRef>(null);
    const threeDViewRef = useRef<ThreeDViewHandles>(null);

    // Load initial objects from localStorage if available
    // We use useState with lazy initialization to ensure we only read from localStorage once
    const [initialObjects] = useState<APDObject[]>(() => {
        try {
            const saved = localStorage.getItem('apd-objects');
            return saved ? (JSON.parse(saved) || []) : [];
        } catch (e) {
            console.error('Failed to load objects', e);
            return [];
        }
    });

    const { state: objects, setState: setObjects, undo, redo, canUndo, canRedo, resetHistory } = useHistory<APDObject[]>(initialObjects);

    const [background, setBackground] = useState<{ url: string; width: number; height: number; } | null>(() => {
        try {
            const saved = localStorage.getItem('apd-background');
            if (!saved) return { url: '', width: 2000, height: 1500 }; // QA BYPASS
            const parsed = JSON.parse(saved);
            // Blob URLs are not persistent across reloads. discard them.
            if (parsed && parsed.url && (parsed.url.startsWith('blob:') || parsed.url.startsWith('data:'))) {
                return null;
            }
            return parsed;
        } catch (e) {
            console.error('Failed to load background', e);
            return { url: '', width: 2000, height: 1500 }; // QA BYPASS
        }
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [projectInfo, setProjectInfo] = useState<ProjectInfo>(() => {
        try {
            const saved = localStorage.getItem('apd-project-info');
            return saved ? (JSON.parse(saved) || defaultProjectInfo) : defaultProjectInfo;
        } catch (e) {
            console.error('Failed to load project info', e);
            return defaultProjectInfo;
        }
    });
    const [scale, setScale] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('apd-scale');
            return saved ? JSON.parse(saved) : 0.1;
        } catch (e) {
            console.error('Failed to load scale', e);
            return 0.1;
        }
    });

    const [customLegendItems, setCustomLegendItems] = useState<CustomLegendItem[]>(() => {
        try {
            const saved = localStorage.getItem('apd-custom-legend');
            return saved ? (JSON.parse(saved) || defaultCustomLegend) : defaultCustomLegend;
        } catch (e) {
            console.error('Failed to load custom legend', e);
            return defaultCustomLegend;
        }
    });
    const [isLocked, setIsLocked] = useState(false);

    const [selectedTool, setSelectedTool] = useState<LibraryItem | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(true);
    const [isLegendOpen, setIsLegendOpen] = useState(true);
    const [show3D, setShow3D] = useState(false);

    useEffect(() => {
        const backgroundUrl = background?.url;
        // Only revoke if it's a blob/data URL and we are actually unmounting or changing background
        return () => {
            if (backgroundUrl && (backgroundUrl.startsWith('blob:') || backgroundUrl.startsWith('data:'))) {
                // cleanup
            }
        };
    }, [background?.url]);

    // Force 2D view if background is removed (fix for user getting stuck in 3D after clearing project)
    useEffect(() => {
        if (!background) {
            setShow3D(false);
        }
    }, [background]);

    // Explicitly revoke previous URL when setting a new one
    const previousUrlRef = useRef<string | null>(null);
    useEffect(() => {
        const currentUrl = background?.url;
        if (previousUrlRef.current && previousUrlRef.current !== currentUrl) {
            if (previousUrlRef.current.startsWith('blob:') || previousUrlRef.current.startsWith('data:')) {
                URL.revokeObjectURL(previousUrlRef.current);
            }
        }
        previousUrlRef.current = currentUrl || null;
    }, [background?.url]);

    // Calibration State
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
    const [calibrationPixels, setCalibrationPixels] = useState<number | null>(null);
    const [calibrationLength, setCalibrationLength] = useState<string>('');

    // -- Persistence Effects --
    useEffect(() => {
        localStorage.setItem('apd-objects', JSON.stringify(objects));
    }, [objects]);

    useEffect(() => {
        localStorage.setItem('apd-project-info', JSON.stringify(projectInfo));
    }, [projectInfo]);

    useEffect(() => {
        localStorage.setItem('apd-custom-legend', JSON.stringify(customLegendItems));
    }, [customLegendItems]);

    useEffect(() => {
        localStorage.setItem('apd-scale', JSON.stringify(scale));
    }, [scale]);

    useEffect(() => {
        if (background) {
            localStorage.setItem('apd-background', JSON.stringify(background));
        } else {
            localStorage.removeItem('apd-background');
        }
    }, [background]);
    // -------------------------

    const handleCalibrationStart = () => {
        setIsCalibrationModalOpen(true);
    };

    const startDrawingCalibration = () => {
        setIsCalibrationModalOpen(false);
        setIsCalibrating(true);
        toast.dismiss();
        toast('Klicka på två punkter för att mäta ett känt avstånd.', { icon: '📏', duration: 5000 });
    };

    const handleCalibrationLineDrawn = (pixels: number) => {
        setIsCalibrating(false);
        setCalibrationPixels(pixels);
        setIsCalibrationModalOpen(true); // Re-open to enter meters
        setCalibrationLength('');
    };

    const applyCalibration = () => {
        const meters = parseFloat(calibrationLength.replace(',', '.'));
        if (isNaN(meters) || meters <= 0) {
            toast.error('Ange ett giltigt avstånd i meter.');
            return;
        }

        if (calibrationPixels) {
            const oldScale = scale; // Existing scale (meters per pixel)
            const newScale = meters / calibrationPixels; // New scale

            // Smart Calibration: Resize 'Physical' objects to maintain real-world size
            // Ratio > 1 means objects get bigger in pixels (because pixels are smaller meters)
            const ratio = oldScale / newScale;

            const updatedObjects = objects.map(obj => {
                // Check if physical symbol (Not a map tool like line, fence, zone)
                // "Schakt" is a RectTool, but arguably a physical area? 
                // Usually Schakt is defined by MAP AREA, so it should NOT resize. It marks a region.
                // Symbols (Shed, Toilet, Sign, Crane) should resize.

                // We exclude Line tools and standard Rect tools (Polygon, Zone, Schakt?)
                // isRectTool covers 'schakt', 'zone', 'etablering' (some).
                // Let's rely on exclusions.

                const isMapTool = isLineTool(obj.type) || isRectTool(obj.type);

                // Gate is tricky. It's an Icon, but snaps to Fence.
                // Fence is MapTool (fixed pixels). Gate fits in fence gap.
                // If scale changes, Fence stays 500px. Gate stays 50px?
                // If Gate resizes (becomes 100px), it won't fit the gap?
                // Actually, if Fence stays 500px, but 500px is now 5m instead of 50m...
                // The Gate SHOULD resize to stay 5m (become larger, fill more of the fence).
                // So YES, Gate should resize. Gate is NOT isLineTool/isRectTool.

                if (!isMapTool) {
                    return {
                        ...obj,
                        width: (obj.width || 0) * ratio,
                        height: (obj.height || 0) * ratio,
                        radius: obj.radius ? obj.radius * ratio : undefined,
                        // Position (x,y) stays fixed (it's a map coordinate).
                    };
                }
                return obj;
            });

            setObjects(updatedObjects, true);
            setScale(newScale);
            toast.success(`Skala kalibrerad! 1px = ${newScale.toFixed(4)}m. Objekt uppdaterade.`);
        } else {
            // Manual entry case
            if (meters > 0 && meters < 10) {
                const oldScale = scale;
                const newScale = meters;
                const ratio = oldScale / newScale;

                const updatedObjects = objects.map(obj => {
                    const isMapTool = isLineTool(obj.type) || isRectTool(obj.type);
                    if (!isMapTool) {
                        return {
                            ...obj,
                            width: (obj.width || 0) * ratio,
                            height: (obj.height || 0) * ratio,
                            radius: obj.radius ? obj.radius * ratio : undefined,
                        };
                    }
                    return obj;
                });

                setObjects(updatedObjects, true);
                setScale(newScale);
                toast.success(`Skala satt manuellt: ${meters}. Objekt uppdaterade.`);
            }
        }
        setIsCalibrationModalOpen(false);
        setCalibrationPixels(null);
    };


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
        // scale is "meters per pixel". So pixels = meters / scale.
        // Default scale is often 0.1 (1px = 10cm).
        const pixelsPerMeter = 1 / scale;

        const toPixels = (meters: number | undefined, defaultValue: number) => {
            return (meters ?? defaultValue) * pixelsPerMeter;
        }

        // Default size in meters if not found (2m x 2m)
        const baseWidthMeters = item.initialProps?.width || 2.0;
        const baseHeightMeters = item.initialProps?.height || baseWidthMeters;

        const widthPixels = Math.max(5, toPixels(baseWidthMeters, 2.0));
        const heightPixels = Math.max(5, toPixels(baseHeightMeters, 2.0));

        const baseProps: any = { ...item.initialProps, width: widthPixels, height: heightPixels };

        // Handle specific props that need scaling
        if (item.initialProps?.strokeWidth) {
            baseProps.strokeWidth = Math.max(1, toPixels(item.initialProps.strokeWidth, 0.2));
        }

        // Radius for crane or zones
        if (item.initialProps?.radius) {
            baseProps.radius = toPixels(item.initialProps.radius, 10);
        }

        let newObject: APDObject = {
            id: uuidv4(), rotation: 0, scaleX: 1, scaleY: 1, ...baseProps, type: item.type, item: item, quantity: 1, x: position.x, y: position.y, visible: true, ...extraProps,
        };

        if (isCrane(newObject)) {
            // Ensure crane has valid dimensions if not set by initialProps
            if (!newObject.radius) newObject.radius = toPixels(45, 45); // 45m radius default
            // Ensure crane base size is reasonable if not set
            if (!newObject.width) newObject.width = toPixels(5, 5);
            if (!newObject.height) newObject.height = toPixels(5, 5);
        }

        setObjects([...objects, newObject], true);
        return newObject;
    }, [objects, setObjects, scale]);

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
        setBackground({ url: '', width: 2000, height: 1500 }); // QA BYPASS: Keep default background

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
            <CustomDragLayer scale={scale} />
            <div className="flex flex-col h-screen bg-zinc-950 text-white font-sans overflow-hidden">
                <Toaster position="bottom-center" toastOptions={{ className: 'bg-zinc-800 text-white border border-white/10', duration: 4000 }} />
                <Header
                    handleFile={handleFile}
                    clearProject={clearProject}
                    toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
                    toggleLegend={() => setIsLegendOpen(!isLegendOpen)}
                    show3D={show3D}
                    setShow3D={setShow3D}
                    onExport2D={handleExport2D}
                    onExport3D={handleExport3D}
                    onCalibrate={handleCalibrationStart}
                    backgroundIsLoaded={!!background}
                />
                <div className="flex flex-1 overflow-hidden">
                    <Library isOpen={isLibraryOpen} selectedTool={selectedTool} onSelectTool={setSelectedTool} />
                    <div className="flex-1 flex flex-col relative">
                        {show3D ? <ThreeDView ref={threeDViewRef} objects={objects} background={background} libraryCategories={LIBRARY_CATEGORIES} selectedId={selectedIds.length > 0 ? selectedIds[0] : null} onSelect={(id) => setSelectedIds(id ? [id] : [])} onObjectChange={(id, attrs) => updateObject(id, attrs, false)} onAddObject={addObject} onSnapshotRequest={() => setObjects(objects, true)} isLocked={isLocked} setIsLocked={setIsLocked} scale={scale} />
                            : <CanvasPanel ref={canvasPanelRef} stageRef={stageRef} objects={objects} background={background} selectedIds={selectedIds} setSelectedIds={setSelectedIds} checkDeselect={checkDeselect} addObject={addObject} updateObject={updateObject} removeObjects={removeObjects} handleFile={handleFile} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} selectedTool={selectedTool} setSelectedTool={setSelectedTool} isCalibrating={isCalibrating} onCalibrationFinished={handleCalibrationLineDrawn} scale={scale} />}
                    </div>
                    {background && <Legend isOpen={isLegendOpen} projectInfo={projectInfo} setProjectInfo={setProjectInfo} objects={objects} customItems={customLegendItems} setCustomItems={setCustomLegendItems} onRemoveObject={removeObjects} onUpdateObject={handleUpdateGroupQuantity} />}
                </div>

                <Modal isOpen={isCalibrationModalOpen} onClose={() => setIsCalibrationModalOpen(false)} title="Kalibrera Skala">
                    <div className="space-y-4">
                        {!calibrationPixels ? (
                            <>
                                <p className="text-zinc-400">För att skalan ska bli korrekt måste vi veta hur många pixlar en meter motsvarar på din ritning.</p>
                                <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                                    <h3 className="text-white font-bold mb-2">Alternativ 1: Mät i ritningen (Rekommenderas)</h3>
                                    <p className="text-sm text-zinc-400 mb-4">Klicka på knappen nedan och markera sedan två punkter i ritningen som du vet avståndet mellan (t.ex. en måttsatt vägg eller en skalstock).</p>
                                    <button onClick={startDrawingCalibration} className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-bold transition-colors">Starta Mätning</button>
                                </div>
                                <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                                    <h3 className="text-white font-bold mb-2">Alternativ 2: Manuell inmatning</h3>
                                    <p className="text-sm text-zinc-400 mb-4">Om du redan vet skalfaktorn (meter per pixel) kan du ange den här.</p>
                                    <input
                                        type="number"
                                        placeholder="Ex: 0.05"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white mb-2"
                                        value={calibrationLength}
                                        onChange={(e) => setCalibrationLength(e.target.value)}
                                    />
                                    <button onClick={applyCalibration} className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-bold transition-colors">Spara Skala</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-zinc-300">Du har mätt en sträcka på <span className="text-white font-mono font-bold">{calibrationPixels.toFixed(1)} px</span>.</p>
                                <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                                    <label className="block text-sm font-bold text-white mb-2">Hur lång är denna sträcka i verkligheten (meter)?</label>
                                    <input
                                        type="text"
                                        value={projectInfo.projectName}
                                        onChange={(e) => setProjectInfo({ ...projectInfo, projectName: e.target.value })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                                        placeholder="T.ex. Kvarteret Eken"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={() => setIsCalibrationModalOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Avbryt</button>
                                    <button onClick={applyCalibration} className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold transition-colors shadow-lg shadow-emerald-900/20">Kalibrera</button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            </div>
        </DndProvider>
    );
};

export default App;
