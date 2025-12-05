
import { LIBRARY_CATEGORIES } from '../constants/libraryItems';

// Hjälpfunktion för att hitta en ikons React-komponent baserat på dess typ
export const findIcon = (type: string) => {
    for (const category of LIBRARY_CATEGORIES) {
        const item = category.items.find(i => i.type === type);
        if (item) return item.icon;
    }
    return null;
};
