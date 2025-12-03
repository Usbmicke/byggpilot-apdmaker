
import { ProjectInfo, APDObject, CustomLegendItem } from '../types';

// Detta är den datastruktur som sparas i .apd-filen
interface APDProjectData {
    version: string;
    projectInfo: ProjectInfo;
    background: { url: string; width: number; height: number; } | null;
    objects: APDObject[];
    customLegendItems: CustomLegendItem[];
}

/**
 * Sparar projektdata till webbläsarens localStorage för automatisk återställning.
 * Den faktiska nedladdningen av filen hanteras i Header-komponenten.
 */
export const saveAPD = (projectData: Omit<APDProjectData, 'version'>): void => {
    try {
        const dataToSave: APDProjectData = {
            version: '1.0',
            ...projectData
        };
        const dataStr = JSON.stringify(dataToSave);
        // Används för autospar/återställning vid omladdning
        localStorage.setItem('autosavedAPD', dataStr);
    } catch (error) {
        console.error("Fel vid sparande av APD-data till localStorage:", error);
    }
};

/**
 * Laddar och tolkar en .apd-projektfil.
 * Returnerar ett Promise som löses med projektdata.
 */
export const loadAPD = (file: File): Promise<APDProjectData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    return reject(new Error('Filen kunde inte läsas som text.'));
                }
                const data = JSON.parse(result) as APDProjectData;
                // Framtida validering av datan kan läggas till här
                if (!data.version || !data.projectInfo || !data.objects) {
                    throw new Error('Filen verkar inte vara en giltig APD-fil.')
                }
                resolve(data);
            } catch (error) {
                reject(new Error('Misslyckades med att tolka APD-filen. Den kan vara korrupt.'));
            }
        };
        reader.onerror = () => {
            reject(new Error('Ett fel uppstod vid läsning av filen.'));
        };
        reader.readAsText(file);
    });
};
