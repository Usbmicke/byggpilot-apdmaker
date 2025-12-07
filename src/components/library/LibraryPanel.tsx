
import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import toast from 'react-hot-toast';
import { LIBRARY_CATEGORIES } from '../../constants/libraryItems';
import { LibraryItem, isLineTool, isRectTool } from '../../types/index';

export const ItemTypes = {
    LIBRARY_ITEM: 'library-item',
};

interface DraggableLibraryItemProps {
    item: LibraryItem;
    onClick: (item: LibraryItem) => void;
    isSelected: boolean;
}

const DraggableLibraryItem: React.FC<DraggableLibraryItemProps> = ({ item, onClick, isSelected }) => {
    const isDrawingTool = isLineTool(item.type) || isRectTool(item.type);

    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: ItemTypes.LIBRARY_ITEM,
        item: item,
        canDrag: !isDrawingTool,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const handleClick = () => {
        if (isDrawingTool) {
            onClick(item);
        }
    };

    const title = isDrawingTool
        ? `Klicka för att aktivera ${item.name} och rita`
        : `Dra ut ${item.name} på ritningen`;

    const selectedClass = isSelected ? 'border-blue-500 bg-slate-700' : 'border-slate-700';

    return (
        <div
            ref={drag}
            onClick={handleClick}
            className={`flex items-center p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border shadow-sm ${isDrawingTool ? 'cursor-pointer' : 'cursor-grab'} ${selectedClass}`}
            style={{ opacity: isDragging ? 0.4 : 1 }}
            title={title}
        >
            <div className="w-8 h-8 mr-3 flex items-center justify-center text-slate-400 bg-slate-900 rounded-md flex-shrink-0 pointer-events-none select-none">
                {item.icon}
            </div>
            <span className="text-sm font-medium text-slate-300 pointer-events-none select-none">{item.name}</span>
        </div>
    );
};

interface CategoryProps {
    name: string;
    items: LibraryItem[];
    onSelectTool: (item: LibraryItem) => void;
    selectedTool: LibraryItem | null;
}

const Category: React.FC<CategoryProps> = ({ name, items, onSelectTool, selectedTool }) => {
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
                            onClick={onSelectTool}
                            isSelected={selectedTool?.type === item.type}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface LibraryPanelProps {
    isOpen: boolean;
    selectedTool: LibraryItem | null;
    onSelectTool: (item: LibraryItem | null) => void;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ isOpen, selectedTool, onSelectTool }) => {
    
    const handleSelectTool = (item: LibraryItem) => {
        if (selectedTool?.type === item.type) {
            onSelectTool(null); // Deselect if clicking the same tool
            toast.dismiss(); // Dismiss any active tool toast
        } else {
            onSelectTool(item);
            toast.loading(`Ritverktyg '${item.name}' är aktivt.`, { id: 'tool-toast', duration: Infinity });
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
                    onSelectTool={handleSelectTool}
                    selectedTool={selectedTool}
                />
            ))}
        </aside>
    );
};

export default LibraryPanel;
