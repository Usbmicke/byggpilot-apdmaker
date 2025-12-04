
import { pdfjs } from 'react-pdf';

// ALL WORKER-KONFIGURATION ÄR BORTTAGEN HÄRIFRÅN FÖR ATT FÖRHINDRA KONFLIKTER.
// Konfigurationen kommer att hanteras centralt och korrekt i App.tsx.

interface BackgroundImage {
    url: string;
    width: number;
    height: number;
}

const TARGET_OUTPUT_WIDTH = 3000; // Önskad bredd i pixlar för den genererade bilden

/**
 * Hanterar en uppladdad PDF-fil, extraherar den första sidan som en bild,
 * skalar den till en konsekvent storlek, och returnerar den som ett BackgroundImage-objekt.
 */
export const handlePDF = (file: File): Promise<BackgroundImage> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target?.result;
                if (!arrayBuffer) {
                    return reject(new Error('Kunde inte läsa PDF-filen.'));
                }

                const loadingTask = pdfjs.getDocument(arrayBuffer as ArrayBuffer);
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1); // Hämta första sidan

                const originalViewport = page.getViewport({ scale: 1.0 });
                const scale = TARGET_OUTPUT_WIDTH / originalViewport.width;
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) {
                    return reject(new Error('Kunde inte skapa canvas-kontext.'));
                }

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;

                const dataUrl = canvas.toDataURL('image/png');

                resolve({ 
                    url: dataUrl, 
                    width: viewport.width, 
                    height: viewport.height 
                });

            } catch (error) {
                console.error("Fel vid hantering av PDF:", error);
                reject(new Error('Misslyckades med att bearbeta PDF-filen.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Ett fel uppstod vid läsning av filen.'));
        };

        reader.readAsArrayBuffer(file);
    });
};
