
import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { APDObject, CustomLegendItem, ProjectInfo } from '../types/index';
import '..//src/styles/ThreeDButton.css';
import '..//src/styles/SparkleButton.css';

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
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    stageRef, mainContainerRef, background, handleFile, objects, 
    customLegendItems, projectInfo, setProjectInfo, clearProject, toggleLibrary, toggleLegend,
    show3D, setShow3D, canUndo, redo, undo
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
        event.target.value = '';
    };

    // *** NYTT: Funktion för att spara projektfil ***
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

    // *** NYTT: Funktion för att spara som bild ***
    const handleSaveImage = () => {
        if (!stageRef.current) {
            toast.error('Kunde inte exportera bild. Scenen är inte redo.');
            return;
        }
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 }); // Högre upplösning
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

    const handleToggle3D = () => { /* ... oförändrad ... */ };
    const handleClearProject = () => { /* ... oförändrad ... */ };

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between z-20 relative shadow-md h-[72px]">
            <div className="flex items-center gap-3">
                <img src="/assets/ikoner/Byggpilotlogga.png" alt="ByggPilot Logotyp" className="h-10" />
                <span className="text-lg font-bold text-slate-100 whitespace-nowrap hidden md:inline">ByggPilot APD Maker</span>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2">
                {/* Undo/Redo knappar */}
                <button onClick={undo} disabled={!canUndo} className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg></button>
                <button onClick={redo} disabled={!canRedo} className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" transform="scale(-1, 1)"><path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg></button>
            </div>

            <div className="flex items-center justify-end gap-3">
                 <button onClick={handleToggle3D} className="gradient-button">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <span className="gradient-text">{show3D ? '2D-vy' : 'BYGG I 3D'}</span>
                </button>

                <div className="hidden md:flex items-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="sparkle-button sparkle-green">
                        <span className="text">Importera</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept=".apd,application/json,image/*,application/pdf" className="hidden" />
                    
                    <div className="relative">
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="sparkle-button sparkle-blue">
                           <span className="text">Exportera</span>
                        </button>
                        {isExportMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
                                <button onClick={handleSaveImage} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700">Spara som Bild (.png)</button>
                                <button disabled className="w-full text-left px-4 py-3 text-sm text-slate-500 cursor-not-allowed">Spara som PDF (Kommer snart)</button>
                                <div className="border-t border-slate-700 my-1"></div>
                                <button onClick={handleSaveProject} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700">Spara Projektfil (.apd)</button>
                            </div>
                        )}
                    </div>
                    <button onClick={handleClearProject} className="sparkle-button sparkle-red">
                        <span className="text">Rensa</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
