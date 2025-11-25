
import React, { useRef, useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APDObject, CustomLegendItem } from '../types/index';
import { LIBRARY_CATEGORIES } from '../constants/libraryItems';

interface HeaderProps {
    stageRef: React.RefObject<any>;
    mainContainerRef: React.RefObject<HTMLDivElement>;
    background: { url: string, width: number, height: number } | null;
    setBackground: (bg: { url: string, width: number, height: number } | null) => void;
    objects: APDObject[];
    setObjects: (objects: APDObject[]) => void;
    customLegendItems: CustomLegendItem[];
    setCustomLegendItems: (items: CustomLegendItem[]) => void;
    clearProject: () => void;
    toggleLibrary: () => void;
    toggleLegend: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
    stageRef, mainContainerRef, background, setBackground, objects, setObjects, 
    customLegendItems, setCustomLegendItems, clearProject, toggleLibrary, toggleLegend,
    undo, redo, canUndo, canRedo
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const projectInputRef = useRef<HTMLInputElement>(null);
    const exportTemplateRef = useRef<HTMLDivElement>(null);
    
    const [isExporting, setIsExporting] = useState(false);
    const [exportImageSrc, setExportImageSrc] = useState<string | null>(null);
    
    // Project Info Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<'image' | 'pdf' | null>(null);
    const [projectInfo, setProjectInfo] = useState({
        company: '',
        projectName: '',
        projectId: ''
    });

    // --- Dataförberedelse för legenden ---
    const legendData = useMemo(() => {
        const grouped: { [category: string]: { type: string, name: string, count: number, icon: React.ReactElement }[] } = {};
        const objectCounts: { [type: string]: number } = {};

        // Räkna objekt
        objects.forEach(obj => {
            objectCounts[obj.type] = (objectCounts[obj.type] || 0) + 1;
        });

        // Strukturera baserat på bibliotekskategorier
        LIBRARY_CATEGORIES.forEach(cat => {
            const activeItemsInCat = cat.items.filter(item => objectCounts[item.type]);
            if (activeItemsInCat.length > 0) {
                grouped[cat.name] = activeItemsInCat.map(item => ({
                    type: item.type,
                    name: item.name,
                    count: objectCounts[item.type],
                    icon: item.icon
                }));
            }
        });

        // Lägg till anpassade objekt under "Övrigt" om de finns, eller "Anpassat"
        if (customLegendItems.length > 0) {
            grouped["Övrigt"] = customLegendItems.map(item => ({
                type: 'custom',
                name: item.name,
                count: item.count,
                icon: (
                    <div className="w-6 h-6 text-slate-800">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
                    </div>
                )
            }));
        }

        return grouped;
    }, [objects, customLegendItems]);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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
                if (context) {
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    setBackground({ url: canvas.toDataURL(), width: canvas.width, height: canvas.height });
                }
            };
            fileReader.readAsArrayBuffer(file);
        }
        event.target.value = ''; // Återställ input
    };

    const initiateExport = (format: 'image' | 'pdf') => {
        if (!stageRef.current || !background) {
            alert("Ingen ritning att spara.");
            return;
        }
        setExportFormat(format);
        setShowExportModal(true);
    }

    // 1. Fånga scenen -> 2. Rendera mall -> 3. Fånga mall -> 4. Ladda ner
    const generateCompositeExport = async () => {
        setShowExportModal(false);
        setIsExporting(true);
        
        // Steg 1: Fånga rå ritning från Konva
        setTimeout(async () => {
            const stage = stageRef.current;
            const oldScale = stage.scale();
            const oldPos = stage.position();
            const oldSize = { width: stage.width(), height: stage.height() };
            
            try {
                // Nollställ vy
                stage.width(background?.width || 800);
                stage.height(background?.height || 600);
                stage.scale({ x: 1, y: 1 });
                stage.position({ x: 0, y: 0 });
                stage.batchDraw();
                
                // Skapa bild av ritningen
                const drawingDataURL = stage.toDataURL({ pixelRatio: 2 });
                setExportImageSrc(drawingDataURL); // Detta triggar rendering av den dolda mallen

                // Vänta lite så att React hinner rendera bilden i mallen
                setTimeout(async () => {
                    if (exportTemplateRef.current) {
                        // Steg 2: Fånga hela mallen (Ritning + Legend) med html2canvas
                        const canvas = await html2canvas(exportTemplateRef.current, {
                            scale: 2, // Högre upplösning
                            backgroundColor: '#ffffff',
                            useCORS: true, // Viktigt för externa bilder
                        });

                        if (exportFormat === 'image') {
                            const link = document.createElement('a');
                            link.download = `${projectInfo.projectName || 'apd-plan'}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                        } else {
                            const imgData = canvas.toDataURL('image/png');
                            // A4 Landskap: 297mm x 210mm
                            // Vi vill dock anpassa PDFen efter bildens storlek för bästa kvalitet
                            const pdf = new jsPDF({
                                orientation: 'landscape',
                                unit: 'px',
                                format: [canvas.width, canvas.height] // Anpassad storlek
                            });
                            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                            pdf.save(`${projectInfo.projectName || 'apd-plan'}.pdf`);
                        }
                    }
                    // Städa upp
                    setExportImageSrc(null);
                    setIsExporting(false);
                    setExportFormat(null);
                    
                    // Återställ scen
                    stage.width(oldSize.width);
                    stage.height(oldSize.height);
                    stage.scale(oldScale);
                    stage.position(oldPos);
                    stage.batchDraw();

                }, 800); // Ökad väntetid (800ms) för säker bildrendering

            } catch (error) {
                console.error("Export failed:", error);
                alert("Ett fel uppstod vid exporten.");
                setIsExporting(false);
                 // Återställ scen vid fel
                 stage.width(oldSize.width);
                 stage.height(oldSize.height);
                 stage.scale(oldScale);
                 stage.position(oldPos);
                 stage.batchDraw();
            }
        }, 100);
    };

    const handleSaveProject = () => {
        const projectData = {
            objects,
            customLegendItems,
        };
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'projekt.apd';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const projectData = JSON.parse(result);
                    setObjects(projectData.objects || []);
                    setCustomLegendItems(projectData.customLegendItems || []);
                }
            } catch (error) {
                console.error("Error loading project file:", error);
                alert("Felaktig projektfil.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Återställ input
    };

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between z-10 relative">
            {/* --- Export Modal --- */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-600 overflow-hidden">
                         <div className="bg-slate-700 p-4 border-b border-slate-600 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Projektinformation</h3>
                            <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">&times;</button>
                         </div>
                         <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Företagsnamn</label>
                                <input 
                                    type="text" 
                                    value={projectInfo.company}
                                    onChange={(e) => setProjectInfo({...projectInfo, company: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="T.ex. Byggbolaget AB"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Projektnamn</label>
                                <input 
                                    type="text" 
                                    value={projectInfo.projectName}
                                    onChange={(e) => setProjectInfo({...projectInfo, projectName: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="T.ex. Kvarteret Eken"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Projektnummer</label>
                                <input 
                                    type="text" 
                                    value={projectInfo.projectId}
                                    onChange={(e) => setProjectInfo({...projectInfo, projectId: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="T.ex. 2024-001"
                                />
                            </div>
                         </div>
                         <div className="bg-slate-700 p-4 flex justify-end gap-3 border-t border-slate-600">
                             <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors">Avbryt</button>
                             <button onClick={generateCompositeExport} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-all transform active:scale-95">Spara</button>
                         </div>
                    </div>
                </div>
            )}


            {/* --- Export Template (Hidden) --- */}
            <div 
                style={{ 
                    position: 'fixed', 
                    left: '-10000px', 
                    top: '-10000px',
                    width: '1600px', // Fast bredd för exportmallen
                    zIndex: -1
                }} 
            >
                <div ref={exportTemplateRef} className="bg-white text-slate-900 p-8 flex flex-col items-stretch min-h-[900px]">
                    <div className="border-b-4 border-slate-800 mb-6 pb-4 flex justify-between items-end">
                        <div className="flex flex-col">
                            <h1 className="text-7xl font-black tracking-tighter uppercase text-slate-900 leading-none mb-2" style={{fontFamily: 'Arial Black, sans-serif'}}>APD-PLAN</h1>
                            {projectInfo.company && <h2 className="text-2xl font-bold text-slate-600 uppercase tracking-wide">{projectInfo.company}</h2>}
                        </div>
                        <div className="text-right flex flex-col items-end">
                             {projectInfo.projectName && <span className="text-3xl font-bold text-slate-800">{projectInfo.projectName}</span>}
                             {projectInfo.projectId && <span className="text-xl font-medium text-slate-500">Nr: {projectInfo.projectId}</span>}
                             <span className="text-lg font-medium text-slate-400 mt-1">{new Date().toLocaleDateString('sv-SE')}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-8 flex-1">
                        {/* Vänster: Ritningen */}
                        <div className="flex-1 border-4 border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center relative min-h-[600px]">
                           {exportImageSrc && <img src={exportImageSrc} alt="Planritning" className="w-full h-auto object-contain" />}
                        </div>

                        {/* Höger: Förteckning */}
                        <div className="w-[350px] flex-shrink-0 bg-slate-100 p-6 rounded-lg border border-slate-300">
                            <h2 className="text-2xl font-bold mb-6 border-b-2 border-slate-300 pb-2 uppercase tracking-wide">Förteckning</h2>
                            <div className="space-y-6">
                                {Object.entries(legendData).map(([category, items]) => (
                                    <div key={category}>
                                        <h3 className="font-bold text-slate-700 mb-2 uppercase text-sm tracking-wider border-b border-slate-300">{category}</h3>
                                        <div className="space-y-2">
                                            {(items as { type: string, name: string, count: number, icon: React.ReactElement }[]).map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-slate-200">
                                                    <div className="flex items-center gap-3">
                                                        {/* Vi klonar elementet för att tvinga textfärgen till mörk för utskrift */}
                                                        <div className="w-8 h-8 flex-shrink-0 text-slate-800 [&>svg]:stroke-slate-800 [&>svg]:fill-none">
                                                            {React.cloneElement(item.icon as React.ReactElement<any>, { 
                                                                className: "w-full h-full" 
                                                            })}
                                                        </div>
                                                        <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-center w-8 h-8 bg-slate-200 rounded-full">
                                                        <span className="font-bold text-slate-800 text-sm">{item.count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {objects.length === 0 && customLegendItems.length === 0 && (
                                    <p className="text-slate-500 italic text-sm">Inga objekt utplacerade än.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-4 border-t border-slate-300 text-center text-slate-400 text-sm font-medium flex justify-between">
                         <span>Skapad med ByggPilot APD-Maker</span>
                         <span>{new Date().toLocaleString('sv-SE')}</span>
                    </div>
                </div>
            </div>

            {/* --- UI Feedback --- */}
            {isExporting && (
                <div className="absolute inset-0 bg-slate-900/90 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center p-6 bg-slate-800 rounded-xl border border-slate-600 shadow-2xl">
                        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-xl text-white font-bold">Genererar fil...</span>
                        <span className="text-sm text-slate-400 mt-2">Sätter ihop ritning och förteckning.</span>
                    </div>
                </div>
            )}

            {/* --- Header Content --- */}
            <div className="flex items-center gap-2">
                <button onClick={toggleLibrary} className="md:hidden p-2 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" aria-label="Visa bibliotek">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-slate-100">ByggPilot APD-Maker</h1>
                
                 {/* Undo / Redo Buttons (Visible on Mobile too) */}
                <div className="flex items-center bg-slate-700 rounded-lg ml-2 md:ml-4 p-0.5">
                    <button 
                        onClick={undo} 
                        disabled={!canUndo}
                        className={`p-1.5 rounded-md transition-colors ${!canUndo ? 'text-slate-500 cursor-not-allowed' : 'text-slate-200 hover:bg-slate-600 hover:text-white'}`}
                        title="Ångra (Ctrl+Z)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button 
                        onClick={redo} 
                        disabled={!canRedo}
                        className={`p-1.5 rounded-md transition-colors ${!canRedo ? 'text-slate-500 cursor-not-allowed' : 'text-slate-200 hover:bg-slate-600 hover:text-white'}`}
                        title="Gör om (Ctrl+Y)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {/* Desktop-knappar */}
                <div className="hidden md:flex items-center space-x-2">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-slate-600 hover:bg-slate-500 text-white font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Importera Ritning</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                    
                    <button onClick={() => initiateExport('image')} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Spara Bild</button>
                    
                    <button onClick={() => initiateExport('pdf')} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Spara PDF</button>

                    <button onClick={handleSaveProject} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Spara Projekt</button>
                    
                    <button onClick={() => projectInputRef.current?.click()} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Ladda Projekt</button>
                    <input type="file" ref={projectInputRef} onChange={handleLoadProject} accept=".apd" className="hidden" />

                    <button onClick={() => {if(window.confirm("Är du säker på att du vill rensa allt?")) clearProject()}} className="bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Rensa</button>
                </div>
                
                 {/* Mobil-meny knapp (3 punkter) */}
                 <div className="md:hidden relative group">
                     <button className="p-2 rounded-md hover:bg-slate-700 text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                     </button>
                     <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden hidden group-hover:block group-focus-within:block">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">Importera Ritning</button>
                        <button onClick={() => initiateExport('image')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">Spara Bild</button>
                        <button onClick={() => {if(window.confirm("Är du säker på att du vill rensa allt?")) clearProject()}} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300">Rensa Projekt</button>
                     </div>
                 </div>

                <button onClick={toggleLegend} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" aria-label="Visa/Dölj förteckning">
                    <span className="hidden md:inline text-sm font-medium">Förteckning</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Header;
