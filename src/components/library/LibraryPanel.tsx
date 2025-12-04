
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { LIBRARY_CATEGORIES } from '../../constants/libraryItems';
import { LibraryItem, isLineTool, DrawingTool } from '../../types/index';

export const ItemTypes = {
    LIBRARY_ITEM: 'library-item',
};

interface DraggableLibraryItemProps {
    item: LibraryItem;
    onSelect: (item: LibraryItem) => void;
}

const DraggableLibraryItem: React.FC<DraggableLibraryItemProps> = ({ item, onSelect }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.LIBRARY_ITEM,
        item: item,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const handleClick = () => {
        onSelect(item);
    };

    // KORRIGERING: Tydligare title-text för att förklara klick vs. dra
    const title = isLineTool(item.type) 
        ? `Klicka för att börja rita ${item.name}`
        : `Dra ut ${item.name} på ritningen`;

    return (
        <div
            ref={drag}
            onClick={handleClick}
            className="flex items-center p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hover:border-blue-500 shadow-sm cursor-pointer active:bg-slate-600"
            style={{ opacity: isDragging ? 0.5 : 1 }}
            title={title}
        >
            <div className="w-8 h-8 mr-3 flex items-center justify-center text-slate-400 bg-slate-900 rounded-md flex-shrink-0 pointer-events-none select-none">
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
                        <DraggableLibraryItem
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
    isOpen: boolean;
    setPendingItem: (item: LibraryItem | null) => void;
    setDrawingState: (state: { type: DrawingTool, points: number[], item: LibraryItem } | null) => void;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ isOpen, setPendingItem, setDrawingState }) => {
    const handleItemSelect = (item: LibraryItem) => {
        if (isLineTool(item.type)) {
            setDrawingState({ type: item.type, points: [], item: item });
            setPendingItem(null);
            // KORRIGERING: Ge omedelbar feedback genom att ändra muspekaren globalt
            document.body.style.cursor = 'crosshair';
        } else {
            setPendingItem(item);
            setDrawingState(null);
            document.body.style.cursor = 'default';
        }
    };

    return (
        <aside 
             className={`w-80 max-w-full bg-slate-900 text-slate-300 p-4 overflow-y-auto flex-shrink-0 transition-transform duration-300 ease-in-out border-r border-slate-700
                        md:static md:h-auto md:w-64 md:translate-x-0 md:shadow-none
                        ${isOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:p-0 md:border-r-0'}`}
        >
             <h2 className="text-xl font-bold text-slate-100 mb-4 whitespace-nowrap">Symbolbibliotek</h2>
            {LIBRARY_CATEGORIES.map(category => (
                <Category 
                    key={category.name} 
                    name={category.name} 
                    items={category.items} 
                    onSelect={handleItemSelect}
                />
            ))}
        </aside>
    );
};

export default LibraryPanel;
