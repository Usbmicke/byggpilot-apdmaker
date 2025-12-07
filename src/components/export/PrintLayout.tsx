
import React, { forwardRef } from 'react';
import { APDObject, CustomLegendItem, ProjectInfo } from '../../types';
import LegendForPrint from './LegendForPrint';

interface PrintLayoutProps {
    projectInfo: ProjectInfo;
    background: any;
    objects: APDObject[];
    customLegendItems: CustomLegendItem[];
    canvasImage: string;
}

const PrintLayout = forwardRef<HTMLDivElement, PrintLayoutProps>(({ projectInfo, background, objects, customLegendItems, canvasImage }, ref) => {

    return (
        <div ref={ref} style={{ width: '420mm', height: '297mm', position: 'absolute', left: '-420mm', top: 0, zIndex: -1, overflow: 'hidden', backgroundColor: 'white' }}>
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                fontFamily: 'sans-serif',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10mm',
                    borderBottom: '1px solid #ccc',
                    flexShrink: 0,
                }}>
                    <h1 style={{ fontSize: '12mm', fontWeight: 'bold', margin: 0 }}>{projectInfo.projectName || 'APD-Plan'}</h1>
                    <img src="/assets/ikoner/Byggpilotlogga_svart.png" alt="Logo" style={{ height: '15mm' }} />
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                    {/* Canvas Image */}
                    <div style={{
                        flexGrow: 1,
                        padding: '10mm',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderRight: '1px solid #ccc',
                    }}>
                        <img src={canvasImage} alt="Ritning" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>

                    {/* Legend */}
                    <div style={{ width: '100mm', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <LegendForPrint 
                            projectInfo={projectInfo}
                            objects={objects}
                            customItems={customLegendItems}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '5mm 10mm',
                    borderTop: '1px solid #ccc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '3.5mm',
                    flexShrink: 0,
                }}>
                    <span>Skapad med ByggPilot APD-Maker</span>
                    <span>{projectInfo.address || 'Adress saknas'}</span>
                    <span>{new Date().toLocaleDateString('sv-SE')}</span>
                </div>
            </div>
        </div>
    );
});

export default PrintLayout;
