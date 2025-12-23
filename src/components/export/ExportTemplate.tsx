
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
            <div ref={ref} className="bg-white text-zinc-900 p-8 flex flex-col items-stretch" style={{ width: 1400, height: 900 }}>
                <div className="border-b-4 border-zinc-900 mb-6 pb-4 flex justify-between items-end">
                    <div className="flex flex-col">
                        <h1 className="text-5xl font-black tracking-tighter uppercase text-zinc-900 leading-none">APD-PLAN</h1>
                        {projectInfo.company && <h2 className="text-2xl font-bold text-zinc-600 uppercase tracking-wide mt-1">{projectInfo.company}</h2>}
                    </div>
                    <div className="text-right flex flex-col items-end">
                        {projectInfo.projectName && <span className="text-3xl font-bold text-zinc-800">{projectInfo.projectName}</span>}
                        {projectInfo.projectId && <span className="text-xl font-medium text-zinc-500 mt-1">Projekt-Nr: {projectInfo.projectId}</span>}
                        <span className="text-lg font-medium text-zinc-400 mt-2">{new Date().toLocaleDateString('sv-SE')}</span>
                    </div>
                </div>

                <div className="flex-1 flex items-start gap-6 overflow-hidden">
                    <div className="flex-1 h-full border-4 border-zinc-300 rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center relative">
                        {exportImageSrc && <img src={exportImageSrc} alt="Planritning" className="max-w-full max-h-full object-contain" />}
                    </div>

                    <div className="w-[280px] flex-shrink-0 h-full flex flex-col bg-zinc-100 p-4 rounded-lg border border-zinc-300 text-sm">
                        <h2 className="text-xl font-bold mb-3 border-b-2 border-zinc-400 pb-2 uppercase tracking-wide">Förteckning</h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {Object.keys(legendData).length > 0 ? Object.entries(legendData).map(([category, items]) => (
                                <div key={category}>
                                    {items.length > 0 && (
                                        <h3 className="font-bold text-zinc-800 mb-2 uppercase text-xs tracking-wider border-b border-zinc-300 pb-1">{category}</h3>
                                    )}
                                    <div className="space-y-1">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border border-zinc-200">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-6 h-6 flex-shrink-0 text-zinc-800 flex items-center justify-center">
                                                        {item.icon}
                                                    </div>
                                                    <span className="font-semibold text-zinc-800 text-xs truncate leading-tight">{item.name}</span>
                                                </div>
                                                <div className="flex items-center justify-center w-6 h-6 bg-zinc-200 rounded-full flex-shrink-0">
                                                    <span className="font-bold text-zinc-800 text-xs">{item.count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-zinc-500 italic text-sm mt-4">Inga objekt utplacerade.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t-2 border-zinc-200 text-center text-zinc-500 text-sm font-medium flex justify-between">
                    <span>Skapad med ByggPilot APD-Maker</span>
                    <span>{new Date().toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
            </div>
        </div>
    );
});

export default ExportTemplate;
