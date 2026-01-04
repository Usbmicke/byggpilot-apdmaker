import React, { useMemo } from 'react';
import * as THREE from 'three';
import { APDObject, isGate } from '../../../types';
import { calculateVisualSegments } from '../../../utils/geometry';
import { useFenceTexture } from '../textureUtils';

export const FenceObject = ({ obj, scale, objects }: { obj: APDObject, scale: number, objects?: APDObject[] }) => {
    const fenceHeight = 2.0;
    const postRadius = 0.08; // Increased from 0.05 for visibility at distance
    const segmentLength = 3.0; // Meters between posts
    const color = obj.stroke || obj.item?.stroke || '#00C853'; // Match 2D color (Light Green)
    const fenceTexture = useFenceTexture(color);

    // Calculate segments (incorporating gaps for gates)
    const renderSegments = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return [];

        const gates = objects ? objects.filter(o => isGate(o)) : [];

        // Convert local points to world-ish relative for the utility
        // The utility expects flat [x,y, x,y] array. 
        // obj.points is [x,y, x,y] relative to obj.x, obj.y (Konva line points).
        // The gates are at world coords. 
        // We need to pass "World" points for the fence to the utility, then convert back? 
        // OR pass "Local" points and "Local" gates.

        // Let's use Local Fence Space.
        // Fence Origin: (0,0) in Render Space -> (obj.x, obj.y) in World.
        // Fence Points: obj.points (already local).

        // Transform Gates to Local Space
        const localGates = gates.map(g => ({
            ...g,
            x: g.x - obj.x,
            y: g.y - obj.y
        }));

        const visualSegments = calculateVisualSegments(obj.points, localGates, scale);

        return visualSegments;
    }, [obj.points, obj.x, obj.y, objects, scale]);

    const renderedParts = useMemo(() => {
        const parts: React.ReactNode[] = [];

        renderSegments.forEach((seg, idx) => {
            // Convert back to 3D. 
            // 2D X -> 3D X
            // 2D Y -> 3D Z
            // Scale: * scale

            const startP = new THREE.Vector3(seg.p1.x * scale, 0, seg.p1.y * scale);
            const endP = new THREE.Vector3(seg.p2.x * scale, 0, seg.p2.y * scale);

            const dist = startP.distanceTo(endP);
            if (dist < 0.1) return; // Skip tiny segments

            const angle = Math.atan2(endP.z - startP.z, endP.x - startP.x);
            // Calculate how many segments we need
            const totalSegments = Math.max(1, Math.round(dist / segmentLength));
            const actualSegmentLen = dist / totalSegments;

            // Posts & Panels for THIS visual segment
            for (let j = 0; j < totalSegments; j++) {
                const t = j / totalSegments;
                const nextT = (j + 1) / totalSegments;

                // Position for this segment's start post
                const segX = THREE.MathUtils.lerp(startP.x, endP.x, t);
                const segZ = THREE.MathUtils.lerp(startP.z, endP.z, t);

                // Midpoint for the panel (mesh)
                const midX = THREE.MathUtils.lerp(startP.x, endP.x, (t + nextT) / 2);
                const midZ = THREE.MathUtils.lerp(startP.z, endP.z, (t + nextT) / 2);

                // Add Post
                parts.push(
                    <mesh key={`seg-${idx}-post-${j}`} position={[segX, fenceHeight / 2, segZ]} castShadow>
                        <cylinderGeometry args={[postRadius, postRadius, fenceHeight, 8]} />
                        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
                    </mesh>
                );

                // Add Mesh Panel
                const clonedTexture = fenceTexture.clone();
                clonedTexture.repeat.set(actualSegmentLen, 2);
                clonedTexture.needsUpdate = true;

                parts.push(
                    <mesh
                        key={`seg-${idx}-panel-${j}`}
                        position={[midX, fenceHeight / 2, midZ]}
                        rotation={[0, -angle, 0]}
                        castShadow
                    >
                        <planeGeometry args={[actualSegmentLen, fenceHeight]} />
                        <meshStandardMaterial
                            map={clonedTexture}
                            transparent={true}
                            opacity={0.9}
                            side={THREE.DoubleSide}
                            alphaTest={0.1}
                            color="#FFFFFF"
                        />
                    </mesh>
                );
            }
            // Add final post for this segment
            parts.push(
                <mesh key={`seg-${idx}-post-end`} position={[endP.x, fenceHeight / 2, endP.z]} castShadow>
                    <cylinderGeometry args={[postRadius, postRadius, fenceHeight, 8]} />
                    <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
                </mesh>
            );
        });

        return parts;
    }, [renderSegments, fenceHeight, color, fenceTexture, postRadius, scale, segmentLength]);

    return <group>{renderedParts}</group>;
};
