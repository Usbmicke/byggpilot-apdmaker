
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer, Text, Line } from 'react-konva';
import useImage from 'use-image';
import { APDObject, isSymbol, isTextTool, isLineTool } from '../../types/index';

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
            width: node.width() * scaleX,
            height: node.height() * scaleY,
            scaleX: 1,
            scaleY: 1,
        }, true);
    };

    const renderObject = () => {
        const commonProps = {
            id: obj.id,
            x: obj.x, y: obj.y,
            rotation: obj.rotation,
            draggable: true,
            onClick: onSelect, onTap: onSelect,
            onDragEnd: handleDragEnd,
            onTransformEnd: handleTransformEnd,
        };

        if (isSymbol(obj.type)) {
            return <KonvaImage {...commonProps} ref={shapeRef} image={image} width={obj.width} height={obj.height} onDblClick={onTextDblClick} />;
        }
        
        if (isTextTool(obj.type)) {
            return (
                <Text 
                    {...commonProps}
                    ref={shapeRef}
                    text={obj.text}
                    fontSize={obj.fontSize}
                    fontFamily={obj.fontFamily}
                    fill={obj.fill}
                    width={obj.width}
                    height={obj.height}
                    padding={obj.padding}
                    align={obj.align}
                    onDblClick={onTextDblClick}
                    onDblTap={onTextDblClick}
                />
            );
        }

        if (isLineTool(obj.type)) {
            return (
                <Line
                    {...commonProps}
                    ref={shapeRef}
                    points={obj.points}
                    stroke={obj.stroke || '#000000'} // KORRIGERING: Läser från obj.stroke
                    strokeWidth={obj.strokeWidth || 2} // KORRIGERING: Läser från obj.strokeWidth
                    dash={obj.dash} // KORRIGERING: Läser från obj.dash
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
                    boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox}
                    anchorStroke="#007bff" anchorFill="#fff" anchorSize={10} borderStroke="#007bff" borderDash={[6, 2]}
                    rotateEnabled={!isLineTool(obj.type)} 
                />
            )}
        </>
    );
};

export default DraggableObject;
