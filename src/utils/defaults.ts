
import { ProjectInfo, CustomLegendItem } from '../types';

export const defaultProjectInfo: ProjectInfo = {
    projectName: 'Nytt ByggPilot Projekt',
    projectNumber: '12345',
    author: 'ByggPilot Användare',
    date: new Date().toISOString().split('T')[0], // Dagens datum
    revision: 'A',
};

export const defaultCustomLegend: CustomLegendItem[] = [
    { id: '1', text: 'Exempel på egen symbol', symbol: { type: 'text', content: '★' } },
];
