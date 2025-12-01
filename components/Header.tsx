
import React, { useRef, useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APDObject, CustomLegendItem, ProjectInfo } from '../types/index';
import { LIBRARY_CATEGORIES } from '../constants/libraryItems';
import ExportModal from './export/ExportModal';
import ExportTemplate from './export/ExportTemplate';
import ExportingLoader from './export/ExportingLoader';

interface HeaderProps {
    stageRef: React.RefObject<any>;
    mainContainerRef: React.RefObject<HTMLDivElement>;
    background: { url: string, width: number, height: number } | null;
    setBackground: (bg: { url: string, width: number, height: number } | null) => void;
    objects: APDObject[];
    loadProjectData: (data: any) => void;
    customLegendItems: CustomLegendItem[];
    projectInfo: ProjectInfo;
    setProjectInfo: (info: ProjectInfo) => void;
    clearProject: () => void;
    toggleLibrary: () => void;
    toggleLegend: () => void;
    show3D: boolean;
    setShow3D: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    stageRef, mainContainerRef, background, setBackground, objects, loadProjectData, 
    customLegendItems, projectInfo, setProjectInfo, clearProject, toggleLibrary, toggleLegend,
    show3D, setShow3D
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportTemplateRef = useRef<HTMLDivElement>(null);
    
    const [isExporting, setIsExporting] = useState(false);
    const [exportImageSrc, setExportImageSrc] = useState<string | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<'image' | 'pdf' | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isExportMenuOpen && !(event.target as Element).closest('.export-menu-container')) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExportMenuOpen]);

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

        return grouped;
    }, [objects]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.name.endsWith('.apd') || file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = e.target?.result;
                    if (typeof result === 'string') {
                        const projectData = JSON.parse(result);
                        loadProjectData(projectData);
                        alert("Projekt inläst!");
                    }
                } catch (error) {
                    console.error("Error loading project file:", error);
                    alert("Kunde inte läsa projektfilen.");
                }
            };
            reader.readAsText(file);
        } 
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
                    const pdfJSLib = (window as any).pdfjsLib;
                    if (!pdfJSLib) {
                        alert("PDF-biblioteket kunde inte laddas. Prova att ladda om sidan.");
                        return;
                    }
                    const pdf = await pdfJSLib.getDocument(typedarray).promise;
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
        event.target.value = '';
    };

    const initiateExport = (format: 'image' | 'pdf') => {
        if ((!stageRef.current && !show3D) || !background) {
            alert("Det finns ingen ritning eller bakgrund att exportera.");
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
            let drawingDataURL: string | null = null;
            
            if (show3D) {
                const canvas3d = mainContainerRef.current?.querySelector('canvas');
                if (canvas3d) {
                    drawingDataURL = canvas3d.toDataURL('image/png', 1.0);
                }
            } else {
                const stage = stageRef.current;
                if (stage) {
                    const oldScale = stage.scale();
                    const oldPos = stage.position();
                    const oldSize = { width: stage.width(), height: stage.height() };

                    stage.width(background?.width || 800);
                    stage.height(background?.height || 600);
                    stage.scale({ x: 1, y: 1 });
                    stage.position({ x: 0, y: 0 });
                    stage.batchDraw();

                    drawingDataURL = stage.toDataURL({ pixelRatio: 2 });

                    stage.width(oldSize.width);
                    stage.height(oldSize.height);
                    stage.scale(oldScale);
                    stage.position(oldPos);
                    stage.batchDraw();
                }
            }

            if (!drawingDataURL) {
                alert("Kunde inte generera bild från ritningen.");
                setIsExporting(false);
                return;
            }
            
            setExportImageSrc(drawingDataURL);

            setTimeout(async () => {
                if (exportTemplateRef.current) {
                    try {
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
                    } catch (error) {
                        console.error("Export failed:", error);
                        alert("Ett fel uppstod vid exporten.");
                    } finally {
                        setExportImageSrc(null);
                        setIsExporting(false);
                        setExportFormat(null);
                    }
                }
            }, 1000);
        }, 100);
    };

    const handleSaveProject = () => {
        const projectData = {
            objects,
            customLegendItems,
            projectInfo,
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
        if (window.confirm("VARNING: Detta raderar hela projektet.\nÄr du säker?")) {
            clearProject();
        }
    };

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between z-10 relative shadow-md h-[72px]">
            <ExportModal 
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={generateCompositeExport}
                projectInfo={projectInfo}
                setProjectInfo={setProjectInfo}
            />
            <ExportTemplate 
                ref={exportTemplateRef}
                projectInfo={projectInfo}
                exportImageSrc={exportImageSrc}
                legendData={legendData}
            />
            {isExporting && <ExportingLoader />}

            <div className="flex items-center gap-3">
                 <button onClick={toggleLibrary} className="md:hidden p-2 rounded-md hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                 <img src="/assets/ikoner/Byggpilotlogga.png" alt="ByggPilot Logotyp" className="h-10" />
                 <span className="text-lg font-bold text-slate-100 whitespace-nowrap hidden md:inline">ByggPilot APD Maker</span>
            </div>

            <div className="flex-1 flex items-center justify-end gap-2 overflow-x-auto no-scrollbar">
                 <button onClick={() => setShow3D(!show3D)} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${show3D ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{show3D ? '2D-vy' : '3D-vy'}</span>
                </button>

                <div className="hidden md:flex items-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span>Importera</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf,.apd,application/json" className="hidden" />
                    
                    <div className="relative export-menu-container">
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors hover:bg-blue-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           <span>Exportera</span>
                        </button>
                        {isExportMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 animate-fade-in-down">
                                <button onClick={() => initiateExport('image')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Spara som Bild (.png)</button>
                                <button onClick={() => initiateExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>Spara som PDF</button>
                                <div className="border-t border-slate-700 my-1"></div>
                                <button onClick={handleSaveProject} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Spara Projektfil (.apd)</button>
                            </div>
                        )}
                    </div>
                    <button onClick={handleClearProject} className="px-4 py-2 text-sm font-semibold bg-red-800 text-white rounded-lg flex items-center gap-2 transition-colors hover:bg-red-700">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span>Rensa</span>
                    </button>
                </div>
                
                 <div className="md:hidden relative group">
                     <button className="p-2 rounded-md hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg></button>
                     <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden hidden group-hover:block group-focus-within:block z-50">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700">Importera</button>
                        <button onClick={() => initiateExport('image')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700">Spara Bild</button>
                        <button onClick={() => initiateExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700">Spara PDF</button>
                        <button onClick={handleSaveProject} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700">Spara Projektfil</button>
                        <div className="border-t border-slate-600 my-1"></div>
                        <button onClick={handleClearProject} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 font-bold">Rensa Projekt</button>
                     </div>
                 </div>
                {!show3D && (
                    <button onClick={toggleLegend} className="p-2 rounded-md hover:bg-slate-700 text-slate-300 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></button>
                )}
            </div>
        </header>
    );
};

export default Header;
