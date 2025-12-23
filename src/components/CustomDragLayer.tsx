
import React, { CSSProperties } from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { ItemTypes } from './library/LibraryPanel';
import { LibraryItem } from '../types/index';

const layerStyles: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
};

function getItemStyles(initialOffset: XYCoord | null, currentOffset: XYCoord | null) {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        };
    }

    let { x, y } = currentOffset;

    const transform = `translate(${x}px, ${y}px)`;
    return {
        transform,
        WebkitTransform: transform,
        opacity: 0.8,
        // Add a scale effect or color tint?
    };
}

const ItemPreview: React.FC<{ item: LibraryItem }> = ({ item }) => {
    return (
        <div className="flex items-center p-2 bg-zinc-800 rounded-lg shadow-xl border border-zinc-600 opacity-90">
            <div className="w-10 h-10 mr-2 flex items-center justify-center text-zinc-400 bg-zinc-950 rounded-md">
                {item.icon}
            </div>
            <span className="text-sm font-medium text-white">{item.name}</span>
        </div>
    );
};


export const CustomDragLayer: React.FC<{ scale: number }> = ({ scale }) => {
    const {
        itemType,
        isDragging,
        item,
        initialOffset,
        currentOffset,
    } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }));

    if (!isDragging) {
        return null;
    }

    // Only render for LibraryItems (Symbols)
    if (itemType !== ItemTypes.LIBRARY_ITEM) {
        return null;
    }

    // Calculate dimensions based on scale
    // scale is meters/pixel
    // item.initialProps.width is in meters (usually) or defaults
    const widthMeters = item.initialProps?.width || 2.0;
    const heightMeters = item.initialProps?.height || widthMeters;

    // Convert to pixels
    // scale is passed from App/Canvas, usually representing 'pixels per unit/meter' (Zoom)
    const widthPixels = widthMeters * scale;
    const heightPixels = heightMeters * scale;

    // CLAMPING to prevent "Gigantic" or "Tiny" icons during drag
    // User complaint: "gigantisk eller jätteliten".
    // We constrain the visual preview to be usable (e.g. between 32px and 128px)
    // regardless of the actual map scale, for better UX.
    // Preserving aspect ratio is important though.
    const aspectRatio = widthPixels / heightPixels;

    let displayWidth = widthPixels;
    let displayHeight = heightPixels;

    const MIN_SIZE = 32;
    const MAX_SIZE = 120; // Reasonable "Cursor" size

    // If too big
    if (displayWidth > MAX_SIZE || displayHeight > MAX_SIZE) {
        if (displayWidth > displayHeight) {
            displayWidth = MAX_SIZE;
            displayHeight = MAX_SIZE / aspectRatio;
        } else {
            displayHeight = MAX_SIZE;
            displayWidth = MAX_SIZE * aspectRatio;
        }
    }

    // If too small (and likely hard to see)
    if (displayWidth < MIN_SIZE || displayHeight < MIN_SIZE) {
        if (displayWidth > displayHeight) {
            displayHeight = MIN_SIZE;
            displayWidth = MIN_SIZE * aspectRatio;
        } else {
            displayWidth = MIN_SIZE;
            displayHeight = MIN_SIZE / aspectRatio;
        }
    }

    return (
        <div style={layerStyles}>
            <div style={getItemStyles(initialOffset, currentOffset)}>
                {/* User requested ONLY the icon ("ikonen enbart") */}
                {/* Render clean icon, slightly larger for visibility */}
                <div style={{
                    width: displayWidth,
                    height: displayHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' // Add shadow for contrast
                }}>
                    {item.icon && (
                        <div style={{ width: '100%', height: '100%', transform: 'scale(1.2)' }}>
                            {item.icon}
                        </div>
                    )}
                    {!item.icon && <span className="text-white font-bold shadow-black drop-shadow-md">{item.name}</span>}
                </div>
            </div>
        </div>
    );
};
