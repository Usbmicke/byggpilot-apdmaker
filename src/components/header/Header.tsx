
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
        <header className="bg-[#18181b] border-b border-white/10 p-2 sm:p-3 flex items-center justify-between z-30 relative shadow-md h-[72px]">
            <div className="flex items-center gap-2 sm:gap-3">
                {/* FIX UX-1: Added text label for clarity */}
                <button onClick={toggleLibrary} disabled={!backgroundIsLoaded} className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2" title="Visa/Dölj Symbol-bibliotek">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>
                    <span className="hidden sm:inline font-semibold">Bibliotek</span>
                </button>
                <button onClick={onCalibrate} disabled={!backgroundIsLoaded} className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2" title="Kalibrera Skala">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <span className="hidden sm:inline font-semibold">Kalibrera</span>
                </button>

                <img src="/assets/ikoner/Byggpilotlogga.png" alt="ByggPilot Logotyp" className="h-9 sm:h-10" />
                <span className="text-lg sm:text-xl font-bold text-zinc-100 whitespace-nowrap hidden md:inline">ByggPilot APD</span>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button onClick={() => setShow3D(!show3D)} disabled={!backgroundIsLoaded} className="gradient-button disabled:opacity-40 disabled:cursor-not-allowed" title="Växla mellan 2D- och 3D-vy">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="gradient-text hidden sm:inline font-bold tracking-wide">{show3D ? '2D-Läge' : '3D-Läge'}</span>
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="sparkle-button sparkle-premium" title="Ladda upp en ritning (PDF, PNG, JPG)">
                    <svg className="w-5 h-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span className="text hidden md:inline ml-2 text-zinc-100">Importera</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept="image/*,application/pdf" className="hidden" />

                <div className="relative">
                    <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} disabled={!backgroundIsLoaded} className="sparkle-button sparkle-premium disabled:opacity-40 disabled:cursor-not-allowed">
                        <svg className="w-5 h-5 text-zinc-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span className="text hidden md:inline ml-2 text-zinc-200">Exportera</span>
                    </button>
                    {isExportMenuOpen && (
                        <div onMouseLeave={() => setIsExportMenuOpen(false)} className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 animate-fade-in-down">
                            <div className="px-4 py-2 border-b border-zinc-700">
                                <p className="text-sm font-bold text-white">Exportera {show3D ? "3D-vy" : "2D-vy"}</p>
                            </div>
                            <button onClick={() => handleExport('jpeg')} className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-3">Spara som JPEG</button>
                            <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-3">Spara som PDF (A3)</button>
                        </div>
                    )}
                </div>
                <button onClick={() => setIsClearModalOpen(true)} disabled={!backgroundIsLoaded} className="sparkle-button sparkle-premium disabled:opacity-40 disabled:cursor-not-allowed">
                    <svg className="w-5 h-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    <span className="text hidden md:inline ml-2 text-red-100 group-hover:text-white">Rensa Allt</span>
                </button>

                {/* FIX UX-1: Added text label for clarity */}
                {/* FIX UX-1: Added text label for clarity */}
                <button onClick={toggleLegend} disabled={!backgroundIsLoaded} className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed hidden sm:flex items-center gap-2" title="Visa/Dölj Projektinformation och Förteckning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    <span className="hidden sm:inline font-semibold">Info & Lista</span>
                </button>
                <a href="mailto:byggpilot@gmail.com?subject=Synpunkter%20ByggPilot%20APD-Maker&body=Hej!%0D%0A%0D%0AJag%20har%20följande%20synpunkter%20eller%20frågor:%0D%0A" className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-2" title="Rapportera fel eller ge feedback">
                    <svg className="w-6 h-6 flex-shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="hidden xl:inline font-semibold">Feedback</span>
                </a>
            </div>

            <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Rensa Hela Projektet">
                <p className="text-zinc-300 mb-6">Är du helt säker på att du vill rensa hela projektet? Alla symboler och all information kommer att raderas permanent. Denna åtgärd kan inte ångras.</p>
                <div className="flex justify-end gap-4">
                    <button onClick={() => setIsClearModalOpen(false)} className="px-6 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-semibold transition-colors">Avbryt</button>
                    <button onClick={confirmClearProject} className="px-6 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold transition-colors shadow-red-glow">Ja, Rensa Allt</button>
                </div>
            </Modal>
        </header>
    );
};

export default React.memo(Header);
