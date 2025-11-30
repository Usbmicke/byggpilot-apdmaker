
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
    show3D: boolean;
    setShow3D: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    stageRef, mainContainerRef, background, setBackground, objects, setObjects, 
    customLegendItems, setCustomLegendItems, clearProject, toggleLibrary, toggleLegend,
    show3D, setShow3D
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportTemplateRef = useRef<HTMLDivElement>(null);
    
    const [isExporting, setIsExporting] = useState(false);
    const [exportImageSrc, setExportImageSrc] = useState<string | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    
    // Project Info Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<'image' | 'pdf' | null>(null);
    const [projectInfo, setProjectInfo] = useState({
        company: '',
        projectName: '',
        projectId: ''
    });

    // Stäng exportmenyn om man klickar utanför
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isExportMenuOpen && !(event.target as Element).closest('.export-menu-container')) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExportMenuOpen]);

    // --- Dataförberedelse för legenden ---
    const legendData = useMemo(() => {
        const grouped: { [category: string]: { type: string, name: string, count: number, icon: React.ReactElement }[] } = {};
        const objectCounts: { [type: string]: number } = {};
        
        const HIDDEN_TYPES = ['text', 'pen'];

        objects.forEach(obj => {
            if (HIDDEN_TYPES.includes(obj.type)) return;
            objectCounts[obj.type] = (objectCounts[obj.type] || 0) + 1;
        });

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

    // Hanterar både Bild/PDF (bakgrund) och .apd (projektfil)
    const handleCombinedImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Om det är en projektfil (.apd)
        if (file.name.endsWith('.apd') || file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = e.target?.result;
                    if (typeof result === 'string') {
                        const projectData = JSON.parse(result);
                        if (projectData.objects) setObjects(projectData.objects);
                        if (projectData.customLegendItems) setCustomLegendItems(projectData.customLegendItems);
                        alert("Projekt inläst!");
                    }
                } catch (error) {
                    console.error("Error loading project file:", error);
                    alert("Kunde inte läsa projektfilen.");
                }
            };
            reader.readAsText(file);
        } 
        // Om det är en bild eller PDF
        else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
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
        } else {
            alert("Okänt filformat. Välj en bild, PDF eller .apd-fil.");
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
        setIsExportMenuOpen(false);
    }

    const generateCompositeExport = async () => {
        setShowExportModal(false);
        setIsExporting(true);
        
        setTimeout(async () => {
            const stage = stageRef.current;
            const oldScale = stage.scale();
            const oldPos = stage.position();
            const oldSize = { width: stage.width(), height: stage.height() };
            
            try {
                stage.width(background?.width || 800);
                stage.height(background?.height || 600);
                stage.scale({ x: 1, y: 1 });
                stage.position({ x: 0, y: 0 });
                stage.batchDraw();
                
                const drawingDataURL = stage.toDataURL({ pixelRatio: 2 });
                setExportImageSrc(drawingDataURL); 

                setTimeout(async () => {
                    if (exportTemplateRef.current) {
                        const canvas = await html2canvas(exportTemplateRef.current, {
                            scale: 2, 
                            backgroundColor: '#ffffff',
                            useCORS: true, 
                        });

                        if (exportFormat === 'image') {
                            const link = document.createElement('a');
                            link.download = `${projectInfo.projectName || 'apd-plan'}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                        } else {
                            const imgData = canvas.toDataURL('image/png');
                            const pdf = new jsPDF({
                                orientation: 'landscape',
                                unit: 'px',
                                format: [canvas.width, canvas.height] 
                            });
                            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                            pdf.save(`${projectInfo.projectName || 'apd-plan'}.pdf`);
                        }
                    }
                    setExportImageSrc(null);
                    setIsExporting(false);
                    setExportFormat(null);
                    
                    stage.width(oldSize.width);
                    stage.height(oldSize.height);
                    stage.scale(oldScale);
                    stage.position(oldPos);
                    stage.batchDraw();

                }, 800); 

            } catch (error) {
                console.error("Export failed:", error);
                alert("Ett fel uppstod vid exporten.");
                setIsExporting(false);
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
        a.download = `${projectInfo.projectName || 'projekt'}.apd`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportMenuOpen(false);
    };

    const handleClearProject = () => {
        if (window.confirm("VARNING: Detta tar bort hela din ritning och alla objekt.\n\nÄr du säker på att du vill rensa allt?")) {
            clearProject();
        }
    };

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between z-10 relative shadow-md h-[72px]">
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
                    width: '1200px',
                    zIndex: -1
                }} 
            >
                <div ref={exportTemplateRef} className="bg-white text-slate-900 p-8 flex flex-col items-stretch min-h-[700px]">
                    <div className="border-b-4 border-slate-800 mb-4 pb-2 flex justify-between items-end">
                        <div className="flex flex-col">
                            <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none mb-1" style={{fontFamily: 'Arial Black, sans-serif'}}>APD-PLAN</h1>
                            {projectInfo.company && <h2 className="text-xl font-bold text-slate-600 uppercase tracking-wide">{projectInfo.company}</h2>}
                        </div>
                        <div className="text-right flex flex-col items-end">
                             {projectInfo.projectName && <span className="text-2xl font-bold text-slate-800">{projectInfo.projectName}</span>}
                             {projectInfo.projectId && <span className="text-lg font-medium text-slate-500">Nr: {projectInfo.projectId}</span>}
                             <span className="text-base font-medium text-slate-400 mt-1">{new Date().toLocaleDateString('sv-SE')}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4 flex-1">
                        <div className="flex-1 border-4 border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center relative min-h-[600px]">
                           {exportImageSrc && <img src={exportImageSrc} alt="Planritning" className="w-full h-auto object-contain" />}
                        </div>

                        <div className="w-[200px] flex-shrink-0 bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs">
                            <h2 className="text-base font-bold mb-3 border-b-2 border-slate-300 pb-1 uppercase tracking-wide">Förteckning</h2>
                            <div className="space-y-2">
                                {Object.entries(legendData).map(([category, items]) => (
                                    <div key={category}>
                                        <h3 className="font-bold text-slate-700 mb-1 uppercase text-[9px] tracking-wider border-b border-slate-300">{category}</h3>
                                        <div className="space-y-1">
                                            {(items as { type: string, name: string, count: number, icon: React.ReactElement }[]).map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white p-1 rounded shadow-sm border border-slate-200">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className="w-4 h-4 flex-shrink-0 text-slate-800 [&>svg]:stroke-slate-800 [&>svg]:fill-none">
                                                            {React.cloneElement(item.icon as React.ReactElement<any>, { 
                                                                className: "w-full h-full" 
                                                            })}
                                                        </div>
                                                        <span className="font-semibold text-slate-800 text-[10px] truncate leading-tight">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-center w-4 h-4 bg-slate-200 rounded-full flex-shrink-0">
                                                        <span className="font-bold text-slate-800 text-[10px]">{item.count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {objects.length === 0 && customLegendItems.length === 0 && (
                                    <p className="text-slate-500 italic text-[10px]">Inga objekt utplacerade än.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-300 text-center text-slate-400 text-xs font-medium flex justify-between">
                         <span>Skapad med ByggPilot APD-Maker</span>
                         <span>{new Date().toLocaleString('sv-SE')}</span>
                    </div>
                </div>
            </div>

            {isExporting && (
                <div className="absolute inset-0 bg-slate-900/95 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="construction-loader">
                         <div className="relative">
                            <svg className="helmet-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 38 C 8 20, 56 20, 56 38 L 56 42 L 8 42 Z" fill="#FFC107" stroke="#fff" strokeWidth="2"/>
                                <path d="M4 42 L 60 42 L 60 48 C 60 50, 4 50, 4 48 Z" fill="#FFC107" stroke="#fff" strokeWidth="2"/>
                                <rect x="28" y="18" width="8" height="12" fill="#FFE082"/>
                            </svg>
                            <svg className="hammer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.5 5.5L18.5 9.5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 8L16 12L7 21L3 17L12 8Z" fill="#a16207" stroke="#fff" strokeWidth="1"/>
                                <path d="M16 3L21 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M13 6L18 11" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                         </div>
                         <div className="loader-text-main">BYGGPILOT</div>
                         <div className="loader-text-sub">Export pågår</div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button onClick={toggleLibrary} className="md:hidden p-2 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" aria-label="Visa bibliotek">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-slate-100 mr-4">ByggPilot</h1>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                 {/* 3D TOGGLE BUTTON */}
                 <button 
                    onClick={() => setShow3D(!show3D)}
                    className={`button ${show3D ? 'purple' : 'purple'}`}
                >
                    <div className="wrap">
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                            <span>3D-vy</span>
                            <span>{show3D ? 'Stäng' : 'Starta'}</span>
                        </p>
                    </div>
                </button>

                <div className="hidden md:flex items-center gap-2">
                    {/* IMPORTERA */}
                    <button onClick={() => fileInputRef.current?.click()} className="button slate">
                        <div className="wrap">
                            <p>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                <span>Importera</span>
                                <span>Välj fil</span>
                            </p>
                        </div>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleCombinedImport} 
                        accept="image/*,application/pdf,.apd,application/json" 
                        className="hidden" 
                    />
                    
                    {/* EXPORTERA */}
                    <div className="relative export-menu-container">
                        <button 
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="button blue"
                        >
                            <div className="wrap">
                                <p>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span>Exportera</span>
                                    <span>Spara</span>
                                </p>
                            </div>
                        </button>
                        
                        {isExportMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in-down">
                                <button onClick={() => initiateExport('image')} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Spara som Bild
                                </button>
                                <button onClick={() => initiateExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    Spara som PDF
                                </button>
                                <div className="border-t border-slate-700 my-1"></div>
                                <button onClick={handleSaveProject} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                    Spara Projektfil
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RENSA */}
                    <button onClick={handleClearProject} className="button red">
                        <div className="wrap">
                            <p>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                <span>Rensa</span>
                                <span>Radera</span>
                            </p>
                        </div>
                    </button>
                </div>
                
                 {/* Mobil-meny knapp (3 punkter) */}
                 <div className="md:hidden relative group">
                     <button className="p-2 rounded-md hover:bg-slate-700 text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                     </button>
                     <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden hidden group-hover:block group-focus-within:block z-50">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">Importera</button>
                        <button onClick={() => initiateExport('image')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">Spara Bild</button>
                        <button onClick={() => initiateExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">Spara PDF</button>
                        <button onClick={handleSaveProject} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">Spara Projektfil</button>
                        <div className="border-t border-slate-600 my-1"></div>
                        <button onClick={handleClearProject} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 font-bold">Rensa Projekt</button>
                     </div>
                 </div>

                {!show3D && (
                    <button onClick={toggleLegend} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" aria-label="Visa/Dölj förteckning">
                        <span className="hidden md:inline text-sm font-medium">Förteckning</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
