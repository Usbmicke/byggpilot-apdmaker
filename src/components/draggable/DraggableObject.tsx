
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Line, Rect } from 'react-konva';
import useImage from 'use-image';
import {
    APDObject,
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

    const width = obj.width || obj.item.width || SAFE_DIMENSION;
    const height = obj.height || obj.item.height || SAFE_DIMENSION;

    const imageUrl = obj.item.iconUrl || '';
    const [image, imageStatus] = useImage(imageUrl, 'anonymous');

    const handleDragEnd = (e: any) => {
        onChange({ x: e.target.x(), y: e.target.y() }, true);
    };

    // NOTE: onTransformEnd is now handled by CanvasPanel's Transformer

    const commonProps = {
        id: obj.id,
        name: obj.id,
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        draggable: !isDrawing, // Draggability is managed by the parent based on selection
        listening: !isDrawing,
        onClick: onSelect,
        onTap: onSelect,
        onDragEnd: handleDragEnd,
        // onTransformEnd is removed
        ref: shapeRef,
        visible: obj.visible !== false,
    };

    if (isCrane(obj)) {
        return <CraneObject {...commonProps} obj={obj} />;
    }

    if (isLineTool(obj.type)) {
        return (
            <Line
                {...commonProps}
                points={obj.points}
                stroke={obj.stroke || '#000000'}
                strokeWidth={obj.strokeWidth || 2}
                dash={obj.dash}
                tension={isPen(obj.type) ? 0.5 : 0}
                lineCap="round"
                lineJoin="round"
            />
        );
    }

    if (imageStatus === 'loaded' && obj.item.iconUrl) {
        return <KonvaImage {...commonProps} image={image} width={width} height={height} />;
    }

    return <Rect {...commonProps} width={width} height={height} fill={obj.fill || '#a0aec0'} stroke={obj.stroke || '#4a5568'} strokeWidth={obj.strokeWidth || 2} />;
};

export default React.memo(DraggableObject);
