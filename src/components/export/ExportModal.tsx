
import React from 'react';
import { ProjectInfo } from '../../types';

interface ExportModalProps {
    show: boolean;
    onClose: () => void;
    onExport: () => void;
    projectInfo: ProjectInfo;
    setProjectInfo: (info: ProjectInfo) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ show, onClose, onExport, projectInfo, setProjectInfo }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-700 overflow-hidden">
                <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Projektinformation</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Företagsnamn</label>
                        <input
                            type="text"
                            value={projectInfo.company}
                            onChange={(e) => setProjectInfo({ ...projectInfo, company: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                            placeholder="T.ex. Byggbolaget AB"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Projektnamn</label>
                        <input
                            type="text"
                            value={projectInfo.projectName}
                            onChange={(e) => setProjectInfo({ ...projectInfo, projectName: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                            placeholder="T.ex. Kvarteret Eken"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Projektnummer</label>
                        <input
                            type="text"
                            value={projectInfo.projectId}
                            onChange={(e) => setProjectInfo({ ...projectInfo, projectId: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                            placeholder="T.ex. 2024-001"
                        />
                    </div>
                </div>
                <div className="bg-zinc-800 p-4 flex justify-end gap-3 border-t border-zinc-700">
                    <button onClick={onClose} className="px-4 py-2 text-zinc-300 hover:text-white font-medium transition-colors">Avbryt</button>
                    <button onClick={onExport} className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-zinc-900/20 transition-all transform active:scale-95">Exportera</button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
