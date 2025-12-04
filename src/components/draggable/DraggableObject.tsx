
import React, { useRef, useEffect } from 'react';
import { Text, Circle, Line, Rect, Group as KonvaGroup, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { APDObject, isCrane, isText, isSchakt, isLineTool, isPen, isSymbol } from '../../types/index';

interface DraggableObjectProps {
    obj: APDObject;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>) => void;
    onDragStart: () => void;
    onTextDblClick: () => void;
}

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, onSelect, onChange, onDragStart, onTextDblClick }) => {
    const shapeRef = useRef<any>(null);
    const [image] = useImage(isSymbol(obj) ? obj.item.iconUrl || '' : '', 'anonymous');

    // KORRIGERING: Säkerställ att width och height alltid är numeriska värden.
    const safeWidth = obj.width || obj.item?.width || 50; // Fallback till 50 om allt saknas
    const safeHeight = obj.height || obj.item?.height || 50;

    const commonProps = {
        ref: shapeRef,
        id: obj.id,
        name: obj.id, 
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        scaleX: obj.scaleX || 1,
        scaleY: obj.scaleY || 1,
        width: safeWidth,
        height: safeHeight,
        visible: obj.visible !== false,
        draggable: true,
        onClick: onSelect,
        onTap: onSelect,
        onDragStart: onDragStart,
        onDragEnd: (e: any) => {
            onChange({ x: e.target.x(), y: e.target.y() });
        },
    };

    const renderContent = () => {
        const item = obj.item;

        if (isSymbol(obj)) {
            return <KonvaImage {...commonProps} image={image} offsetX={safeWidth / 2} offsetY={safeHeight / 2} />;
        }

        if (isText(obj)) {
            const { width, height, ...textProps } = commonProps;
            return <Text {...textProps} text={obj.text || 'Text'} fontSize={obj.fontSize || 20} fill={obj.fill || '#000000'} padding={5} onDblClick={onTextDblClick} onDblTap={onTextDblClick} />;
        }
        
        if (isLineTool(obj.type)) {
            const { width, height, scaleX, scaleY, ...lineProps } = commonProps;
            return <Line {...lineProps} points={obj.points} stroke={item.stroke || '#000000'} strokeWidth={item.strokeWidth || 5} dash={item.dash} tension={isPen(obj) ? 0.5 : 0} lineCap="round" hitStrokeWidth={20} />;
        }

        const shapeProps = {
            ...commonProps,
            // KORRIGERING: Använder säkra värden för att förhindra NaN.
            offsetX: safeWidth / 2,
            offsetY: safeHeight / 2,
            fill: item.fill || '#D3D3D3',
            stroke: item.stroke || '#000000',
            strokeWidth: 2,
        };

        if (isCrane(obj)) {
            const radius = safeWidth / 2;
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

    return <>{renderContent()}</>;
};

export default DraggableObject;
