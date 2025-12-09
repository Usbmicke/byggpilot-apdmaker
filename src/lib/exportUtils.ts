
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APDObject, CustomLegendItem, ProjectInfo } from '../types';
import Konva from 'konva';

const LEGEND_CONTAINER_ID = 'apd-legend-for-export';

// --- DEL 2: FÖRBÄTTRADE IKONER FÖR RITVERKTYG ---
const createDrawingToolIcon = (shape: Konva.Shape): string => {
    const attrs = shape.getAttrs();
    const color = attrs.stroke || attrs.fill || '#000000';
    const fill = attrs.fill ? `fill="${attrs.fill}" fill-opacity="${attrs.opacity || 0.3}"` : 'fill="none"';
    const strokeWidth = attrs.strokeWidth || 2;
    const dash = attrs.dash ? `stroke-dasharray="${attrs.dash.join(' ')}"` : '';
    // Ikonerna är nu mindre (16px höga), längre (32px breda) och tunnare (stroke-width * 1.5) för bättre representation.
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 32 16">
            <line x1="2" y1="8" x2="30" y2="8" stroke="${color}" stroke-width="${strokeWidth * 1.5}" ${dash} ${fill} stroke-linecap="round" />
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

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
        img.crossOrigin = 'anonymous';
        img.src = svgDataUrl;
    });
};

// --- DEL 1: FOKUSERAD HTML-GENERERING (ENDAST FÖRTECKNING) ---
const renderLegendToHtml = async (allItems: any[]): Promise<string> => {
    const legendItemPromises = allItems.map(async (item) => {
        let iconHtml = '<div style="width: 32px; height: 16px;"></div>';
        let name = item.name || 'Okänt objekt';
        let quantity = item.quantity ? `${item.quantity} st` : '-';

        if (item.isShape) {
            const shapeIcon = createDrawingToolIcon(item.shape);
            iconHtml = `<img src="${shapeIcon}" style="width: 32px; height: 16px; display: block;" />`;
            name = item.name; // Namnet sätts nu i exportPlan-funktionen
        } else if (item.iconUrl) {
            try {
                const pngUrl = await convertSvgToPng(item.iconUrl, 24, 24);
                iconHtml = `<img src="${pngUrl}" style="width: 24px; height: 24px; display: block;" crossorigin="anonymous" />`;
            } catch (e) {
                console.error(`Failed to convert icon for ${name}:`, e);
            }
        } else if (item.color) {
             iconHtml = `<div style="width: 20px; height: 20px; border-radius: 4px; background-color: ${item.color}; margin-left: 2px;"></div>`;
        }

        return `
            <tr style="vertical-align: middle;">
                <td style="padding: 6px 4px;">${iconHtml}</td>
                <td style="padding: 6px 4px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;">${name}</td>
                <td style="padding: 6px 4px; font-size: 13px; font-weight: bold; text-align: right; color: #444;">${quantity}</td>
            </tr>
        `;
    });

    const legendItemsHtml = (await Promise.all(legendItemPromises)).join('');
    const legendTable = `<table style="width: 100%; border-collapse: collapse;"><tbody>${legendItemsHtml}</tbody></table>`;

    // Projektinformationen är bortflyttad och hanteras nu direkt i PDF-genereringen.
    return `
      <div id="${LEGEND_CONTAINER_ID}" style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #fff; padding: 20px; box-sizing: border-box; width: 340px;">
          <h2 style="font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Teckenförklaring</h2>
          ${legendTable}
      </div>`;
};


const getCanvasFromHtml = (container: HTMLElement): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const elementToRender = container.querySelector<HTMLElement>(`#${LEGEND_CONTAINER_ID}`);
        if (!elementToRender) return reject(new Error('Could not find the legend element to render.'));
        html2canvas(elementToRender, { scale: 3, useCORS: true, backgroundColor: '#ffffff' }).then(resolve, reject);
    });
};

interface ExportConfig {
    projectInfo: ProjectInfo;
    objects: APDObject[];
    customLegendItems: CustomLegendItem[];
    stageRef: React.RefObject<any>;
}

export const exportPlan = async (format: 'jpeg' | 'pdf', config: ExportConfig): Promise<{ status: 'success' | 'error', message: string }> => {
    const { projectInfo, objects, customLegendItems, stageRef } = config;
    if (!stageRef.current) return { status: 'error', message: 'Stage reference is missing.' };

    // --- DEL 3: FÖRBÄTTRAD DATASYNKRONISERING OCH NAMNGIVNING ---
    const validSymbolObjects = objects.filter(obj => obj.item && obj.item.name);
    const aggregatedSymbols = Object.values(validSymbolObjects.reduce((acc, obj) => {
        const key = obj.item!.id;
        if (!acc[key]) acc[key] = { name: obj.item!.name, iconUrl: obj.item!.iconUrl, quantity: 0 };
        acc[key].quantity!++;
        return acc;
    }, {} as { [key: string]: { name?: string, iconUrl?: string, quantity?: number } }));

    // Steg 3.1: Filtrera bort internt skräp (ankare).
    const drawnShapes = stageRef.current.find('Line, Polygon, Rect, Arrow')
        .filter((shape: Konva.Shape) => !shape.name().includes('_anchor'))
        .map((shape: Konva.Shape) => {
            // Steg 3.2: Smart och prydlig namngivning.
            let name = shape.attrs.name;
            if (!name) {
                switch (shape.getClassName()) {
                    case 'Line': name = 'Linje'; break;
                    case 'Polygon': name = 'Yta'; break;
                    case 'Rect': name = 'Rektangel'; break;
                    case 'Arrow': name = 'Pil'; break;
                    default: name = 'Ritad Form';
                }
            }
            return { isShape: true, shape: shape, name: name };
        });

    const allLegendItems = [...aggregatedSymbols, ...drawnShapes, ...customLegendItems];

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';

    try {
        document.body.appendChild(container);
        container.innerHTML = await renderLegendToHtml(allLegendItems);
        const legendCanvas = await getCanvasFromHtml(container);
        const stageImageURL = stageRef.current.toDataURL({ pixelRatio: 2 });
        
        if (format === 'jpeg') { /* ... oförändrad ... */ } 
        else { // PDF
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const pageMargin = 10;

            // --- DEL 1: NY LAYOUT MED PROJEKTINFO I SIDHUVUDET ---
            pdf.setFontSize(28);
            pdf.setTextColor(30, 41, 59);
            pdf.setFont('Helvetica', 'bold');
            pdf.text('APD-PLAN', pageMargin, pageMargin + 12);

            // Manuell placering av Projektinformation bredvid titeln.
            const infoX = pageMargin + 70; 
            const infoY = pageMargin + 4;
            pdf.setFontSize(9);
            pdf.setTextColor(80, 91, 109);
            pdf.setFont('Helvetica', 'normal');
            pdf.text(`Företag: ${projectInfo.company || '-'}`, infoX, infoY);
            pdf.text(`Projekt: ${projectInfo.projectName || '-'}`, infoX, infoY + 5);
            pdf.text(`Datum: ${new Date().toLocaleDateString('sv-SE')}`, infoX, infoY + 10);

            const legendWidth = 80;
            const spaceBetweenElements = 10;
            const availableDrawingWidth = pdfWidth - legendWidth - (pageMargin * 2) - spaceBetweenElements;
            const availableDrawingHeight = pdfHeight - (pageMargin * 2);

            const stageWidth = stageRef.current.width();
            const stageHeight = stageRef.current.height();
            const drawingAspectRatio = stageWidth / stageHeight;
            const availableAreaAspectRatio = availableDrawingWidth / availableDrawingHeight;

            let finalDrawingWidth, finalDrawingHeight;
            if (drawingAspectRatio > availableAreaAspectRatio) {
                finalDrawingWidth = availableDrawingWidth;
                finalDrawingHeight = finalDrawingWidth / drawingAspectRatio;
            } else {
                finalDrawingHeight = availableDrawingHeight;
                finalDrawingWidth = finalDrawingHeight * drawingAspectRatio;
            }

            const drawingX = pageMargin + (availableDrawingWidth - finalDrawingWidth) / 2;
            const drawingY = pageMargin + (availableDrawingHeight - finalDrawingHeight) / 2;

            pdf.addImage(stageImageURL, 'JPEG', drawingX, drawingY, finalDrawingWidth, finalDrawingHeight);

            const legendX = pdfWidth - pageMargin - legendWidth;
            const legendCanvasUrl = legendCanvas.toDataURL('image/png', 1.0);
            const legendHeight = (legendCanvas.height * legendWidth) / legendCanvas.width;
            pdf.addImage(legendCanvasUrl, 'PNG', legendX, pageMargin, legendWidth, legendHeight);

            pdf.save(`${projectInfo.projectName?.replace(/ /g, '_') || 'apd-plan'}.pdf`);
        }

        return { status: 'success', message: 'Export completed successfully.' };

    } catch (error) {
        console.error('A critical error occurred during export:', error);
        return { status: 'error', message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    } finally {
        if (container.parentNode) container.parentNode.removeChild(container);
    }
};
