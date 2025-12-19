
import { LibraryItem } from '../../types/index';
import { etableringCategory } from './etableringItems';
import { logistikCategory } from './logistikItems';
import { sakerhetCategory } from './sakerhetItems';
import { miljoCategory } from './miljoItems';
import { utrustningCategory } from './utrustningItems';
import { skyltarCategory } from './skyltarItems';
import { ritverktygCategory } from './ritverktygItems';
import { anlaggningCategory } from './anlaggningItems';

export const LIBRARY_CATEGORIES: { name: string; items: LibraryItem[] }[] = [
    ritverktygCategory, // Moved to the top as requested
    etableringCategory,
    anlaggningCategory,
    logistikCategory,
    sakerhetCategory,
    miljoCategory,
    utrustningCategory,
    skyltarCategory,
];
