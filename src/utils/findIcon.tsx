import React from 'react';
import { LIBRARY_CATEGORIES } from '../constants/libraryItems';
import { LibraryItem } from '../types';

export const findIcon = (type: string, iconUrl?: string): React.ReactNode | null => {
    if (iconUrl) {
        return <img src={ iconUrl } alt = { type } className = "w-full h-full object-contain" />;
    }

    for (const category of LIBRARY_CATEGORIES) {
        const foundItem = category.items.find((item: LibraryItem) => item.type === type);
        if (foundItem && foundItem.icon) {
            return foundItem.icon;
        }
    }
    return null;
};
