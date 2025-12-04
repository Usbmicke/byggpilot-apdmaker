
import * as pdfjs from 'pdfjs-dist';

// Sätt en direkt, statisk sökväg till worker-filen som har kopierats till /public.
// Detta är den mest robusta och felsäkra metoden.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface BackgroundImage {
    url: string;
    width: number;
    height: number;
}

const MAX_DIMENSION = 2048; // Max bredd eller höjd för canvas

/**
 * Hanterar en uppladdad PDF-fil, extraherar den första sidan som en bild,
 * och returnerar den som ett BackgroundImage-objekt.
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

                // Beräkna skalan för att passa inom MAX_DIMENSION
                const scale = Math.min(MAX_DIMENSION / originalViewport.width, MAX_DIMENSION / originalViewport.height, 2.0);

                const viewport = page.getViewport({ scale });

                // Skapa ett canvas-element för att rendera sidan
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) {
                    return reject(new Error('Kunde inte skapa canvas-kontext.'));
                }

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Rendera PDF-sidan till canvas
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;

                // Konvertera canvas till en data-URL (bild)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Använd jpeg för bättre komprimering

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
