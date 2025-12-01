
import { LibraryItem } from '../types/index';
import { etableringCategory } from './etableringItems';
import { logistikCategory } from './logistikItems';
import { sakerhetCategory } from './sakerhetItems';
import { miljoCategory } from './miljoItems';
import { utrustningCategory } from './utrustningItems';
import { skyltarCategory } from './skyltarItems';
import { ritverktygCategory } from './ritverktygItems';
import { anlaggningCategory } from './anlaggningItems'; // Importera den nya kategorin

export const LIBRARY_CATEGORIES: { name: string; items: LibraryItem[] }[] = [
    etableringCategory,
    anlaggningCategory, // Lägg till den nya kategorin i listan
    logistikCategory,
    sakerhetCategory,
    miljoCategory,
    utrustningCategory,
    skyltarCategory,
    ritverktygCategory,
];
