
import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APDObject, CustomLegendItem, ProjectInfo, isSymbol } from '../../types/index';
import Modal from '../shared/Modal';
import '../../styles/ThreeDButton.css';
import '../../styles/SparkleButton.css';

// Helper to render the legend to a hidden div for capturing
const renderLegendToHtml = (projectInfo: ProjectInfo, objects: APDObject[], customItems: CustomLegendItem[]): string => {
    const aggregatedSymbols = objects.reduce((acc, obj) => {
        if (isSymbol(obj.type)) {
            const key = obj.item.id || obj.type;
            if (!acc[key]) {
                acc[key] = { ...obj, quantity: 0 };
            }
            acc[key].quantity += obj.quantity;
        }
        return acc;
    }, {} as { [key: string]: APDObject });

    const symbolHtml = Object.values(aggregatedSymbols).map(obj => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center;">
                ${obj.item.iconUrl ? `<img src="${obj.item.iconUrl}" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;" />` : ''}
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; font-weight: 500;">${obj.item.name || 'Okänt objekt'}</span>
            </div>
            <span style="font-weight: bold; color: #444;">${obj.quantity} st</span>
        </div>
    `).join('');

    const customHtml = customItems.map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center;">
                <div style="width: 14px; height: 14px; border-radius: 4px; background-color: ${item.color}; margin-right: 8px;"></div>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; font-weight: 500;">${item.name || 'Anpassad'}</span>
            </div>
            <span style="font-weight: bold; color: #444;">-</span>
        </div>
    `).join('');

    return `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #fff; padding: 20px; box-sizing: border-box;">
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Projektinformation</h2>
          <div style="font-size: 12px; margin-bottom: 20px; line-height: 1.6;">
              <div style="display: flex; justify-content: space-between;"><strong style="color: #475569;">Företag:</strong> <span>${projectInfo.company || '-'}</span></div>
              <div style="display: flex; justify-content: space-between;"><strong style="color: #475569;">Projekt:</strong> <span>${projectInfo.projectName || '-'}</span></div>
              <div style="display: flex; justify-content: space-between;"><strong style="color: #475569;">ID:</strong> <span>${projectInfo.projectId || '-'}</span></div>
              <div style="display: flex; justify-content: space-between;"><strong style="color: #475569;">Datum:</strong> <span>${new Date().toLocaleDateString('sv-SE')}</span></div>
          </div>
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Teckenförklaring</h2>
          <div style="font-size: 11px;">
            ${symbolHtml}
            ${customHtml}
          </div>
      </div>
    `;
};


interface HeaderProps {
    stageRef: React.RefObject<any>;
    background: { url: string; width: number; height: number; } | null;
    handleFile: (file: File) => void;
    objects: APDObject[];
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
    stageRef, background, handleFile, objects,
    customLegendItems, projectInfo, clearProject, toggleLibrary, toggleLegend,
    show3D, setShow3D
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
        event.target.value = '';
    };

    const handleSaveProject = () => {
        if (!background) {
            toast.error("Det finns ingen ritning att spara.");
            return;
        }
        const projectData = {
            version: '1.2',
            projectInfo,
            background,
            objects,
            customLegendItems,
        };

        const dataStr = JSON.stringify(projectData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = projectInfo.projectName ? `${projectInfo.projectName.replace(/ /g, '_')}.apd` : 'projekt.apd';
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExportMenuOpen(false);
        toast.success('Projektfilen har sparats!');
    };

    const handleSaveImage = () => {
        if (show3D || !stageRef.current) return toast.error('Fel vid bildexport.');
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        const fileName = projectInfo.projectName ? `${projectInfo.projectName.replace(/ /g, '_')}.png` : 'apd-plan.png';
        link.download = fileName;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportMenuOpen(false);
        toast.success('Bilden har sparats!');
    };

    const handlePrint = async () => {
        if (show3D || !stageRef.current || !background) {
            toast.error('Kan inte skriva ut. Se till att du är i 2D-vyn och har en ritning laddad.');
            return;
        }
        const toastId = toast.loading('Förbereder utskrift...');

        try {
            const stage = stageRef.current;
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.width = '300px'; // Increased width for better legibility
            document.body.appendChild(container);

            container.innerHTML = renderLegendToHtml(projectInfo, objects, customLegendItems);

            const [canvasImage, legendImage] = await Promise.all([
                stage.toDataURL({ pixelRatio: 3 }),
                html2canvas(container, { scale: 2, backgroundColor: null })
            ]);

            document.body.removeChild(container);

            toast.loading('Skapar PDF...', { id: toastId });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a3'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;

            const legendCanvas = legendImage;
            const legendWidth = 70; // Slightly wider legend on PDF
            const legendHeight = (legendCanvas.height * legendWidth) / legendCanvas.width;

            const drawingAreaWidth = pdfWidth - legendWidth - margin * 2.5; // More space between canvas and legend
            const canvasAspectRatio = background.width / background.height;
            let canvasWidth = drawingAreaWidth;
            let canvasHeight = canvasWidth / canvasAspectRatio;

            if (canvasHeight > pdfHeight - margin * 2.5) { // Account for top margin (title)
                canvasHeight = pdfHeight - margin * 2.5;
                canvasWidth = canvasHeight * canvasAspectRatio;
            }

            // --- Modern Title ---
            pdf.setFontSize(28);
            pdf.setTextColor(30, 41, 59); // Slate-800
            pdf.setFont('Helvetica', 'bold');
            pdf.text('APD-PLAN', margin, margin + 8);

            // Subtitle / Project Name next to title? Or just cleaner look.
            // Let's add a colored line under the title
            pdf.setDrawColor(59, 130, 246); // Blue-500
            pdf.setLineWidth(1);
            pdf.line(margin, margin + 12, margin + 100, margin + 12);

            pdf.addImage(canvasImage, 'PNG', margin, margin + 20, canvasWidth, canvasHeight);

            const legendX = pdfWidth - legendWidth - margin;
            pdf.addImage(legendImage, 'PNG', legendX, margin + 20, legendWidth, legendHeight);

            const fileName = projectInfo.projectName ? `${projectInfo.projectName.replace(/ /g, '_')}_APD.pdf` : 'apd-plan.pdf';
            pdf.save(fileName);

            toast.success('PDF skapad!', { id: toastId });

        } catch (error) {
            console.error('Error printing PDF:', error);
            toast.error('Kunde inte skapa PDF.', { id: toastId });
        } finally {
            setIsExportMenuOpen(false);
        }
    };

    const confirmClearProject = () => {
        clearProject();
        setIsClearModalOpen(false);
    };

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between z-30 relative shadow-md h-[72px]">
            <div className="flex items-center gap-3">
                <button onClick={toggleLibrary} disabled={!background} className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed" title="Visa/Dölj Symbol-bibliotek">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>
                </button>
                <img src="/assets/ikoner/Byggpilotlogga.png" alt="ByggPilot Logotyp" className="h-10" />
                <span className="text-xl font-bold text-slate-100 whitespace-nowrap hidden md:inline">ByggPilot APD</span>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShow3D(!show3D)} disabled={!background} className="gradient-button disabled:opacity-40 disabled:cursor-not-allowed" title="Växla mellan 2D- och 3D-vy">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <span className="gradient-text">{show3D ? 'Visa 2D' : 'Visa 3D'}</span>
                </button>

                <div className="hidden md:flex items-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="sparkle-button sparkle-green" title="Ladda upp en ritning (PDF, PNG, JPG) eller en .apd-projektfil">
                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text">Importera</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept=".apd,application/json,image/*,application/pdf" className="hidden" />

                    <div className="relative">
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} disabled={!background} className="sparkle-button sparkle-blue disabled:opacity-40 disabled:cursor-not-allowed">
                            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span className="text">Exportera</span>
                        </button>
                        {isExportMenuOpen && (
                            <div onMouseLeave={() => setIsExportMenuOpen(false)} className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 animate-fade-in-down">
                                <button onClick={handleSaveImage} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Spara som Bild (.png)</button>
                                <button onClick={handlePrint} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Spara som PDF (A3)</button>
                                <div className="border-t border-slate-700 my-1"></div>
                                <button onClick={handleSaveProject} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Spara Projektfil (.apd)</button>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsClearModalOpen(true)} disabled={!background} className="sparkle-button sparkle-red disabled:opacity-40 disabled:cursor-not-allowed">
                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span className="text">Rensa Allt</span>
                    </button>
                </div>

                <div className="md:hidden relative group">
                    <button className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed" disabled={!background} title="Fler åtgärder">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 hidden group-hover:block animate-fade-in-down">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Importera Ny Ritning</button>
                        <button onClick={() => setIsExportMenuOpen(true)} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Exportera...</button>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button onClick={() => setIsClearModalOpen(true)} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-3">Rensa Hela Projektet</button>
                    </div>
                </div>

                <button onClick={toggleLegend} disabled={!background} className="p-2 rounded-md hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed md:flex" title="Visa/Dölj Projektinformation och Förteckning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
            </div>

            <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Rensa Hela Projektet">
                <p className="text-slate-300 mb-6">Är du helt säker på att du vill rensa hela projektet? Alla symboler och all information kommer att raderas permanent. Denna åtgärd kan inte ångras.</p>
                <div className="flex justify-end gap-4">
                    <button onClick={() => setIsClearModalOpen(false)} className="px-6 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-semibold transition-colors">Avbryt</button>
                    <button onClick={confirmClearProject} className="px-6 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold transition-colors shadow-red-glow">Ja, Rensa Allt</button>
                </div>
            </Modal>
        </header>
    );
};

export default React.memo(Header);
