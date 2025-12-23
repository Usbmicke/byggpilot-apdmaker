
import React, { forwardRef } from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';
import { APDObject } from '../../types';

interface CraneObjectProps {
    obj: APDObject;
    [key: string]: any; // To allow other props like draggable, onDragEnd etc.
}

const CraneObject = forwardRef<any, CraneObjectProps>(({ obj, ...props }, ref) => {

    // STABLE FIX: Crane's visual representation is now directly and solely driven by obj.radius
    // STABLE FIX: Crane's visual representation is now directly and solely driven by obj.radius (meters) * scale (px/m)
    // Default radius of 45 meters * scale. If scale not provided, fallback to 1 (which means 45px, likely too small/wrong but safe)
    const pxScale = props.scale || 1;
    const armLength = (obj.radius || 45) * pxScale;

    // Detailed dimensions based on realistic sizes (meters) * pxScale
    const counterWeightLength = armLength * 0.3;
    const towerWidth = 2.0 * pxScale; // Fixed 2m width for tower
    const armWidth = 1.2 * pxScale; // Fixed 1.2m width for arm

    return (
        <Group {...props} ref={ref}>
            {/* Work Radius Circle */}
            <Circle
                radius={armLength} // The radius of the circle is the arm length
                fill="rgba(255, 193, 7, 0.2)" // Yellow, semi-transparent
                stroke="rgba(255, 193, 7, 0.5)"
                strokeWidth={2}
                dash={[10, 5]}
                listening={false} // Doesn't interfere with clicks
            />

            {/* Main Arm (Jib) */}
            <Rect
                width={armLength}
                height={armWidth}
                fill="#B0C4DE" // Light Steel Blue
                stroke="#4682B4" // Steel Blue
                strokeWidth={1}
                y={-armWidth / 2}
            />

            {/* Counterweight */}
            <Rect
                width={counterWeightLength}
                height={armWidth * 1.5} // Make it thicker
                fill="#708090" // Slate Gray
                stroke="#2F4F4F" // Dark Slate Gray
                strokeWidth={1}
                x={-counterWeightLength}
                y={(-armWidth * 1.5) / 2}
            />

            {/* Tower/Base */}
            <Rect
                width={towerWidth}
                height={towerWidth}
                fill="#A9A9A9" // Dark Gray
                stroke="#696969" // Dim Gray
                strokeWidth={1.5}
                x={-towerWidth / 2}
                y={-towerWidth / 2}
            />

            {/* Hoist Line - Visual indicator, not the true radius line */}
            <Line
                points={[0, 0, armLength * 0.8, 0]} // A visual line to represent the hoist
                stroke="#FFD700" // Gold (Yellow)
                strokeWidth={2}
                listening={false}
            />

        </Group>
    );
});

export default CraneObject;
