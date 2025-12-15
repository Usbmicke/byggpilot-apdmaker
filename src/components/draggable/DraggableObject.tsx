
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer, Line, Rect } from 'react-konva';
import useImage from 'use-image';
import { 
    APDObject, 
    isSymbol, 
    isRectTool, 
    isLineTool, 
    isCrane, 
    isPen 
} from '../../types/index';
import CraneObject from '../canvas/CraneObject';

interface DraggableObjectProps {
    obj: APDObject;
    isSelected: boolean;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>, immediate: boolean) => void;
    isDrawing: boolean;
}

const SAFE_DIMENSION = 50;

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, isSelected, onSelect, onChange, isDrawing }) => {
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

    const width = obj.width || obj.item.width || SAFE_DIMENSION;
    const height = obj.height || obj.item.height || SAFE_DIMENSION;

    // --- FIX: Pass obj.type to isSymbol ---
    const imageUrl = isSymbol(obj.type) ? (obj.item.iconUrl || '') : '';
    const [image, imageStatus] = useImage(imageUrl, 'anonymous');

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

        const currentWidth = node.width();
        const currentHeight = node.height();

        if (isCrane(obj)) {
            const newArmLength = Math.max(20, currentWidth * scaleX);
            attrs.width = newArmLength;
            attrs.radius = newArmLength * 0.8;
        } else {
            attrs.width = Math.max(5, currentWidth * scaleX);
            attrs.height = Math.max(5, currentHeight * scaleY);
        }

        onChange(attrs, true);
    };

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

    const renderObject = () => {
        if (isCrane(obj)) {
            return <CraneObject {...commonProps} ref={shapeRef} obj={obj} explicitWidth={width} />;
        }

        // --- FIX: Pass obj.type to isSymbol ---
        if (isSymbol(obj.type)) {
            if (imageStatus !== 'loaded') {
                return (
                    <Rect 
                        {...commonProps}
                        ref={shapeRef} 
                        width={width} 
                        height={height} 
                        fill="#a0aec0"
                        stroke="#4a5568"
                        strokeWidth={2}
                    />
                );
            }
            return <KonvaImage {...commonProps} ref={shapeRef} image={image} width={width} height={height} />;
        }

        if (isRectTool(obj.type)) {
            return <Rect {...commonProps} ref={shapeRef} width={width} height={height} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeWidth} />;
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
                    tension={isPen(obj) ? 0.5 : 0} 
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
                    boundBoxFunc={(oldBox, newBox) => newBox.width < 10 ? oldBox : newBox}
                    enabledAnchors={isCrane(obj) ? ['middle-left', 'middle-right'] : undefined}
                    rotateAnchorOffset={isCrane(obj) ? 30 : undefined}
                />
            )}
        </>
    );
};

export default React.memo(DraggableObject);
