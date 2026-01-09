import React, { useState, useEffect } from 'react';
import { useDrag, DragPreviewImage } from 'react-dnd';
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

    const [, drag, preview] = useDrag(() => ({
        type: ItemTypes.LIBRARY_ITEM,
        item: item,
        canDrag: !isDrawingTool,
        collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }));

    const handleClick = () => {
        onClick(item);
    };

    let title = isDrawingTool
        ? `Klicka för att aktivera ${item.name} och rita`
        : `Dra ut ${item.name} på ritningen`;

    if (item.type === 'building') {
        title = "Rita ut byggnader i 2D för att automatiskt se dem som volymer i 3D-vyn. Används som underlag för symboler.";
    }

    // New Selected State: Gradient Border & Glow
    const selectedClass = isSelected
        ? 'ring-1 ring-brand-start bg-brand-start/10 shadow-neon'
        : 'border-white/5 hover:bg-white/5 hover:border-white/10';

    return (
        <>
            <DragPreviewImage connect={preview} src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
            <div
                ref={drag}
                onClick={handleClick}
                className={`flex items-center p-3 rounded-xl transition-all duration-300 border backdrop-blur-sm group ${isDrawingTool ? 'cursor-pointer' : 'cursor-grab'} ${selectedClass}`}
                title={title}
            >
                <div className={`w-10 h-10 mr-3 flex items-center justify-center rounded-lg flex-shrink-0 pointer-events-none select-none transition-colors ${isSelected ? 'bg-brand-gradient text-white shadow-lg' : 'bg-dark-bg text-text-muted group-hover:text-white group-hover:bg-card-bg'}`}>
                    {item.icon}
                </div>
                <span className={`text-sm font-medium pointer-events-none select-none transition-colors ${isSelected ? 'text-white' : 'text-text-muted group-hover:text-white'}`}>{item.name}</span>
            </div>
        </>
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
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left font-bold text-xs uppercase tracking-wider text-text-muted p-2 hover:text-white flex justify-between items-center transition-colors select-none"
            >
                {name}
                <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="pt-1 space-y-2 px-1">
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
        } else {
            onSelectTool(item);
            const isDrawingTool = isLineTool(item.type) || isRectTool(item.type);
            if (isDrawingTool) {
                toast.success(`Ritverktyg '${item.name}' är aktivt.`, { id: 'tool-active' });
            }
        }
    };

    return (
        <aside
            className={`
                fixed md:static inset-y-0 left-0 z-40
                w-72 sm:w-80
                glass-panel border-r border-white/5
                p-4 overflow-y-auto overflow-x-hidden
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full md:w-0 md:p-0 md:border-r-0 opacity-0'}
            `}
        >
            <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100 delay-200' : 'opacity-0'}`}>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-start to-brand-end mb-6 tracking-tight">Katalog</h2>
                <div className="space-y-2 pb-20"> {/* Padding bottom for scroll */}
                    {LIBRARY_CATEGORIES.map(category => (
                        <Category
                            key={category.name}
                            name={category.name}
                            items={category.items}
                            onSelectTool={handleSelectTool}
                            selectedTool={selectedTool}
                        />
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default LibraryPanel;
