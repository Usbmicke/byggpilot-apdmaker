import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APDObject, CustomLegendItem } from '../types/index';

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
}

const Header: React.FC<HeaderProps> = ({ stageRef, mainContainerRef, background, setBackground, objects, setObjects, customLegendItems, setCustomLegendItems, clearProject, toggleLibrary, toggleLegend }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const projectInputRef = useRef<HTMLInputElement>(null);

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
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                setBackground({ url: canvas.toDataURL(), width: canvas.width, height: canvas.height });
            };
            fileReader.readAsArrayBuffer(file);
        }
        event.target.value = ''; // Återställ input
    };

    const handleExportPdf = () => {
        if (!mainContainerRef.current) return;

        if (!background) {
            alert("Vänligen ladda upp en ritning innan du exporterar.");
            return;
        }

        const legendEl = mainContainerRef.current.querySelector('#legend-panel');
        if (!legendEl || !stageRef.current) {
            alert("Kunde inte hitta nödvändiga element för PDF-export.");
            return;
        }

        const stage = stageRef.current;
        
        // Directly capture the required area from the stage.
        // The x, y, width, and height are relative to the stage's coordinate system,
        // so this captures the entire drawing regardless of the current zoom/pan.
        const dataURL = stage.toDataURL({ 
            x: 0, 
            y: 0, 
            width: background.width, 
            height: background.height, 
            pixelRatio: 2 // Use a higher pixel ratio for better quality
        });
        
        html2canvas(legendEl as HTMLElement, { scale: 2, backgroundColor: '#111827' }).then(legendCanvas => {
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const stageRatio = background.width / background.height;
            const legendRatio = legendCanvas.width / legendCanvas.height;

            // Simple layout: canvas takes 70%, legend 30%
            const canvasPdfWidth = pdfWidth * 0.7;
            const canvasPdfHeight = canvasPdfWidth / stageRatio;
            
            const legendPdfWidth = pdfWidth * 0.28;
            const legendPdfHeight = legendPdfWidth / legendRatio;

            const yPos = (pdfHeight - Math.max(canvasPdfHeight, legendPdfHeight))/2;

            pdf.addImage(dataURL, 'PNG', 10, yPos, canvasPdfWidth, canvasPdfHeight);
            pdf.addImage(legendCanvas.toDataURL('image/png'), 'PNG', canvasPdfWidth + 20, yPos, legendPdfWidth, legendPdfHeight);
            
            pdf.save('apd-plan.pdf');
        });
    };

    const handleSaveProject = () => {
        const projectData = {
            objects,
            customLegendItems,
            // Bakgrund sparas inte för att hålla filstorleken liten. Användaren återimporterar.
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
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
                <button onClick={toggleLibrary} className="md:hidden p-2 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" aria-label="Visa bibliotek">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </button>
                <h1 className="text-2xl font-bold text-slate-100">ByggPilot APD-Maker</h1>
            </div>
            <div className="flex items-center space-x-2">
                {/* Desktop-knappar */}
                <div className="hidden md:flex items-center space-x-2">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-slate-600 hover:bg-slate-500 text-white font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Importera Ritning</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                    
                    <button onClick={handleExportPdf} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Exportera som PDF</button>

                    <button onClick={handleSaveProject} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Spara Projektfil</button>
                    
                    <button onClick={() => projectInputRef.current?.click()} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Ladda Projektfil</button>
                    <input type="file" ref={projectInputRef} onChange={handleLoadProject} accept=".apd" className="hidden" />

                    <button onClick={() => {if(window.confirm("Är du säker på att du vill rensa allt?")) clearProject()}} className="bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all">Rensa</button>
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