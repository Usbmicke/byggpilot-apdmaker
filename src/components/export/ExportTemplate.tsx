
import React from 'react';
import { ProjectInfo } from '../../types';

interface LegendData {
    [category: string]: { 
        type: string; 
        name: string; 
        count: number; 
        icon: React.ReactElement; 
    }[];
}

interface ExportTemplateProps {
    projectInfo: ProjectInfo;
    exportImageSrc: string | null;
    legendData: LegendData;
}

const ExportTemplate = React.forwardRef<HTMLDivElement, ExportTemplateProps>(({ projectInfo, exportImageSrc, legendData }, ref) => {
    return (
        <div style={{ position: 'fixed', left: '-2000px', top: '-2000px', width: '1400px', zIndex: -1 }}>
            <div ref={ref} className="bg-white text-slate-900 p-8 flex flex-col items-stretch" style={{ width: 1400, height: 900 }}>
                <div className="border-b-4 border-slate-900 mb-6 pb-4 flex justify-between items-end">
                    <div className="flex flex-col">
                        <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-900 leading-none">APD-PLAN</h1>
                        {projectInfo.company && <h2 className="text-2xl font-bold text-slate-600 uppercase tracking-wide mt-1">{projectInfo.company}</h2>}
                    </div>
                    <div className="text-right flex flex-col items-end">
                        {projectInfo.projectName && <span className="text-3xl font-bold text-slate-800">{projectInfo.projectName}</span>}
                        {projectInfo.projectId && <span className="text-xl font-medium text-slate-500 mt-1">Projekt-Nr: {projectInfo.projectId}</span>}
                        <span className="text-lg font-medium text-slate-400 mt-2">{new Date().toLocaleDateString('sv-SE')}</span>
                    </div>
                </div>

                <div className="flex-1 flex items-start gap-6" style={{ height: 'calc(100% - 130px)' }}>
                    <div className="flex-1 h-full border-4 border-slate-300 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center relative">
                        {exportImageSrc && <img src={exportImageSrc} alt="Planritning" className="max-w-full max-h-full object-contain" />}
                    </div>

                    <div className="w-[280px] flex-shrink-0 h-full flex flex-col bg-slate-100 p-4 rounded-lg border border-slate-300 text-sm">
                        <h2 className="text-xl font-bold mb-3 border-b-2 border-slate-400 pb-2 uppercase tracking-wide">Förteckning</h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {Object.keys(legendData).length > 0 ? Object.entries(legendData).map(([category, items]) => (
                                <div key={category}>
                                    <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider border-b border-slate-300 pb-1">{category}</h3>
                                    <div className="space-y-2">
                                        {(items as { type: string, name: string, count: number, icon: React.ReactElement }[]).map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border border-slate-200">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-6 h-6 flex-shrink-0 text-slate-800 flex items-center justify-center">
                                                        {React.cloneElement(item.icon, { className: "w-full h-full" })}
                                                    </div>
                                                    <span className="font-semibold text-slate-800 text-xs truncate leading-tight">{item.name}</span>
                                                </div>
                                                <div className="flex items-center justify-center w-6 h-6 bg-slate-200 rounded-full flex-shrink-0">
                                                    <span className="font-bold text-slate-800 text-xs">{item.count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-slate-500 italic text-sm mt-4">Inga objekt utplacerade.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t-2 border-slate-200 text-center text-slate-500 text-sm font-medium flex justify-between">
                    <span>Skapad med ByggPilot APD-Maker</span>
                    <span>{new Date().toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
            </div>
        </div>
    );
});

export default ExportTemplate;
