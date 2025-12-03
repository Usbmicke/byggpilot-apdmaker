
import React from 'react';

interface ThreeDControlsProps {
    isBuildMode: boolean;
    setIsBuildMode: (isBuildMode: boolean) => void;
    resetCamera: () => void;
}

const ThreeDControls: React.FC<ThreeDControlsProps> = ({ isBuildMode, setIsBuildMode, resetCamera }) => {
    return (
        <div className="absolute top-[80px] left-4 bg-slate-800 bg-opacity-80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-700 z-20">
            <h3 className="text-white font-bold text-lg mb-3 border-b border-slate-600 pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                3D Kontroll
            </h3>
            
            <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300 text-sm font-medium">Byggläge</span>
                    <div 
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${isBuildMode ? 'bg-purple-600' : 'bg-slate-600'}`}
                        onClick={() => setIsBuildMode(!isBuildMode)}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isBuildMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                </label>
                
                <p className="text-xs text-slate-400 italic mt-1">
                    {isBuildMode 
                        ? 'Kameran är låst. Placera & redigera objekt.' 
                        : 'Rotera fritt och inspektera din APD-plan.'}
                </p>

                <div className="border-t border-slate-700 my-2"></div>

                <button 
                    onClick={resetCamera}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-3 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Återställ Kamera
                </button>
            </div>
        </div>
    );
};

export default ThreeDControls;
