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

    const selectedClass = isSelected ? 'border-zinc-400 bg-zinc-700' : 'border-zinc-700';

    return (
        <>
            <DragPreviewImage connect={preview} src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
            <div
                ref={drag}
                onClick={handleClick}
                className={`flex items-center p-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border shadow-sm ${isDrawingTool ? 'cursor-pointer' : 'cursor-grab'} ${selectedClass}`}
                title={title}
            >
                <div className="w-8 h-8 mr-3 flex items-center justify-center text-zinc-400 bg-zinc-950 rounded-md flex-shrink-0 pointer-events-none select-none">
                    {item.icon}
                </div>
                <span className="text-sm font-medium text-zinc-300 pointer-events-none select-none">{item.name}</span>
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
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left font-semibold text-zinc-300 p-2 bg-zinc-900 hover:bg-zinc-800 rounded-md flex justify-between items-center transition-colors"
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
        } else {
            onSelectTool(item);
            const isDrawingTool = isLineTool(item.type) || isRectTool(item.type);
            if (isDrawingTool) {
                toast.success(`Ritverktyg '${item.name}' är aktivt. Tryck Esc för att avbryta.`, {
                    id: 'tool-toast',
                    duration: 5000
                });
            }
        }
    };

    // Remove the toast effect from here, it will be handled globally in App.tsx

    return (
        <aside
            className={`w-72 sm:w-80 bg-[#18181b] text-zinc-300 p-4 overflow-y-auto flex-shrink-0 transition-transform duration-300 ease-in-out border-r border-zinc-800
                        md:static md:h-auto md:w-64 lg:w-72 xl:w-80 md:translate-x-0 md:shadow-none
                        ${isOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:p-0 md:border-r-0'}`}
        >
            <h2 className="text-xl font-bold text-zinc-100 mb-4 whitespace-nowrap">Symbolbibliotek</h2>
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
