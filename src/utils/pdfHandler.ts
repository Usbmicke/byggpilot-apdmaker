
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface BackgroundImage {
    url: string;
    width: number;
    height: number;
}

// KORRIGERING: Höjer maxdimensionen för att tillåta högre kvalitet på moderna enheter.
const MAX_DIMENSION = 4096;

/**
 * Hanterar en uppladdad PDF-fil, extraherar den första sidan som en bild av hög kvalitet,
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
                const page = await pdf.getPage(1);

                // KORRIGERING: Implementerar en robust skalningsstrategi baserad på mål-DPI.
                const originalViewport = page.getViewport({ scale: 1.0 });
                
                // Vi siktar på 150 DPI, vilket är en bra balans mellan kvalitet och prestanda.
                const desiredDpi = 150;
                const desiredScale = desiredDpi / 72; // PDF:s interna enheter är 1/72 tum.

                // Vi beräknar också en skala för att passa inom vår säkerhetsgräns (MAX_DIMENSION).
                const scaleToFit = Math.min(MAX_DIMENSION / originalViewport.width, MAX_DIMENSION / originalViewport.height);

                // Den slutgiltiga skalan blir den minsta av vår önskade skala och säkerhetsskalan.
                // Detta renderar i 150 DPI, om inte ritningen är så stor att den måste skalas ner för att inte krascha webbläsaren.
                const scale = Math.min(desiredScale, scaleToFit);

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

                // KORRIGERING: Byter till PNG för förlustfri bildkvalitet, vilket är avgörande för ritningar.
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
