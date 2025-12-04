
import React, { useRef, useEffect } from 'react';
import { Text, Circle, Line, Rect, Group as KonvaGroup } from 'react-konva';
import { APDObject, isCrane, isText, isSchakt, isLineTool, isPen } from '../../types/index';

interface DraggableObjectProps {
    obj: APDObject;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>) => void;
    onDragStart: () => void;
    onTextDblClick: () => void;
    // isSelected prop is no longer needed for managing the Transformer here
}

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, onSelect, onChange, onDragStart, onTextDblClick }) => {
    const shapeRef = useRef<any>(null);

    // KORRIGERING: Transformer och dess useEffect har tagits bort helt härifrån.
    // Ansvaret ligger nu enbart på CanvasPanel.tsx

    const commonProps = {
        ref: shapeRef, // Konsekvent ref för alla objekt
        id: obj.id,
        name: obj.id, 
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        scaleX: obj.scaleX || 1, // Använd objektets skala
        scaleY: obj.scaleY || 1, // Använd objektets skala
        width: obj.width,
        height: obj.height,
        visible: obj.visible !== false,
        draggable: true,
        onClick: onSelect,
        onTap: onSelect,
        onDragStart: onDragStart,
        onDragEnd: (e: any) => {
            // Endast positionen uppdateras vid drag
            onChange({ x: e.target.x(), y: e.target.y() });
        },
        // KORRIGERING: onTransformEnd och onTransformStart har tagits bort härifrån.
        // Detta hanteras nu centralt i CanvasPanel.
    };

    const renderContent = () => {
        const item = obj.item;

        if (isText(obj)) {
            // Textobjekt hanterar sin egen storlek via fontSize, inte width/height
            const { width, height, ...textProps } = commonProps;
            return <Text {...textProps} text={obj.text || 'Text'} fontSize={obj.fontSize || 20} fill={obj.fill || '#000000'} padding={5} onDblClick={onTextDblClick} onDblTap={onTextDblClick} />;
        }
        
        if (isLineTool(obj.type)) {
            // Linjer har inga dimensioner eller skala, endast punkter
            const { width, height, scaleX, scaleY, ...lineProps } = commonProps;
            return <Line {...lineProps} points={obj.points} stroke={item.stroke || '#000000'} strokeWidth={item.strokeWidth || 5} dash={item.dash} tension={isPen(obj) ? 0.5 : 0} lineCap="round" hitStrokeWidth={20} />;
        }

        // För alla formbaserade objekt (Rect, Crane etc.)
        const shapeProps = {
            ...commonProps,
            offsetX: commonProps.width / 2,
            offsetY: commonProps.height / 2,
            fill: item.fill || '#D3D3D3',
            stroke: item.stroke || '#000000',
            strokeWidth: 2,
        };

        if (isCrane(obj)) {
            const radius = (obj.width || 200) / 2;
            // Vi kan inte använda shapeProps direkt här pga KonvaGroup
            const {offsetX, offsetY, fill, stroke, strokeWidth, ...groupProps} = shapeProps;
            return (
                <KonvaGroup {...groupProps}>
                    <Circle radius={radius} stroke="rgba(239, 68, 68, 0.7)" strokeWidth={2} dash={[10, 5]} listening={false}/>
                    <Rect x={-10} y={-10} width={20} height={20} fill="#FFD700" stroke="#DAA520" strokeWidth={1}/>
                    <Line points={[0, 0, 0, -radius]} stroke="#FFD700" strokeWidth={5} />
                </KonvaGroup>
            );
        }

        if (isSchakt(obj)) {
            return <Rect {...shapeProps} dash={[10, 5]} />;
        }

        return <Rect {...shapeProps} />;
    };

    // KORRIGERING: Endast objektet renderas. Transformer-komponenten är borttagen.
    return <>{renderContent()}</>;
};

export default DraggableObject;
