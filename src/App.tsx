
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import LibraryPanel from '../components/LibraryPanel';
import CanvasPanel from '../components/CanvasPanel';
import LegendPanel from '../components/LegendPanel';
import Header from '../components/Header';
import { LibraryItem, APDObject, CustomLegendItem, ProjectInfo, isLineTool, isTextTool } from '../types/index';
import { useHistory } from '../hooks/useHistory';
import { LIBRARY_CATEGORIES } from '../config/library'; // <-- NY IMPORT

const ThreeDView = React.lazy(() => import('../components/3d/ThreeDView'));

type DrawingState = { type: 'walkway' | 'fence' | 'construction-traffic' | 'pen'; points: number[]; item: LibraryItem; } | null;

const App: React.FC = () => {
    const { state: objects, setState: setObjects, snapshot, undo, redo, canUndo, canRedo, resetHistory } = useHistory<APDObject[]>([]);
    const [background, setBackground] = useState<{ url: string, width: number, height: number } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawingState, setDrawingState] = useState<DrawingState>(null);
    const [pendingItem, setPendingItem] = useState<LibraryItem | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(true);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [show3D, setShow3D] = useState(false);
    const [projectInfo, setProjectInfo] = useState<ProjectInfo>({ company: '', projectName: '', projectId: '' });
    const [customLegendItems, setCustomLegendItems] = useState<CustomLegendItem[]>([]);
    
    const stageRef = useRef<any>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const backgroundUrlRef = useRef<string | null>(null);

    // ... (alla funktioner som loadProjectData, handleFile, addObject, etc. är oförändrade) ...
    const loadProjectData = useCallback((data: { objects?: APDObject[], customLegendItems?: CustomLegendItem[], projectInfo?: ProjectInfo, background?: any }) => {
        if (data.objects) resetHistory(data.objects);
        if (data.customLegendItems) setCustomLegendItems(data.customLegendItems);
        if (data.projectInfo) setProjectInfo(data.projectInfo);
        if (data.background) setBackground(data.background);
    }, [resetHistory]);

    const handleFile = useCallback((file: File) => { /* ... */ }, [loadProjectData]);
    const addObject = useCallback((item: LibraryItem, pos: {x: number, y: number}, extraProps: Partial<APDObject> = {}) => { /* ... */ }, []);
    const updateObject = useCallback((id: string, attrs: Partial<APDObject>) => { /* ... */ }, []);
    const removeObject = useCallback((id: string) => { /* ... */ }, []);
    const clearProject = useCallback(() => { /* ... */ }, []);
    const handleLibraryItemSelect = useCallback((item: LibraryItem) => { /* ... */ }, []);
    const cancelActions = useCallback(() => { /* ... */ }, []);
    const checkDeselect = (e: any) => { if (e.target === e.target.getStage()) setSelectedId(null); };

    useEffect(() => { /* ... keydown listener ... */ }, []);

    return (
        <div className="flex flex-col h-screen font-sans bg-slate-800 text-slate-300 relative">
            <Toaster position="bottom-center" toastOptions={{ className: 'bg-slate-700 text-white', success: { duration: 4000 }, error: { duration: 6000 } }} />
            <Header {...{ stageRef, mainContainerRef, background, handleFile, objects, loadProjectData, customLegendItems, projectInfo, setProjectInfo, clearProject, toggleLibrary: () => setIsLibraryOpen(!isLibraryOpen), toggleLegend: () => setIsLegendOpen(!isLegendOpen), show3D, setShow3D, canUndo, canRedo, undo, redo }} />
            <div className="flex flex-1 overflow-hidden" ref={mainContainerRef}>
                <LibraryPanel onItemSelect={handleLibraryItemSelect} isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
                
                <div className="relative flex-1">
                    {show3D && background ? (
                        <Suspense fallback={<div className='w-full h-full flex items-center justify-center'><p>Laddar 3D-vy...</p></div>}>
                            <ThreeDView 
                                objects={objects} 
                                background={background} 
                                libraryCategories={LIBRARY_CATEGORIES} // <-- NY PROP
                            />
                        </Suspense>
                    ) : (
                        <CanvasPanel 
                            {...{ 
                                stageRef, objects, background, selectedId, setSelectedId, checkDeselect, addObject, 
                                updateObject, removeObject, drawingState, setDrawingState, pendingItem, setPendingItem, 
                                onSnapshot: snapshot, handleFile
                            }}
                        />
                    )}
                </div>

                <LegendPanel {...{ objects, customItems: customLegendItems, setCustomItems: setCustomLegendItems, isOpen: isLegendOpen, onClose: () => setIsLegendOpen(false), is3DMode: show3D }} />
            </div>
        </div>
    );
};

export default App;
