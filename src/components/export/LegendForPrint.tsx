
import React from 'react';
import { APDObject, CustomLegendItem, ProjectInfo, isLineTool } from '../../types';
import { findIcon } from '../../utils/findIcon';

interface LegendForPrintProps {
    projectInfo: ProjectInfo;
    objects: APDObject[];
    customItems: CustomLegendItem[];
}

const LegendForPrint: React.FC<LegendForPrintProps> = ({ projectInfo, objects, customItems }) => {

    const groupedObjects = objects.reduce((acc, obj) => {
        const key = obj.item.name; // Use name as the primary key for grouping
        if (!acc[key]) {
            acc[key] = { ...obj, quantity: 0 }; // Store the whole object to get all properties
        }
        acc[key].quantity += obj.quantity || 1;
        return acc;
    }, {} as Record<string, APDObject>);

    const allItems = Object.values(groupedObjects).map(item => {
        const ReactIcon = findIcon(item.type);
        let iconDisplay = null;

        if (isLineTool(item.type)) {
            // Create a visually accurate SVG for line tools
            iconDisplay = (
                <svg width="24" height="12" viewBox="0 0 24 12" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <line
                        x1="0" y1="6" x2="24" y2="6"
                        stroke={item.stroke || '#000'}
                        strokeWidth={item.strokeWidth ? item.strokeWidth / 2 : 2} // Scale down for legend
                        strokeDasharray={item.dash ? item.dash.join(' ') : 'none'}
                    />
                </svg>
            );
        } else if (item.item?.iconUrl) {
            // Use the image if available
            iconDisplay = <img src={item.item.iconUrl} alt={item.item.name} style={{ height: '1.2em', marginRight: '0.5em', verticalAlign: 'middle' }} />;
        } else if (ReactIcon) {
            // Fallback to React-based icon from library
            iconDisplay = <span style={{ marginRight: '0.5em', verticalAlign: 'middle', display: 'inline-flex' }}>{ReactIcon}</span>
        } else {
            // Generic fallback for things like 'schakt'
            iconDisplay = <span style={{ display: 'inline-block', width: '0.8em', height: '0.8em', backgroundColor: item.fill || 'gray', marginRight: '0.5em', verticalAlign: 'middle' }}></span>;
        }

        return {
            id: item.item.id || item.type, // Pass ID for filtering
            name: item.item.name, // Ensure we use the correct item name
            quantity: item.quantity,
            icon: iconDisplay
        };
    });

    const renderTable = (items: any[], title: string) => (
        <div style={{ marginBottom: '8mm' }}>
            <h4 style={{ fontSize: '4.5mm', fontWeight: 'bold', margin: '0 0 2mm 0', borderBottom: '0.5px solid #333' }}>{title}</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '3.5mm' }}>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={`${title}-${index}`}>
                            <td style={{ padding: '1mm', display: 'flex', alignItems: 'center', borderBottom: '0.5px solid #eee' }}>
                                {item.icon}
                                <span>{item.name}</span>
                            </td>
                            <td style={{ padding: '1mm', textAlign: 'right', borderBottom: '0.5px solid #eee' }}>{`${item.quantity} st`}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const symbolItems = allItems.filter(item => !customItems.some(c => c.id === item.id) && item.name);

    return (
        <div style={{ padding: '5mm', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
            <div style={{ flexShrink: 0, marginBottom: '5mm', borderBottom: '0.5px solid #333', paddingBottom: '3mm' }}>
                <h3 style={{ fontSize: '6mm', margin: 0, fontWeight: 'bold' }}>PROJEKTINFORMATION</h3>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Företag:</strong> {projectInfo.company || '-'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Projekt:</strong> {projectInfo.projectName || '-'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Projektnummer:</strong> {projectInfo.projectId || '-'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Ritad av:</strong> {projectInfo.author || '-'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Datum:</strong> {projectInfo.date || '-'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Revision:</strong> {projectInfo.revision || '-'}</p>
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                <h3 style={{ fontSize: '6mm', margin: '0 0 4mm 0', fontWeight: 'bold' }}>TECKENFÖRKLARING</h3>
                {renderTable(symbolItems, 'Symboler & Objekt')}
                {customItems.length > 0 && renderTable(customItems, 'Anpassad Förteckning')}
            </div>
        </div>
    );
};

export default LegendForPrint;
