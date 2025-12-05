
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer, Text, Line, Rect, Group } from 'react-konva';
import useImage from 'use-image';
import { APDObject, isSymbol, isRectTool, isLineTool } from '../../types/index';

interface DraggableObjectProps {
    obj: APDObject;
    isSelected: boolean;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>, immediate: boolean) => void;
    onTextDblClick: () => void;
}

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, isSelected, onSelect, onChange, onTextDblClick }) => {
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();
    const [image] = useImage(isSymbol(obj.type) ? obj.item.iconUrl : '', 'anonymous');

    useEffect(() => {
        if (isSelected && trRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const handleDragEnd = (e: any) => {
        onChange({ x: e.target.x(), y: e.target.y() }, true);
    };

    const handleTransformEnd = () => {
        const node = shapeRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
        }, true);
    };

    const renderObject = () => {
        const commonProps = {
            id: obj.id,
            name: obj.id, // Used for finding node
            x: obj.x,
            y: obj.y,
            rotation: obj.rotation,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            draggable: !isSelected, // Disable drag when selected to use transformer
            visible: obj.visible ?? true, // Respect the visible prop, default to true
            onClick: onSelect,
            onTap: onSelect,
            onDragEnd: handleDragEnd,
            onTransformEnd: handleTransformEnd,
        };

        if (isSymbol(obj.type)) {
            return <KonvaImage {...commonProps} ref={shapeRef} image={image} width={obj.width} height={obj.height} onDblClick={onTextDblClick} onDblTap={onTextDblClick} />;
        }
        
        if (isRectTool(obj.type)) {
            if (obj.type === 'text') {
                return (
                    <Group
                        {...commonProps}
                        ref={shapeRef}
                        width={obj.width}
                        height={obj.height}
                        onDblClick={onTextDblClick}
                        onDblTap={onTextDblClick}
                    >
                        <Rect
                            width={obj.width}
                            height={obj.height}
                            fill="rgba(255, 255, 255, 0.9)"
                            stroke="#000"
                            strokeWidth={0.5}
                            listening={false} // Events should be handled by the Group
                        />
                        <Text
                            text={obj.text}
                            fontSize={obj.fontSize}
                            fontFamily={obj.fontFamily}
                            fill={obj.fill}
                            width={obj.width}
                            height={obj.height}
                            padding={obj.padding}
                            align={obj.align}
                            verticalAlign="middle"
                            listening={false} // Events should be handled by the Group
                        />
                    </Group>
                );
            } else if (obj.type === 'schakt') {
                return (
                    <Rect
                        {...commonProps}
                        ref={shapeRef}
                        width={obj.width}
                        height={obj.height}
                        fill={obj.fill}
                        stroke={obj.stroke}
                        strokeWidth={obj.strokeWidth}
                    />
                );
            }
        }

        if (isLineTool(obj.type)) {
            return (
                <Line
                    {...commonProps}
                    onTransformEnd={undefined} // Lines are not transformable in this way
                    ref={shapeRef}
                    points={obj.points}
                    stroke={obj.stroke || '#000000'} 
                    strokeWidth={obj.strokeWidth || 2}
                    dash={obj.dash}
                    tension={obj.type === 'pen' ? 0.5 : 0}
                    lineCap="round"
                    lineJoin="round"
                />
            );
        }

        return null;
    };

    return (
        <>
            {renderObject()}
        </>
    );
};

export default DraggableObject;
