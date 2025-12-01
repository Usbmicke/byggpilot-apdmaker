
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
            <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-600 overflow-hidden">
                <div className="bg-slate-700 p-4 border-b border-slate-600 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Projektinformation</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Företagsnamn</label>
                        <input
                            type="text"
                            value={projectInfo.company}
                            onChange={(e) => setProjectInfo({ ...projectInfo, company: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="T.ex. Byggbolaget AB"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Projektnamn</label>
                        <input
                            type="text"
                            value={projectInfo.projectName}
                            onChange={(e) => setProjectInfo({ ...projectInfo, projectName: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="T.ex. Kvarteret Eken"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Projektnummer</label>
                        <input
                            type="text"
                            value={projectInfo.projectId}
                            onChange={(e) => setProjectInfo({ ...projectInfo, projectId: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="T.ex. 2024-001"
                        />
                    </div>
                </div>
                <div className="bg-slate-700 p-4 flex justify-end gap-3 border-t border-slate-600">
                    <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors">Avbryt</button>
                    <button onClick={onExport} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-all transform active:scale-95">Exportera</button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
