
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APDObject, CustomLegendItem, ProjectInfo } from '../types';

// En unik ID för att bombsäkert hitta förteckningselementet.
const LEGEND_CONTAINER_ID = 'apd-legend-for-export';

// --- ROBUST BILDHANTERING OCH HTML-GENERERING ---

// Konverterar SVG till PNG för att garantera kompatibilitet med html2canvas.
const convertSvgToPng = (svgDataUrl: string, width = 64, height = 64): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context for PNG conversion.'));
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(new Error(`Failed to load SVG for conversion: ${err}`));
        // Sätt crossorigin för att undvika tainting-problem med canvas
        img.crossOrigin = 'anonymous';
        img.src = svgDataUrl;
    });
};

// Bygger en HTML-sträng för förteckningen, med det unika ID:t på root-elementet.
const renderLegendToHtml = async (projectInfo: ProjectInfo, objects: APDObject[], customItems: CustomLegendItem[]): Promise<string> => {
    const aggregatedSymbols = objects.reduce((acc, obj) => {
        const key = obj.item?.id || obj.type;
        if (!key) return acc;
        if (!acc[key]) {
            acc[key] = { ...obj, quantity: 0 };
        }
        acc[key].quantity += (obj.quantity || 1);
        return acc;
    }, {} as { [key: string]: APDObject });

    const symbolHtmlPromises = Object.values(aggregatedSymbols).map(async (obj) => {
        let iconHtml = '<div style="width: 16px; height: 16px; margin-right: 8px;"></div>';
        if (obj.item?.iconUrl) {
            try {
                const pngUrl = await convertSvgToPng(obj.item.iconUrl);
                // crossorigin="anonymous" är viktigt för att html2canvas ska kunna rendera bilden
                iconHtml = `<img src="${pngUrl}" style="width: 16px; height: 16px; margin-right: 8px;" crossorigin="anonymous" />`;
            } catch (e) {
                console.error(`Failed to convert icon for ${obj.item?.name}:`, e);
            }
        }
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center;">
                    ${iconHtml}
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; font-weight: 500;">${obj.item?.name || 'Okänt objekt'}</span>
                </div>
                <span style="font-weight: bold; color: #444;">${obj.quantity} st</span>
            </div>
        `;
    });

    const symbolHtml = (await Promise.all(symbolHtmlPromises)).join('');

    const customHtml = customItems.map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center;">
                <div style="width: 14px; height: 14px; border-radius: 4px; background-color: ${item.color}; margin-right: 8px;"></div>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; font-weight: 500;">${item.name || 'Anpassad'}</span>
            </div>
            <span style="font-weight: bold; color: #444;">-</span>
        </div>
    `).join('');

    // KORRIGERING: Borttagna felaktiga backslashes runt template literal och variabler.
    return `
      <div id="${LEGEND_CONTAINER_ID}" style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #fff; padding: 20px; box-sizing: border-box; width: 320px;">
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Projektinformation</h2>
          <div style="font-size: 12px; margin-bottom: 20px; line-height: 1.6;">
              <div style="display: flex; justify-content: space-between;"><strong style="color: #475569;">Företag:</strong> <span>${projectInfo.company || '-'}</span></div>
              <div style="display: flex; justify-content: space-between;"><strong style="color: #475569;">Projekt:</strong> <span>${projectInfo.projectName || '-'}</span></div>
              <div style="display: flex; justify-content: space-between;"><strong style="color: #475569;">ID:</strong> <span>${projectInfo.projectId || '-'}</span></div>
              <div style="display: flex; justify-content: space-between;"><strong style="color: #475569;">Datum:</strong> <span>${new Date().toLocaleDateString('sv-SE')}</span></div>
          </div>
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Teckenförklaring</h2>
          <div style="font-size: 11px;">${symbolHtml}${customHtml}</div>
      </div>`;
};

// Säkerställer att alla bilder är laddade innan rendering
const getCanvasFromHtml = (container: HTMLElement): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const elementToRender = container.querySelector<HTMLElement>(`#${LEGEND_CONTAINER_ID}`);
        if (!elementToRender) {
             return reject(new Error('Could not find the legend element to render. This should not happen.'));
        }

        // html2canvas hanterar bildladdning internt när useCORS är satt, så den komplexa manuella väntan är inte nödvändig.
        html2canvas(elementToRender, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(resolve, reject);
    });
};

interface ExportConfig {
    projectInfo: ProjectInfo;
    objects: APDObject[];
    customLegendItems: CustomLegendItem[];
    stageRef: React.RefObject<any>;
    background: { width: number; height: number; };
}

// --- DEN CENTRALA, EXPORTERADE FUNKTIONEN ---
export const exportPlan = async (format: 'jpeg' | 'pdf', config: ExportConfig): Promise<{ status: 'success' | 'error', message: string }> => {
    const { projectInfo, objects, customLegendItems, stageRef, background } = config;

    if (!stageRef.current) {
        return { status: 'error', message: 'Stage reference is missing.' };
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';

    try {
        document.body.appendChild(container);

        container.innerHTML = await renderLegendToHtml(projectInfo, objects, customLegendItems);
        const legendCanvas = await getCanvasFromHtml(container);
        
        const stageImageURL = stageRef.current.toDataURL({ pixelRatio: 2 });
        
        if (format === 'jpeg') {
            const finalCanvas = document.createElement('canvas');
            const ctx = finalCanvas.getContext('2d');
            if (!ctx) throw new Error('Could not create canvas context for JPEG export.');

            const margin = 20;
            const stageImage = new Image();
            await new Promise(r => { stageImage.onload = r; stageImage.src = stageImageURL; });

            finalCanvas.width = stageImage.width + legendCanvas.width + margin * 3;
            finalCanvas.height = Math.max(stageImage.height, legendCanvas.height) + margin * 2;
            
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            ctx.drawImage(stageImage, margin, margin);
            ctx.drawImage(legendCanvas, stageImage.width + margin * 2, margin);

            const dataURL = finalCanvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.download = `${projectInfo.projectName?.replace(/ /g, '_') || 'apd-plan'}.jpeg`;
            link.href = dataURL;
            link.click();
        } else { // PDF
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            
            const legendWidthMM = 70;
            const legendHeightMM = (legendCanvas.height * legendWidthMM) / legendCanvas.width;
            const drawingAreaWidth = pdfWidth - legendWidthMM - margin * 3;
            let canvasWidthMM = drawingAreaWidth;
            let canvasHeightMM = canvasWidthMM / (background.width / background.height);

            if (canvasHeightMM > pdfHeight - margin * 2) {
                canvasHeightMM = pdfHeight - margin * 2;
                canvasWidthMM = canvasHeightMM * (background.width / background.height);
            }

            pdf.setFontSize(28);
            pdf.setTextColor(30, 41, 59);
            pdf.setFont('Helvetica', 'bold');
            pdf.text('APD-PLAN', margin, margin + 8);
            pdf.setDrawColor(100, 116, 139);
            pdf.setLineWidth(0.5);
            pdf.line(margin, margin + 12, margin + 100, margin + 12);

            pdf.addImage(stageImageURL, 'JPEG', margin, margin + 20, canvasWidthMM, canvasHeightMM);
            pdf.addImage(legendCanvas.toDataURL('image/png'), 'PNG', pdfWidth - legendWidthMM - margin, margin + 20, legendWidthMM, legendHeightMM);
            
            pdf.save(`${projectInfo.projectName?.replace(/ /g, '_') || 'apd-plan'}.pdf`);
        }

        return { status: 'success', message: 'Export completed successfully.' };

    } catch (error) {
        console.error('A critical error occurred during export:', error);
        return { status: 'error', message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    } finally {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }
};
