
import React, { useState } from 'react';
import { LIBRARY_CATEGORIES } from '../constants/libraryItems';
import { LibraryItem, isLineTool } from '../types/index';

interface LibraryItemProps {
    item: LibraryItem;
    onSelect: (item: LibraryItem) => void;
}

const LibraryItemComponent: React.FC<LibraryItemProps> = ({ item, onSelect }) => {
    
    // Allow dragging for ALL items (removed isDrawable check)
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleClick = () => {
        onSelect(item);
    }

    return (
        <div
            draggable={true}
            onDragStart={handleDragStart}
            onClick={handleClick}
            className="flex items-center p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hover:border-slate-500 shadow-sm cursor-pointer active:bg-slate-600"
            title={`Klicka för att välja ${item.name}`}
        >
            <div className="w-8 h-8 mr-3 flex items-center justify-center text-slate-400 bg-slate-700 rounded-md flex-shrink-0 pointer-events-none select-none">
                {item.icon}
            </div>
            <span className="text-sm font-medium text-slate-300 pointer-events-none select-none">{item.name}</span>
        </div>
    );
};

const Category: React.FC<{ name: string; items: LibraryItem[]; onSelect: (item: LibraryItem) => void }> = ({ name, items, onSelect }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left font-semibold text-slate-300 p-2 bg-slate-800 hover:bg-slate-700 rounded-md flex justify-between items-center transition-colors"
            >
                {name}
                <svg className={`w-5 h-5 transition-transform ${isOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="pt-2 space-y-2">
                    {items.map(item => (
                        <LibraryItemComponent 
                            key={item.type} 
                            item={item} 
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface LibraryPanelProps {
    onItemSelect: (item: LibraryItem) => void;
    isOpen: boolean;
    onClose: () => void;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ onItemSelect, isOpen, onClose }) => {
    return (
        <>
            {/* Bakgrund för mobil när menyn är öppen */}
            <div
                className={`md:hidden fixed top-[72px] inset-x-0 bottom-0 bg-black bg-opacity-50 z-20 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            
            <aside 
                className={`w-80 max-w-full bg-slate-900 text-slate-300 p-4 overflow-y-auto flex-shrink-0 transition-transform duration-300 ease-in-out border-r border-slate-700
                            fixed top-[72px] left-0 bottom-0 z-30 shadow-2xl
                            md:static md:h-auto md:w-64 md:translate-x-0 md:shadow-none
                            ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex justify-between items-center mb-4 md:hidden border-b border-slate-700 pb-2">
                    <h2 className="font-bold text-lg text-slate-200">Bibliotek</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-700" aria-label="Stäng bibliotek">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                 <h2 className="hidden md:block text-xl font-bold text-slate-100 mb-4">Bibliotek</h2>
                {LIBRARY_CATEGORIES.map(category => (
                    <Category 
                        key={category.name} 
                        name={category.name} 
                        items={category.items} 
                        onSelect={onItemSelect} 
                    />
                ))}
                {/* Utfyllnad i botten för att säkerställa scrollning */}
                <div className="h-20 md:hidden"></div>
            </aside>
        </>
    );
};

export default LibraryPanel;
