
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Line, Rect } from 'react-konva';
import useImage from 'use-image';
import { APDObject, isSymbol, isRectTool, isLineTool, isCrane, isPen } from '../../types/index';
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

    const width = obj.width || obj.item.width || SAFE_DIMENSION;
    const height = obj.height || obj.item.height || SAFE_DIMENSION;

    const imageUrl = isSymbol(obj.type) ? (obj.item.iconUrl || '') : '';
    const [image, imageStatus] = useImage(imageUrl, 'anonymous');

    const handleDragEnd = (e: any) => {
        onChange({ x: e.target.x(), y: e.target.y() }, true);
    };

    const handleTransformEnd = () => {
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const newRotation = node.rotation();

        // Reset visual scaling on the node; it will be reapplied via props.
        node.scaleX(1);
        node.scaleY(1);

        const attrs: Partial<APDObject> = {
            x: node.x(),
            y: node.y(),
            rotation: newRotation,
        };

        if (isLineTool(obj)) {
            // B-1 / UX-2 Fix: Bake scaling transformation into the points array
            const originalPoints = obj.points || [];
            const scaledPoints = [];
            for (let i = 0; i < originalPoints.length; i += 2) {
                scaledPoints.push(originalPoints[i] * scaleX, originalPoints[i+1] * scaleY);
            }
            attrs.points = scaledPoints;
            
            // Recalculate width/height from the newly scaled points
            const xCoords = scaledPoints.filter((_, i) => i % 2 === 0);
            const yCoords = scaledPoints.filter((_, i) => i % 2 !== 0);
            attrs.width = Math.max(...xCoords) - Math.min(...xCoords);
            attrs.height = Math.max(...yCoords) - Math.min(...yCoords);

        } else if (isCrane(obj)) {
            const newArmLength = Math.max(20, node.width() * scaleX);
            attrs.width = newArmLength;
            attrs.radius = newArmLength * 0.8;
        } else {
            // Default for Rects and Images
            attrs.width = Math.max(5, node.width() * scaleX);
            attrs.height = Math.max(5, node.height() * scaleY);
        }
        
        onChange(attrs, true);
    };

    const commonProps = {
        id: obj.id,
        name: obj.id,
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        draggable: !isDrawing && isSelected, // Make objects draggable only when selected
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

        if (isSymbol(obj.type)) {
            if (imageStatus !== 'loaded') {
                return <Rect {...commonProps} ref={shapeRef} width={width} height={height} fill="#a0aec0" stroke="#4a5568" strokeWidth={2} />;
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
                    // onTransformEnd={undefined} // <= REMOVED to enable transform
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
        </>
    );
};

export default React.memo(DraggableObject);
