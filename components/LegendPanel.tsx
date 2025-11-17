import React, { useMemo, useState } from 'react';
import { APDObject, CustomLegendItem } from '../types/index';
import { LIBRARY_CATEGORIES } from '../constants/libraryItems';

const findIcon = (type: string) => {
    for (const category of LIBRARY_CATEGORIES) {
        const item = category.items.find(i => i.type === type);
        if (item) return item.icon;
    }
    return null;
};

interface LegendPanelProps {
    objects: APDObject[];
    customItems: CustomLegendItem[];
    setCustomItems: React.Dispatch<React.SetStateAction<CustomLegendItem[]>>;
    isOpen: boolean;
    onClose: () => void;
}

const LegendPanel: React.FC<LegendPanelProps> = ({ objects, customItems, setCustomItems, isOpen, onClose }) => {
    const [newItemName, setNewItemName] = useState('');
    const [newItemCount, setNewItemCount] = useState<number | ''>(1);

    const legendData = useMemo(() => {
        const counts: { [key: string]: { count: number; icon: React.ReactNode | null; type: string } } = {};
        objects.forEach(obj => {
            if (counts[obj.label]) {
                counts[obj.label].count++;
            } else {
                counts[obj.label] = { count: 1, icon: findIcon(obj.type), type: obj.type };
            }
        });
        return Object.entries(counts).map(([label, data]) => ({ label, ...data }));
    }, [objects]);

    const handleAddCustomItem = () => {
        if (newItemName.trim() && newItemCount && newItemCount > 0) {
            setCustomItems(prev => [...prev, { id: `custom-${Date.now()}`, name: newItemName, count: newItemCount }]);
            setNewItemName('');
            setNewItemCount(1);
        }
    };
    
    const handleRemoveCustomItem = (id: string) => {
        setCustomItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <>
            {/* Bakgrund för mobil */}
            <div
                className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside 
                id="legend-panel" 
                className={`
                    bg-slate-900 text-slate-300
                    transition-all duration-300 ease-in-out
                    fixed top-0 right-0 h-full z-30 shadow-2xl
                    md:static md:h-auto md:shadow-none md:border-slate-700
                    overflow-hidden flex-shrink-0
                    ${isOpen 
                        ? 'translate-x-0 w-80 max-w-full md:border-l' 
                        : 'translate-x-full md:translate-x-0 md:w-0 md:border-l-0'
                    }
                `}
            >
                <div className="w-80 h-full p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 md:hidden border-b pb-2 border-slate-700">
                        <h2 className="text-lg font-bold text-slate-200">Förteckning</h2>
                        <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-700" aria-label="Stäng förteckning">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <h2 className="hidden md:block text-xl font-bold border-b border-slate-700 pb-2 mb-4 text-slate-100">Förteckning / Legend</h2>
                    
                    <div className="space-y-2 mb-6">
                        {legendData.map(({ label, count, icon }) => (
                            <div key={label} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
                                <div className="flex items-center min-w-0">
                                    <div className="w-6 h-6 mr-3 text-slate-400 flex-shrink-0">{icon}</div>
                                    <span className="text-sm font-medium text-slate-300 truncate" title={label}>{label}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-200 ml-2">{count} st</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        {customItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-600 shadow-sm">
                                <div className="flex items-center min-w-0">
                                   <div className="w-6 h-6 mr-3 text-slate-400 flex-shrink-0">
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
                                   </div>
                                   <span className="text-sm font-medium text-slate-300 truncate" title={item.name}>{item.name}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm font-semibold text-slate-200 ml-2">{item.count} st</span>
                                    <button onClick={() => handleRemoveCustomItem(item.id)} className="ml-2 text-red-500 hover:text-red-700 font-bold" aria-label="Ta bort anpassat objekt">&times;</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 border-t border-slate-700 pt-4">
                         <h3 className="text-md font-semibold mb-3 text-slate-100">Lägg till egen rad</h3>
                         <div className="flex flex-col space-y-2">
                            <input 
                                type="text" 
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                placeholder="Objektnamn"
                                className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-full text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                            />
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="number"
                                    value={newItemCount}
                                    onChange={e => setNewItemCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                    min="1"
                                    placeholder="Antal"
                                    className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-full text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                                />
                            </div>
                            <button onClick={handleAddCustomItem} className="bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-3 rounded-lg text-sm shadow-sm hover:shadow transition-all w-full justify-center flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                Lägg till
                            </button>
                         </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default LegendPanel;