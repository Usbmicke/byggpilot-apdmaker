
import React, { useState } from 'react';
import { APDObject, CustomLegendItem, ProjectInfo } from '../../types/index';
import { findIcon } from '../../utils/findIcon';

const ObjectRow = React.memo(({ obj, onRemove, onUpdate }: { obj: APDObject, onRemove: (id: string) => void, onUpdate: (id: string, newQuantity: number) => void }) => {
    const [quantity, setQuantity] = useState(obj.quantity.toString());

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuantity(val);
        const num = parseInt(val, 10);
        if (!isNaN(num) && num > 0) {
            onUpdate(obj.id, num);
        }
    };

    return (
        <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
            <div className="flex items-center min-w-0">
                <div className="w-6 h-6 mr-3 text-slate-400 flex-shrink-0">{findIcon(obj.type)}</div>
                <span className="text-sm font-medium text-slate-300 truncate" title={obj.item.name}>{obj.item.name}</span>
            </div>
            <div className="flex items-center">
                <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    onBlur={() => setQuantity(obj.quantity.toString())}
                    className="w-16 p-1 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-center"
                />
                <button 
                    onClick={() => onRemove(obj.id)}
                    className="ml-2 p-1 text-red-500 hover:text-red-400 rounded-full hover:bg-slate-700"
                    aria-label="Ta bort objekt"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    );
});

interface LegendPanelProps {
    objects: APDObject[];
    customItems: CustomLegendItem[];
    setCustomItems: React.Dispatch<React.SetStateAction<CustomLegendItem[]>>;
    isOpen: boolean;
    projectInfo: ProjectInfo;
    setProjectInfo: (info: ProjectInfo) => void;
    onRemoveObject: (id: string) => void;
    onUpdateObject: (id: string, quantity: number) => void;
}

const LegendPanel: React.FC<LegendPanelProps> = ({ objects, customItems, setCustomItems, isOpen, projectInfo, setProjectInfo, onRemoveObject, onUpdateObject }) => {
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState('#ffffff');

    const handleAddCustomItem = () => {
        if (newItemName.trim()) {
            setCustomItems(prev => [...prev, { id: `custom-${Date.now()}`, name: newItemName, color: newItemColor }]);
            setNewItemName('');
        }
    };
    
    const handleRemoveCustomItem = (id: string) => {
        setCustomItems(prev => prev.filter(item => item.id !== id));
    };

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProjectInfo({ ...projectInfo, [e.target.name]: e.target.value });
    }

    const symbolObjects = objects.filter(obj => !['pen', 'walkway', 'fence', 'construction-traffic', 'text'].includes(obj.type));

    return (
        <aside 
            id="legend-panel" 
            className={`bg-slate-900 text-slate-300 transition-[width,transform] duration-300 ease-in-out h-full z-20 md:static md:h-auto md:shadow-none md:border-slate-700 overflow-hidden flex-shrink-0
                ${isOpen ? 'translate-x-0 w-80 md:w-80 md:border-l' : 'translate-x-full md:translate-x-0 md:w-0 md:border-l-0'}`}
        >
            <div className="w-80 h-full p-4 overflow-y-auto flex flex-col">
                <h2 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4 text-slate-100 whitespace-nowrap">Projektinformation</h2>
                
                <div className="space-y-3 mb-6">
                    <div>
                        <label htmlFor="company" className="text-sm font-medium text-slate-400">Företag</label>
                        <input type="text" name="company" id="company" value={projectInfo.company} onChange={handleInfoChange} className="mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-full text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="projectName" className="text-sm font-medium text-slate-400">Projektnamn</label>
                        <input type="text" name="projectName" id="projectName" value={projectInfo.projectName} onChange={handleInfoChange} className="mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-full text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="projectId" className="text-sm font-medium text-slate-400">Projekt-ID</label>
                        <input type="text" name="projectId" id="projectId" value={projectInfo.projectId} onChange={handleInfoChange} className="mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-full text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>

                <h2 className="text-xl font-bold border-y border-slate-700 py-2 my-4 text-slate-100 whitespace-nowrap">Objektförteckning</h2>

                <div className="space-y-2 mb-6">
                    {symbolObjects.map(obj => (
                        <ObjectRow key={obj.id} obj={obj} onRemove={onRemoveObject} onUpdate={onUpdateObject} />
                    ))}
                </div>

                <div className="space-y-2">
                    {customItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
                             <div style={{width: 12, height: 12, backgroundColor: item.color, marginRight: 8, borderRadius: '50%', flexShrink: 0}}></div>
                             <span className="text-sm font-medium text-slate-300 truncate flex-1" title={item.name}>{item.name}</span>
                            <button onClick={() => handleRemoveCustomItem(item.id)} className="ml-2 p-1 text-red-500 hover:text-red-400 rounded-full hover:bg-slate-700" aria-label="Ta bort anpassad rad"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                    ))}
                </div>

                 <div className="mt-auto border-t border-slate-700 pt-4">
                     <h3 className="text-md font-semibold mb-3 text-slate-100 whitespace-nowrap">Lägg till egen rad i förteckning</h3>
                     <div className="flex flex-col space-y-2">
                        <input 
                            type="text" 
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            placeholder="Namn på egen rad..."
                            className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-full text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex items-center gap-2">
                             <label htmlFor="new-item-color" className="text-sm text-slate-400">Färg:</label>
                             <input 
                                type="color" 
                                id="new-item-color"
                                value={newItemColor}
                                onChange={e => setNewItemColor(e.target.value)}
                                className="w-8 h-8 p-1 bg-slate-700 border border-slate-600 rounded"
                             />
                            <button onClick={handleAddCustomItem} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all w-full justify-center flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                Lägg till
                            </button>
                        </div>
                     </div>
                </div>
            </div>
        </aside>
    );
};

export default LegendPanel;
