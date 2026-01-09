
import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../shared/Modal';
import '../../styles/ThreeDButton.css';
import '../../styles/SparkleButton.css';

interface HeaderProps {
    handleFile: (file: File) => void;
    clearProject: () => void;
    toggleLibrary: () => void;
    toggleLegend: () => void;
    show3D: boolean;
    setShow3D: (show: boolean) => void;
    onExport2D: (format: 'jpeg' | 'pdf') => void;
    onExport3D: (format: 'jpeg' | 'pdf') => void;
    onCalibrate: () => void;
    backgroundIsLoaded: boolean;
}

const Header: React.FC<HeaderProps> = ({
    handleFile, clearProject, toggleLibrary, toggleLegend,
    show3D, setShow3D, onExport2D, onExport3D, onCalibrate, backgroundIsLoaded
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
        event.target.value = '';
    };

    const handleExport = (format: 'jpeg' | 'pdf') => {
        if (!backgroundIsLoaded) {
            toast.error("Ladda en ritning innan du exporterar.");
            return;
        }

        if (show3D) {
            onExport3D(format);
        } else {
            onExport2D(format);
        }
        setIsExportMenuOpen(false);
    };

    const confirmClearProject = () => {
        clearProject();
        setIsClearModalOpen(false);
    };

    return (
        <header className="glass-panel border-b border-white/5 p-2 sm:p-3 flex items-center justify-between z-30 relative shadow-lg h-[72px] m-4 rounded-2xl mx-6 absolute top-0 left-0 right-0"> 
            <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={toggleLibrary} disabled={!backgroundIsLoaded} className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2" title="Visa/Dölj Symbol-bibliotek">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>
                    <span className="hidden sm:inline font-semibold text-sm">Bibliotek</span>
                </button>
                <button onClick={onCalibrate} disabled={!backgroundIsLoaded} className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2" title="Kalibrera Skala">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <span className="hidden sm:inline font-semibold text-sm">Kalibrera</span>
                </button>

                <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                <img src="/assets/ikoner/Byggpilotlogga.png" alt="ByggPilot Logotyp" className="h-8 sm:h-9" />
                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-start to-brand-end hidden md:inline tracking-tight">ByggPilot APD</span>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
                <button onClick={() => setShow3D(!show3D)} disabled={!backgroundIsLoaded} className="btn-luxury disabled:opacity-50 disabled:cursor-not-allowed h-10 px-6 gap-2" title="Växla mellan 2D- och 3D-vy">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="hidden sm:inline font-bold tracking-wide">{show3D ? '2D-Läge' : '3D-Läge'}</span>
                </button>

                <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                <button onClick={() => fileInputRef.current?.click()} className="btn-ghost hover:bg-white/10 hover:text-white" title="Ladda upp en ritning (PDF, PNG, JPG)">
                    <svg className="w-5 h-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span className="text hidden md:inline ml-2 font-medium">Importera</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept="image/*,application/pdf" className="hidden" />

                <div className="relative">
                    <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} disabled={!backgroundIsLoaded} className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 hover:text-white">
                        <svg className="w-5 h-5 text-brand-end" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span className="text hidden md:inline ml-2 font-medium">Exportera</span>
                    </button>
                    {isExportMenuOpen && (
                        <div onMouseLeave={() => setIsExportMenuOpen(false)} className="absolute right-0 top-full mt-4 w-56 glass-card rounded-xl shadow-glass z-50 animate-fade-in-down border-white/10 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Exportera {show3D ? "3D-vy" : "2D-vy"}</p>
                            </div>
                            <button onClick={() => handleExport('jpeg')} className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-brand-start/20 hover:text-white flex items-center gap-3 transition-colors">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Spara som JPEG
                            </button>
                            <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-brand-start/20 hover:text-white flex items-center gap-3 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Spara som PDF (A3)
                            </button>
                        </div>
                    )}
                </div>

                <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                <button onClick={() => setIsClearModalOpen(true)} disabled={!backgroundIsLoaded} className="btn-ghost hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-red-400/80">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <button onClick={toggleLegend} disabled={!backgroundIsLoaded} className="btn-ghost hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hidden sm:flex items-center gap-2" title="Visa/Dölj Projektinformation och Förteckning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
            </div>

            <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Rensa Hela Projektet">
                <p className="text-text-muted mb-6">Är du helt säker på att du vill rensa hela projektet? Alla symboler och all information kommer att raderas permanent.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsClearModalOpen(false)} className="px-6 py-2 rounded-full border border-white/10 text-white hover:bg-white/5 font-medium transition-colors">Avbryt</button>
                    <button onClick={confirmClearProject} className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-lg shadow-red-900/30">Ja, Rensa Allt</button>
                </div>
            </Modal>
        </header>
    );
};

export default React.memo(Header);
