
import { ProjectInfo, CustomLegendItem } from '../types';

export const defaultProjectInfo: ProjectInfo = {
    company: 'Mitt Företag AB',
    projectId: 'P-12345',
    projectName: 'Nytt ByggPilot Projekt',
    projectNumber: '12345',
    author: 'ByggPilot Användare',
    date: new Date().toISOString().split('T')[0], // Dagens datum
    revision: 'A',
};

export const defaultCustomLegend: CustomLegendItem[] = [
    { id: '1', name: 'Exempel på egen symbol', color: '#ff0000' },
];
