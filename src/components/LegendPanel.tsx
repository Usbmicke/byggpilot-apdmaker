
import React, { useMemo, useState } from 'react';
import { APDObject, CustomLegendItem, ProjectInfo } from '../types';
import { LIBRARY_CATEGORIES } from '../utils/libraryItems';

const findIcon = (type: string) => {
    for (const category of LIBRARY_CATEGORIES) {
        const item = category.items.find(i => i.type === type);
        if (item) return item.icon;
    }
    return null;
};

interface LegendPanelProps {
    isOpen: boolean;
    projectInfo: ProjectInfo;
    setProjectInfo: React.Dispatch<React.SetStateAction<ProjectInfo>>;
    objects?: APDObject[]; // Make objects optional
    customItems: CustomLegendItem[];
    setCustomItems: React.Dispatch<React.SetStateAction<CustomLegendItem[]>>;
}

const LegendPanel: React.FC<LegendPanelProps> = ({ 
    isOpen,
    projectInfo, 
    setProjectInfo, 
    objects = [], // Default to empty array
    customItems, 
    setCustomItems 
}) => {
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [editedProjectInfo, setEditedProjectInfo] = useState(projectInfo);

    const legendData = useMemo(() => {
        const counts: { [key: string]: { count: number; icon: React.ReactNode | null; type: string } } = {};
        // objects is guaranteed to be an array here
        objects.forEach(obj => {
            const label = obj.item.name;
            if (counts[label]) {
                counts[label].count++;
            } else {
                counts[label] = { count: 1, icon: obj.item.icon, type: obj.item.type };
            }
        });
        return Object.entries(counts).map(([label, data]) => ({ label, ...data }));
    }, [objects]);

    const handleSaveProjectInfo = () => {
        setProjectInfo(editedProjectInfo);
        setIsEditingProject(false);
    };

    const handleCancelEdit = () => {
        setEditedProjectInfo(projectInfo);
        setIsEditingProject(false);
    };

    return (
        <aside 
            id="legend-panel" 
            className={`bg-slate-800 text-slate-300 transition-all duration-300 ease-in-out flex flex-col 
                ${isOpen ? 'w-80 md:w-96 border-l border-slate-700 p-4' : 'w-0 p-0 border-l-0'}
            `}
        >
            {isOpen && (
                <div className="overflow-y-auto h-full flex flex-col">
                    <h2 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4 text-slate-100 whitespace-nowrap">Projektinformation</h2>
                    
                    {isEditingProject ? (
                        <div className='flex-grow'>
                           {/* Edit fields */}
                           <button onClick={handleSaveProjectInfo}>Spara</button>
                           <button onClick={handleCancelEdit}>Avbryt</button>
                        </div>
                    ) : (
                        <div className='flex-grow'>
                            {/* Display fields */}
                            <button onClick={() => setIsEditingProject(true)}>Redigera</button>
                        </div>
                    )}

                    <div className="border-t border-slate-700 pt-4 mt-4">
                        <h3 className="text-lg font-semibold mb-3 text-slate-100 whitespace-nowrap">Förteckning</h3>
                        <div className="space-y-2">
                            {legendData.map(({ label, count, icon }) => (
                                <div key={label} className="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
                                    <div className="flex items-center min-w-0">
                                        <div className="w-6 h-6 mr-3 text-slate-400 flex-shrink-0">{icon}</div>
                                        <span className="text-sm font-medium text-slate-300 truncate" title={label}>{label}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-200 ml-2 whitespace-nowrap">{count} st</span>
                                </div>
                            ))}
                            {customItems.map(item => (
                                 <div key={item.id} className="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
                                     {/* ... custom item display ... */}
                                 </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default LegendPanel;
