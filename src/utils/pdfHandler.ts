
import { pdfjs } from 'react-pdf';

interface BackgroundImage {
    url: string;
    width: number;
    height: number;
}

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

                const viewport = page.getViewport({ scale: 2.0 }); // Skala upp för bättre kvalitet

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
