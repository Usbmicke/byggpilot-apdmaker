
import React, { useRef, useEffect } from 'react';
import { Text, Transformer, Circle, Line, Rect, Image as KonvaImage, Group as KonvaGroup } from 'react-konva';
import useImage from 'use-image';
import { APDObject, isCrane, isText, isWalkway, isFence, isSchakt, isConstructionTraffic, isPen } from '../types/index';

interface DraggableObjectProps {
    obj: APDObject;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (attrs: Partial<APDObject>) => void;
    onInteractionStart: () => void;
    onTextDblClick: () => void;
}

const IconObject: React.FC<{ commonProps: any, obj: APDObject, shapeRef: React.RefObject<any> }> = ({ commonProps, obj, shapeRef }) => {
    const [iconImage] = useImage(obj.item.icon || '');
    const size = obj.item?.width || 40;
    return (
        <KonvaImage
            ref={shapeRef}
            image={iconImage}
            width={size}
            height={size}
            offsetX={size / 2}
            offsetY={size / 2}
            {...commonProps}
        />
    );
};

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, isSelected, onSelect, onChange, onInteractionStart, onTextDblClick }) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected && trRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer()?.batchDraw();
        } 
    }, [isSelected]);

    const commonProps = {
        id: obj.id,
        name: obj.id, // Används för att hitta noden
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        visible: obj.visible, // <-- DEN AVGÖRANDE FIXEN
        draggable: true,
        onClick: onSelect,
        onTap: onSelect,
        onDragStart: () => {
            onInteractionStart();
        },
        onDragEnd: (e: any) => {
            if (isLineTool(obj.type)) {
                const {x,y} = e.target.position();
                onChange({ points: obj.points?.map((p,i) => i % 2 === 0 ? p + x : p + y), x:0, y:0 });
                e.target.position({x:0, y:0});
            } else {
                 onChange({ x: e.target.x(), y: e.target.y() })
            }
        },
        onTransformStart: onInteractionStart,
        onTransformEnd: () => {
            const node = shapeRef.current;
            if (!node) return;
            onChange({
                x: node.x(),
                y: node.y(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
                rotation: node.rotation(),
            });
        },
    };
    
    const renderObject = () => {
        const type = obj.type;

        if (isText(obj)) {
            return <Text ref={shapeRef} {...commonProps} text={obj.text} fontSize={obj.fontSize} fill={obj.fill} padding={5} onDblClick={onTextDblClick} onDblTap={onTextDblClick} />;
        } 
        if (isLineTool(type)) {
            return <Line ref={shapeRef} {...commonProps} points={obj.points} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={obj.dash} tension={isPen(obj) ? 0.5 : 0} lineCap="round" hitStrokeWidth={20} />;
        }
        if (isCrane(obj)) {
             return (
                <KonvaGroup {...commonProps} ref={shapeRef}>
                    <Circle x={0} y={0} radius={obj.radius} stroke="rgba(239, 68, 68, 0.7)" strokeWidth={2} dash={[10, 5]} listening={false}/>
                    <Rect x={-10} y={-10} width={20} height={20} fill="#FFD700" stroke="#DAA520" strokeWidth={1}/>
                    <Line points={[0, 0, obj.radius, 0]} stroke="#FFD700" strokeWidth={5} />
                </KonvaGroup>
            );
        }
        if (isSchakt(obj)) {
            return <Rect ref={shapeRef} {...commonProps} width={obj.width} height={obj.height} fill={obj.fill} stroke={obj.stroke} strokeWidth={2} dash={[10, 5]} offsetX={(obj.width || 0) / 2} offsetY={(obj.height || 0) / 2} />;
        }
        
        return <IconObject commonProps={commonProps} obj={obj} shapeRef={shapeRef} />;
    };

    return (
        <>
            {renderObject()}
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox}
                    anchorStroke="#007bff"
                    anchorFill="#fff"
                    anchorSize={10}
                    borderStroke="#007bff"
                    borderDash={[6, 2]}
                />
            )}
        </>
    );
};

export default DraggableObject;
