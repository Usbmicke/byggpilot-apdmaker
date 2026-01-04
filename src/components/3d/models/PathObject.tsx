import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryItem } from '../../../types';

export const PathObject = ({ obj, item, scale }: { obj: APDObject, item?: LibraryItem, scale: number }) => {
    const points = useMemo(() => {
        if (!obj.points || obj.points.length < 2) return [];
        const result = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i]) * scale;
            const localZ = (obj.points[i + 1]) * scale;
            result.push(new THREE.Vector3(localX, 0.05, localZ));
        }
        return result;
    }, [obj.points, obj.x, obj.y]);

    // Use passed item config or fallback to object item
    const config = item || obj.item;

    // Safety Fallbacks
    const color = obj.stroke || config?.initialProps?.stroke || config?.stroke || '#FFFFFF';
    const isWalkway = obj.type === 'walkway';
    const isConstructionTraffic = obj.type === 'construction-traffic';

    // Revised widths for "Discrete Markings"
    // Walkway: 0.5m for clear visibility
    // Traffic: 3.0m for realistic road width, but keep transparency
    let width = 0.5;
    if (isWalkway) width = 0.5;
    if (isConstructionTraffic) width = 3.0; // Realistic road width

    // Dash Logic
    const dashVal = obj.dash || config?.initialProps?.dash || config?.dash;
    const isDashed = !!dashVal;

    let dashSize = 0;
    let gapSize = 0;

    if (isDashed && dashVal) {
        // If worldUnits is true, these are in Meters.
        // We must convert 2D pixel dash values to Meters using 'scale'.
        // Ensure MINIMUM dash size so it doesn't vanish (e.g. at least 0.2m)
        const rawDashMeters = dashVal[0] * scale;
        const rawGapMeters = (dashVal[1] || dashVal[0]) * scale;

        dashSize = Math.max(0.2, rawDashMeters);
        gapSize = Math.max(0.2, rawGapMeters);
    }

    return (
        <group position={[0, 0.05, 0]}> {/* Lowered to 0.05, slightly above 0.02 zones */}
            {/* Main Path Material - Transparent & Discrete */}
            <Line
                points={points}
                color={color}
                lineWidth={width}
                dashed={isDashed}
                dashScale={1}
                dashSize={dashSize}
                gapSize={gapSize}
                worldUnits={true}
                transparent={true}
                opacity={isConstructionTraffic ? 0.3 : 0.8} // Roads are subtle
            />
        </group>
    );
};
