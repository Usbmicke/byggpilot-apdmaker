
import React, { useState, useMemo, ChangeEvent } from 'react';
import { APDObject, CustomLegendItem, ProjectInfo } from '../../types/index';
import { findIcon } from '../../utils/findIcon';

// --- Sub-components ---

const ProjectInfoForm = React.memo(({ projectInfo, onInfoChange }: { projectInfo: ProjectInfo, onInfoChange: (e: ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="space-y-3 mb-6">
        {Object.keys(projectInfo).map(key => (
            <div key={key}>
                <label htmlFor={key} className="text-sm font-medium text-slate-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                    type="text"
                    name={key}
                    id={key}
                    value={projectInfo[key as keyof ProjectInfo] || ''}
                    onChange={onInfoChange}
                    className="mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-full text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        ))}
    </div>
));

const ObjectRow = React.memo(({
    group,
    count,
    onRemove,
}: { 
    group: { name: string; type: string; ids: string[]; iconUrl?: string }, 
    count: number, 
    onRemove: (ids: string[]) => void, 
}) => {
    return (
        <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
            <div className="flex items-center min-w-0">
                <div className="w-6 h-6 mr-3 text-slate-400 flex-shrink-0">{findIcon(group.type, group.iconUrl)}</div>
                <span className="text-sm font-medium text-slate-300 truncate" title={group.name}>{group.name}</span>
            </div>
            <div className="flex items-center">
                <span className="w-12 p-1 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-center font-mono">{count}</span>
                <button
                    onClick={() => onRemove(group.ids)}
                    className="ml-2 p-1 text-red-500 hover:text-red-400 rounded-full hover:bg-slate-700"
                    aria-label={`Ta bort alla ${group.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    );
});


interface LegendPanelProps {
    isOpen: boolean;
    projectInfo: ProjectInfo;
    setProjectInfo: (info: ProjectInfo) => void;
    objects: APDObject[];
    onRemoveObject: (ids: string[]) => void;
    onUpdateObject: (groupId: string, newQuantity: number) => void; // This prop is no longer used but kept for interface compatibility if needed elsewhere
    customItems: CustomLegendItem[];
    setCustomItems: React.Dispatch<React.SetStateAction<CustomLegendItem[]>>;
}

// --- Main Component ---

const LegendPanel: React.FC<LegendPanelProps> = ({
    isOpen, projectInfo, setProjectInfo, objects, onRemoveObject
}) => {

    // FIX C-2: Replaced unstable aggregation logic with a simple, robust version.
    const aggregatedObjects = useMemo(() => {
        const objectGroups = new Map<string, { name: string, type: string, ids: string[], iconUrl?: string }>();

        objects.forEach(obj => {
            const key = obj.item?.id || obj.type;
            if (!key) return;

            let group = objectGroups.get(key);
            if (!group) {
                group = {
                    name: obj.item?.name || obj.type,
                    type: obj.type,
                    ids: [],
                    iconUrl: obj.item?.iconUrl
                };
                objectGroups.set(key, group);
            }
            group.ids.push(obj.id);
        });

        return Array.from(objectGroups.values());
    }, [objects]);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProjectInfo({ ...projectInfo, [e.target.name]: e.target.value || '' });
    }

    return (
        <aside
            id="legend-panel"
            className={`bg-slate-900 text-slate-300 transition-[width,transform] duration-300 ease-in-out h-full z-20 md:static md:h-auto md:shadow-none md:border-slate-700 overflow-hidden flex-shrink-0
                ${isOpen ? 'translate-x-0 w-80 md:w-80 md:border-l' : 'translate-x-full md:translate-x-0 md:w-0 md:border-l-0'}`}
        >
            <div className="w-80 h-full p-4 overflow-y-auto flex flex-col">
                <h2 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4 text-slate-100 whitespace-nowrap">Projektinformation</h2>
                
                <ProjectInfoForm projectInfo={projectInfo} onInfoChange={handleInfoChange} />

                <h2 className="text-xl font-bold border-y border-slate-700 py-2 my-4 text-slate-100 whitespace-nowrap">Objektförteckning</h2>

                <div className="space-y-2 mb-6">
                    {aggregatedObjects.map((group) => (
                        <ObjectRow
                            key={group.type} // Use type as key, assuming unique enough for this list
                            group={group}
                            count={group.ids.length}
                            onRemove={onRemoveObject}
                        />
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default LegendPanel;
