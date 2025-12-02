
import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { APDObject, CustomLegendItem, ProjectInfo } from '../types/index';
import '../src/styles/ThreeDButton.css';
import '../src/styles/SparkleButton.css';

interface HeaderProps {
    stageRef: React.RefObject<any>;
    mainContainerRef: React.RefObject<HTMLDivElement>;
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
    stageRef, mainContainerRef, background, handleFile, objects, 
    customLegendItems, projectInfo, setProjectInfo, clearProject, toggleLibrary, toggleLegend,
    show3D, setShow3D
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
        event.target.value = '';
    };

    const handleSaveProject = () => {
        const projectData = {
            version: '1.0',
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
        if (show3D) {
            toast.error('Kan för närvarande inte exportera bild från 3D-vyn.');
            return;
        }
        if (!stageRef.current) {
            toast.error('Kunde inte exportera bild. Scenen är inte redo.');
            return;
        }
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

    const handleToggle3D = () => {
        setShow3D(!show3D);
    };

    const handleClearProject = () => {
        toast((t) => (
            <div className='flex flex-col items-center gap-3'>
              <p className='font-bold'>VARNING: Detta raderar hela projektet.</p>
              <span>Är du säker?</span>
              <div className='flex gap-2'>
                <button 
                    onClick={() => { clearProject(); toast.dismiss(t.id); }} 
                    className='bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded'
                >
                  Ja, rensa
                </button>
                <button 
                    onClick={() => toast.dismiss(t.id)} 
                    className='bg-slate-500 hover:bg-slate-400 text-white font-bold py-2 px-4 rounded'
                >
                  Avbryt
                </button>
              </div>
            </div>
          ), { duration: 6000 });
    };

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between z-20 relative shadow-md h-[72px]">
             <div className="flex items-center gap-3">
                 <button onClick={toggleLibrary} className="md:hidden p-2 rounded-md hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                 <img src="/assets/ikoner/Byggpilotlogga.png" alt="ByggPilot Logotyp" className="h-10" />
                 <span className="text-lg font-bold text-slate-100 whitespace-nowrap hidden md:inline">ByggPilot APD Maker</span>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2"></div>

            <div className="flex items-center justify-end gap-3">
                 <button onClick={handleToggle3D} className="gradient-button">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <span className="gradient-text">{show3D ? '2D-vy' : 'BYGG I 3D'}</span>
                </button>

                <div className="hidden md:flex items-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="sparkle-button sparkle-green">
                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text">Importera</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept=".apd,application/json,image/*,application/pdf" className="hidden" />
                    
                    <div className="relative">
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="sparkle-button sparkle-blue">
                           <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           <span className="text">Exportera</span>
                        </button>
                        {isExportMenuOpen && (
                            <div onMouseLeave={() => setIsExportMenuOpen(false)} className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 animate-fade-in-down">
                                <button onClick={handleSaveImage} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Spara som Bild (.png)</button>
                                <button disabled className="w-full text-left px-4 py-3 text-sm text-slate-500 cursor-not-allowed flex items-center gap-3">Spara som PDF (Snart)</button>
                                <div className="border-t border-slate-700 my-1"></div>
                                <button onClick={handleSaveProject} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Spara Projektfil (.apd)</button>
                            </div>
                        )}
                    </div>
                    <button onClick={handleClearProject} className="sparkle-button sparkle-red">
                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span className="text">Rensa</span>
                    </button>
                </div>
                 <div className="md:hidden relative group"> 
                    <button className="p-2 rounded-md hover:bg-slate-700"> 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 hidden group-hover:block animate-fade-in-down">
                         <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Importera</button>
                         <button onClick={() => setIsExportMenuOpen(true)} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3">Exportera</button>
                         <button onClick={handleClearProject} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-3">Rensa Projekt</button>
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
