
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer, Text, Line, Rect, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import { APDObject, isSymbol, isRectTool, isLineTool, isCrane } from '../../types/index';

interface DraggableObjectProps {
    obj: APDObject;
    isSelected: boolean;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>, immediate: boolean) => void;
    onTextDblClick: () => void;
    isDrawing: boolean;
}

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, isSelected, onSelect, onChange, onTextDblClick, isDrawing }) => {
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

    const imageUrl = (isSymbol(obj.type) || isCrane(obj)) ? (obj.item.iconUrl || '') : '';
    const [image] = useImage(imageUrl, 'anonymous');

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
        const newWidth = Math.max(5, node.width() * scaleX);
        const newHeight = Math.max(5, node.height() * scaleX);

        node.scaleX(1);
        node.scaleY(1);

        let attrs: Partial<APDObject> = {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
        };

        if (isCrane(obj)) {
            attrs.radius = (newWidth / 2);
            attrs.width = newWidth;
            attrs.height = newHeight;
        } else {
            attrs.width = newWidth;
            attrs.height = newHeight;
        }

        onChange(attrs, true);
    };

    const renderObject = () => {
        const commonProps = {
            id: obj.id,
            name: obj.id,
            x: obj.x,
            y: obj.y,
            rotation: obj.rotation,
            draggable: !isDrawing, // Disable dragging when drawing
            listening: !isDrawing, // Disable events when drawing so clicks pass through to stage
            onClick: onSelect,
            onTap: onSelect,
            onDragEnd: handleDragEnd,
            onTransformEnd: handleTransformEnd,
        };

        if (isCrane(obj)) {
            // Use standard image rendering but maintain ID/rotation
            return <KonvaImage {...commonProps} ref={shapeRef} image={image} width={obj.width} height={obj.height} />;
        }

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
                            listening={false}
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
                            listening={false}
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
                    onTransformEnd={undefined}
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
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

export default React.memo(DraggableObject);
