
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { APDObject, CustomLegendItem, ProjectInfo, isLineTool, isRectTool, isBuilding } from '../types';

const LEGEND_CONTAINER_ID = 'apd-legend-for-export-container';

const createDrawingToolIcon = (item: any): string => {
    const strokeColor = item.stroke || '#333';
    const fillColor = item.fill || '#ccc';
    const strokeWidth = 1.5;
    const dash = item.dash ? `stroke-dasharray="${item.dash.join(' ')}"` : '';

    let svgContent = '';

    if (isRectTool(item.type) || isBuilding({ type: item.type } as APDObject)) {
        svgContent = `
            <rect 
                x="3" y="3" 
                width="26" height="10" 
                fill="${fillColor}" 
                fill-opacity="0.7" 
                stroke="${strokeColor}" 
                stroke-width="${strokeWidth}" 
            />
        `;
    }
    else if (isLineTool(item.type)) {
        svgContent = `
            <line 
                x1="2" y1="8" 
                x2="30" y2="8" 
                stroke="${strokeColor}" 
                stroke-width="${strokeWidth * 1.5}" 
                ${dash} 
                stroke-linecap="round"
            />
        `;
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 32 16">
            ${svgContent}
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const convertSvgToPng = (svgDataUrl: string, width = 32, height = 32): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Kunde inte skapa canvas-kontext'));
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(new Error(`Fel vid SVG-laddning: ${err}`));
        img.crossOrigin = 'anonymous';
        img.src = svgDataUrl;
    });
};

const renderLegendToHtml = async (allItems: any[]): Promise<string> => {
    const legendItemPromises = allItems.map(async (item) => {
        let iconHtml = '<div style="width: 32px; height: 24px;"></div>';
        let name = item.name || 'Okänt objekt';
        let quantity = item.quantity ? `${item.quantity} st` : '-';

        if (isLineTool(item.type) || isRectTool(item.type) || isBuilding({ type: item.type } as APDObject)) {
            const shapeIcon = createDrawingToolIcon(item);
            iconHtml = `<img src="${shapeIcon}" style="width: 32px; height: 16px; display: block;" />`;
        } else if (item.iconUrl) {
            try {
                const pngUrl = await convertSvgToPng(item.iconUrl, 24, 24);
                iconHtml = `<img src="${pngUrl}" style="width: 24px; height: 24px; display: block;" crossorigin="anonymous" />`;
            } catch (e) {
                console.error(`Kunde inte konvertera ikon för ${name}:`, e);
            }
        }

        return `
            <tr style="vertical-align: middle;">
                <td style="padding: 4px;">${iconHtml}</td>
                <td style="padding: 4px; font-size: 13px; white-space: nowrap; max-width: 170px; overflow: hidden; text-overflow: ellipsis;">${name}</td>
                <td style="padding: 4px; font-size: 13px; text-align: right;">${quantity}</td>
            </tr>
        `;
    });

    const legendItemsHtml = (await Promise.all(legendItemPromises)).join('');
    const legendTable = `<table style="width: 100%; border-collapse: collapse;"><tbody>${legendItemsHtml}</tbody></table>`;

    return `
      <div id="${LEGEND_CONTAINER_ID}" style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #fff; padding: 20px; box-sizing: border-box; width: 340px;">
          <h2 style="font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">TECKENFÖRKLARING</h2>
          ${legendTable}
      </div>`;
};

const getCanvasFromHtml = (container: HTMLElement): Promise<HTMLCanvasElement> => {
    return html2canvas(container.querySelector<HTMLElement>(`#${LEGEND_CONTAINER_ID}`)!, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
    });
};

// REFAKTORERING: stageRef borttagen, ersatt med en generell `image` property.
export interface ExportConfig {
    projectInfo: ProjectInfo;
    objects: APDObject[];
    customLegendItems: CustomLegendItem[];
    image: {
        url: string;
        width: number;
        height: number;
    };
}

export const exportPlan = async (format: 'jpeg' | 'pdf', config: ExportConfig): Promise<{ status: 'success' | 'error', message: string }> => {
    const { projectInfo, objects, customLegendItems, image } = config;
    if (!image || !image.url) return { status: 'error', message: 'Bilddata saknas.' };

    const aggregatedItems = Object.values(objects.reduce((acc, obj) => {
        const key = obj.item.name;
        if (!key) return acc;

        if (!acc[key]) {
            acc[key] = {
                ...obj,
                name: obj.item.name,
                iconUrl: obj.item.iconUrl,
                quantity: 0,
            };
        }
        acc[key].quantity += (obj.quantity || 1);
        return acc;
    }, {} as { [key: string]: any }));

    const allLegendItems = [...aggregatedItems, ...customLegendItems]
        .filter(item => item && item.name)
        .sort((a, b) => a.name.localeCompare(b.name));

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';

    try {
        // --- PREPARE LEGEND & INFO ---
        document.body.appendChild(container);
        container.innerHTML = await renderLegendToHtml(allLegendItems);
        
        let legendCanvas: HTMLCanvasElement | null = null;
        try {
            legendCanvas = await getCanvasFromHtml(container);
        } catch (e) {
            console.warn("Kunde inte generera teckenförklaring:", e);
            // Proceed without legend if it fails
        }

        if (format === 'jpeg') {
            // --- JPEG COMPOSITING (Drawing + Legend) ---
            const margin = 20;
            const infoWidth = 350; // Width for side panel (Info + Legend)
            const totalWidth = image.width + infoWidth + (margin * 3);
            const totalHeight = Math.max(image.height, 800) + (margin * 2);

            const canvas = document.createElement('canvas');
            canvas.width = totalWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // 1. Background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, totalWidth, totalHeight);

                // 2. Main Drawing
                const drawingImg = new Image();
                drawingImg.src = image.url;
                await new Promise((resolve) => { drawingImg.onload = resolve; });
                ctx.drawImage(drawingImg, margin, margin);

                // 3. Side Panel (Project Info Text)
                const infoX = image.width + (margin * 2);
                let currentY = margin + 40;

                ctx.fillStyle = '#1e293b'; // Slate 800
                ctx.font = 'bold 24px Arial, sans-serif';
                ctx.fillText('APD-PLAN', infoX, currentY);
                
                currentY += 40;
                ctx.font = '14px Arial, sans-serif';
                ctx.fillStyle = '#475569'; // Slate 600
                const lineHeight = 20;

                const drawInfoLine = (label: string, value: string | undefined) => {
                    ctx.fillText(`${label}: ${value || '-'}`, infoX, currentY);
                    currentY += lineHeight;
                };

                drawInfoLine('Företag', projectInfo.company);
                drawInfoLine('Projekt', projectInfo.projectName);
                drawInfoLine('Projekt ID', projectInfo.projectId);
                drawInfoLine('Datum', projectInfo.date);
                drawInfoLine('Rev', projectInfo.revision);

                // 4. Legend Image
                if (legendCanvas) {
                    currentY += 40;
                    ctx.font = 'bold 16px Arial, sans-serif';
                    ctx.fillStyle = '#64748b';
                    ctx.fillText('TECKENFÖRKLARING', infoX, currentY);
                    currentY += 20;
                    ctx.drawImage(legendCanvas, infoX, currentY);
                }

                // Download Composite
                const link = document.createElement('a');
                link.download = `${projectInfo.projectName?.replace(/ /g, '_') || 'apd-plan'}.jpeg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
                return { status: 'success', message: 'Exporten är klar.' };
            }
        }

        // --- PDF Generation ---
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const pageMargin = 10;

        pdf.setFontSize(28);
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('APD-PLAN', pageMargin, pageMargin + 12);

        const infoX = pageMargin + 85;
        const infoY = pageMargin + 4;
        const lineHeight = 5;
        pdf.setFontSize(9);
        pdf.setTextColor(80, 91, 109);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(`Företag: ${projectInfo.company || '-'}`, infoX, infoY);
        pdf.text(`Projekt: ${projectInfo.projectName || '-'}`, infoX, infoY + lineHeight);
        pdf.text(`Projektnummer: ${projectInfo.projectId || '-'}`, infoX, infoY + lineHeight * 2);
        pdf.text(`Ritad av: ${projectInfo.author || '-'}`, infoX, infoY + lineHeight * 3);
        pdf.text(`Datum: ${projectInfo.date || '-'}`, infoX + 70, infoY);
        pdf.text(`Revision: ${projectInfo.revision || '-'}`, infoX + 70, infoY + lineHeight);

        const legendWidth = 65; // Slightly wider for safety
        const spaceBetween = 5;
        const drawingAreaWidth = pdfWidth - legendWidth - (pageMargin * 2) - spaceBetween;
        const drawingAreaHeight = pdfHeight - (pageMargin * 2) - 20;

        // Use Aspect Ratio scaling to fit image
        const scale = Math.min(drawingAreaWidth / image.width, drawingAreaHeight / image.height);
        const finalDrawingWidth = image.width * scale;
        const finalDrawingHeight = image.height * scale;

        const drawingX = pageMargin + (drawingAreaWidth - finalDrawingWidth) / 2;
        const drawingY = pageMargin + 20 + (drawingAreaHeight - finalDrawingHeight) / 2;

        pdf.addImage(image.url, 'PNG', drawingX, drawingY, finalDrawingWidth, finalDrawingHeight, undefined, 'FAST');

        if (legendCanvas) {
            const legendX = pdfWidth - pageMargin - legendWidth;
            const legendCanvasUrl = legendCanvas.toDataURL('image/png', 1.0);
            // Calculate height maintaining aspect ratio
            const legendHeight = (legendCanvas.height * legendWidth) / legendCanvas.width;
            pdf.addImage(legendCanvasUrl, 'PNG', legendX, pageMargin + 20, legendWidth, legendHeight);
        }

        pdf.save(`${projectInfo.projectName?.replace(/ /g, '_') || 'apd-plan'}.pdf`);

        return { status: 'success', message: 'Exporten är klar.' };

    } catch (error) {
        console.error('Ett kritiskt fel inträffade vid export:', error);
        return { status: 'error', message: error instanceof Error ? error.message : 'Ett okänt fel inträffade.' };
    } finally {
        if (container.parentNode) container.parentNode.removeChild(container);
    }
};
