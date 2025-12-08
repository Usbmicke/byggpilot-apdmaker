
import React from 'react';
import { APDObject, CustomLegendItem, ProjectInfo } from '../../types';

interface LegendForPrintProps {
    projectInfo: ProjectInfo;
    objects: APDObject[];
    customItems: CustomLegendItem[];
}

const LegendForPrint: React.FC<LegendForPrintProps> = ({ projectInfo, objects, customItems }) => {

    const groupedObjects = objects.reduce((acc, obj) => {
        const key = obj.item.id || obj.type;
        if (!acc[key]) {
            acc[key] = { ...obj.item, quantity: 0 };
        }
        acc[key].quantity += obj.quantity;
        return acc;
    }, {} as { [key: string]: any });

    const allItems = Object.values(groupedObjects).map(item => {
        let icon = null;
        if (item.iconUrl) {
            icon = <img src={item.iconUrl} alt={item.name} style={{ height: '1em', marginRight: '0.5em', verticalAlign: 'middle' }} />;
        } else if (item.type === 'fence') {
            icon = <span style={{ display: 'inline-block', width: '1em', height: '0.2em', backgroundColor: item.stroke || '#000', marginRight: '0.5em', verticalAlign: 'middle' }}></span>;
        } else if (item.type === 'walkway') {
            icon = <span style={{ display: 'inline-block', width: '1em', height: '0.2em', border: '1px dashed #000', marginRight: '0.5em', verticalAlign: 'middle' }}></span>;
        } else if (item.type === 'schakt') {
            icon = <span style={{ display: 'inline-block', width: '0.8em', height: '0.8em', backgroundColor: item.fill || 'brown', marginRight: '0.5em', verticalAlign: 'middle' }}></span>;
        } else {
            icon = <span style={{ display: 'inline-block', width: '0.5em', height: '0.5em', borderRadius: '50%', backgroundColor: 'gray', marginRight: '0.5em', verticalAlign: 'middle' }}></span>;
        }

        return {
            ...item,
            name: item.name,
            icon: icon
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
                            <td style={{ padding: '1mm', textAlign: 'right', borderBottom: '0.5px solid #eee' }}>{item.quantity ? `${item.quantity} st` : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const symbolItems = allItems.filter(item => !customItems.some(c => c.id === item.id));

    return (
        <div style={{ padding: '5mm', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
            <div style={{ flexShrink: 0, marginBottom: '5mm', borderBottom: '0.5px solid #333', paddingBottom: '3mm' }}>
                <h3 style={{ fontSize: '6mm', margin: 0, fontWeight: 'bold' }}>PROJEKTINFORMATION</h3>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Företag:</strong> {projectInfo.company || '-'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Projekt:</strong> {projectInfo.projectName || 'Nytt ByggPilot Projekt'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>ID:</strong> {projectInfo.projectId || '-'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Datum:</strong> {new Date().toISOString().slice(0, 10)}</p>
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                <h3 style={{ fontSize: '6mm', margin: '0 0 4mm 0', fontWeight: 'bold' }}>TECKENFÖRKLARING</h3>
                {renderTable(symbolItems, 'Symboler')}
                {customItems.length > 0 && renderTable(customItems, 'Anpassad Förteckning')}
            </div>
        </div>
    );
};

export default LegendForPrint;
