
import { LIBRARY_CATEGORIES } from '../constants/libraryItems';
import { LibraryItem } from '../types';

export const findIcon = (type: string): React.ReactNode | null => {
    for (const category of LIBRARY_CATEGORIES) {
        const foundItem = category.items.find((item: LibraryItem) => item.type === type);
        if (foundItem && foundItem.icon) {
            return foundItem.icon;
        }
    }
    return null;
};
