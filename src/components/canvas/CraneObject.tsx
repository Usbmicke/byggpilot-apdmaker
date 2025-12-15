
import React, { forwardRef } from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';
import { APDObject } from '../../types';

interface CraneObjectProps {
    obj: APDObject;
    explicitWidth?: number; // New explicit prop for robust rendering
    [key: string]: any; // To allow other props like draggable, onDragEnd etc.
}

const CraneObject = forwardRef<any, CraneObjectProps>(({ obj, explicitWidth, ...props }, ref) => {

    // --- ROBUST DIMENSIONING ---
    // Prioritize the explicitly passed width. Fall back to the object's own width, then to a safe default.
    const armLength = explicitWidth || obj.width || 100;
    
    // Detailed dimensions based on the robust armLength
    const counterWeightLength = armLength * 0.3;
    const towerWidth = Math.min(armLength * 0.1, 20);
    const armWidth = towerWidth * 0.8;

    const workingRadius = obj.radius || armLength * 0.8;

    return (
        <Group {...props} ref={ref}>
            {/* Work Radius Circle */}
            <Circle
                radius={workingRadius}
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

            {/* Hoist Line - The "Yellow Line" */}
            <Line
                points={[0, 0, workingRadius, 0]}
                stroke="#FFD700" // Gold (Yellow)
                strokeWidth={2}
                listening={false}
            />

        </Group>
    );
});

export default CraneObject;
