
import React from 'react';
import { APDObject, CustomLegendItem, ProjectInfo } from '../../types';
import { LIBRARY_CATEGORIES } from '../../constants/libraryItems';

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

    const allItems = Object.values(groupedObjects).map(item => ({
        ...item,
        name: item.name,
        icon: item.iconUrl ? <img src={item.iconUrl} alt={item.name} style={{ height: '1em', marginRight: '0.5em' }} /> : null
    }));

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
                            <td style={{ padding: '1mm', textAlign: 'right', borderBottom: '0.5px solid #eee' }}>{item.quantity} st</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const symbolItems = allItems.filter(item => !customItems.some(c => c.id === item.id));

    return (
        <div style={{ padding: '5mm', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexShrink: 0, marginBottom: '5mm' }}>
                <h3 style={{ fontSize: '6mm', margin: 0, fontWeight: 'bold' }}>Projektinformation</h3>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Adress:</strong> {projectInfo.address || 'Ej specificerad'}</p>
                <p style={{ fontSize: '4mm', margin: '2mm 0 0 0' }}><strong>Kontakt:</strong> {projectInfo.contact || 'Ej specificerad'}</p>
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                <h3 style={{ fontSize: '6mm', margin: '0 0 4mm 0', fontWeight: 'bold' }}>Teckenförklaring</h3>
                {renderTable(symbolItems, 'Symboler')}
                {customItems.length > 0 && renderTable(customItems, 'Anpassad Förteckning')}
            </div>
        </div>
    );
};

export default LegendForPrint;
