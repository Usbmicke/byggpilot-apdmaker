
import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { APDObject, CustomLegendItem, ProjectInfo } from '../../types/index';
import Modal from '../shared/Modal';
import { exportPlan } from '../../lib/exportUtils'; // <-- STEG 3.1: IMPORTERA DEN NYA FUNKTIONEN
import '../../styles/ThreeDButton.css';
import '../../styles/SparkleButton.css';

// Header-komponenten är nu ren och har inget ansvar för exportlogik.

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
    isLocked: boolean;
    setIsLocked: (locked: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
    stageRef, background, handleFile, objects,
    customLegendItems, projectInfo, setProjectInfo, clearProject, toggleLibrary, toggleLegend,
    show3D, setShow3D, isLocked, setIsLocked
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
        event.target.value = '';
    };

    // STEG 3.2: performExport är nu en simpel "wrapper" som anropar den externa funktionen.
    const performExport = async (format: 'jpeg' | 'pdf') => {
        if (show3D || !background) {
            toast.error('Export är endast tillgängligt i 2D-vyn med en laddad ritning.');
            return;
        }

        const toastId = toast.loading('Förbereder export...');

        const result = await exportPlan(format, {
            projectInfo,
            objects,
            customLegendItems,
            stageRef,
            background,
        });

        if (result.status === 'success') {
            toast.success('Exporten är klar!', { id: toastId });
        } else {
            toast.error(`Export misslyckades: ${result.message}`, { id: toastId, duration: 6000 });
        }
        
        setIsExportMenuOpen(false);
    };

    const confirmClearProject = () => {
        clearProject();
        setIsClearModalOpen(false);
    };

    // JSX är oförändrad.
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
                    <button onClick={() => fileInputRef.current?.click()} className="sparkle-button sparkle-green" title="Ladda upp en ritning (PDF, PNG, JPG)">
                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text">Importera</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept="image/*,application/pdf" className="hidden" />

                    <div className="relative">
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} disabled={!background} className="sparkle-button sparkle-blue disabled:opacity-40 disabled:cursor-not-allowed">
                            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span className="text">Exportera</span>
                        </button>
                        {isExportMenuOpen && (
                            <div onMouseLeave={() => setIsExportMenuOpen(false)} className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 animate-fade-in-down">
                                <button onClick={() => performExport('jpeg')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Spara som JPEG</button>
                                <button onClick={() => performExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Spara som PDF (A3)</button>
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
                        <div className="relative">
                            <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Exportera...</button>
                            {isExportMenuOpen && (
                                <div onMouseLeave={() => setIsExportMenuOpen(false)} className="absolute right-full top-0 mr-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
                                    <button onClick={() => performExport('jpeg')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700">Spara som JPEG</button>
                                    <button onClick={() => performExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700">Spara som PDF (A3)</button>
                                </div>
                            )}
                        </div>
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
