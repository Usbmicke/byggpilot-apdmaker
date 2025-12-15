
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer, Text, Line, Rect, Group } from 'react-konva';
import useImage from 'use-image';
import { APDObject, isSymbol, isRectTool, isLineTool, isCrane } from '../../types/index';
import CraneObject from '../canvas/CraneObject';

interface DraggableObjectProps {
    obj: APDObject;
    isSelected: boolean;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>, immediate: boolean) => void;
    isDrawing: boolean;
}

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, isSelected, onSelect, onChange, isDrawing }) => {
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

    const imageUrl = (isSymbol(obj.type) && !isCrane(obj)) ? (obj.item.iconUrl || '') : '';
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
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        let attrs: Partial<APDObject> = {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
        };

        if (isCrane(obj)) {
            const newArmLength = Math.max(20, (obj.width || 100) * scaleX);
            attrs.width = newArmLength;
            attrs.radius = newArmLength * 0.8; 
        } else {
            attrs.width = Math.max(5, node.width() * scaleX);
            attrs.height = Math.max(5, node.height() * scaleY);
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
            draggable: !isDrawing,
            listening: !isDrawing,
            onClick: onSelect,
            onTap: onSelect,
            onDragEnd: handleDragEnd,
            onTransformEnd: handleTransformEnd,
            visible: obj.visible !== false,
        };

        if (isCrane(obj)) {
            return <CraneObject {...commonProps} ref={shapeRef} obj={obj} />;
        }

        if (isSymbol(obj.type)) {
            return <KonvaImage {...commonProps} ref={shapeRef} image={image} width={obj.width} height={obj.height} />;
        }

        if (isRectTool(obj.type)) {
            // The only remaining rect tool is 'schakt'
            return <Rect {...commonProps} ref={shapeRef} width={obj.width} height={obj.height} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeWidth} />;
        }

        if (isLineTool(obj.type)) {
            return <Line {...commonProps} onTransformEnd={undefined} ref={shapeRef} points={obj.points} stroke={obj.stroke || '#000000'} strokeWidth={obj.strokeWidth || 2} dash={obj.dash} tension={obj.type === 'pen' ? 0.5 : 0} lineCap="round" lineJoin="round" />;
        }

        return null;
    };

    return (
        <>
            {renderObject()}
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => newBox.width < 10 ? oldBox : newBox}
                    enabledAnchors={isCrane(obj) ? ['middle-left', 'middle-right'] : undefined}
                    rotateAnchorOffset={isCrane(obj) ? 30 : undefined}
                />
            )}
        </>
    );
};

export default React.memo(DraggableObject);
