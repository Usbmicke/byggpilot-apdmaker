import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { APDObject, LibraryItem } from '../../../types';
import { useHatchTexture } from '../textureUtils';

export const GroundMarkingObject = ({ obj, item, scale }: { obj: APDObject, item?: LibraryItem, scale: number }) => {
    const geometry = useMemo(() => {
        // Fallback for objects without points (like standard rectangles)
        if (!obj.points || obj.points.length < 4) {
            if (obj.width && obj.height) {
                const w = obj.width * scale;
                const h = obj.height * scale;
                const plane = new THREE.PlaneGeometry(w, h);
                // Fix: Plane is centered. Pivot is Top-Left.
                // Shift Right by w/2 (so left edge is 0)
                // Shift Down by h/2 (so top edge is 0). Note: Local Y is 'Up' in geometry, but maps to -Z.
                // We want Z to extend Positive from 0. So we want Y to extend Negative from 0.
                // So Top (0) -> Bottom (-h).
                // Centered Plane is [-h/2, h/2]. We subtract h/2.
                plane.translate(w / 2, -h / 2, 0);
                return plane;
            }
            return null;
        }

        const shapePoints = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i]) * scale;
            const localY = -(obj.points[i + 1]) * scale;
            shapePoints.push(new THREE.Vector2(localX, localY));
        }
        const shape = new THREE.Shape(shapePoints);
        return new THREE.ShapeGeometry(shape);
    }, [obj.points, obj.width, obj.height, obj.x, obj.y, scale]);

    let baseColor = item?.fill || obj.item?.fill || '#FFFFFF';

    if (obj.type === 'schakt') baseColor = '#FF1744'; // Reddish for excavation (matches 2D)
    if (obj.type.includes('traffic')) baseColor = '#FBBF24';
    if (obj.type.includes('pedestrian')) baseColor = '#3B82F6';
    if (obj.type.includes('unloading')) baseColor = '#F87171';
    if (obj.type.includes('storage')) baseColor = '#A78BFA';

    // FIX: Make Schakt more visible by using a different material or offset
    const isSchaktObj = obj.type === 'schakt' || obj.type === 'zone_schakt';

    // For Schakt, we want a "hole" look. We can't do true boolean CSG easily here, 
    // but we can render it slightly lower or with a dark inner shadow texture.
    // Let's use a dark texture and place it just *barely* above ground to avoid z-fighting,
    // but visually it represents depth.

    const hatchTexture = useHatchTexture(baseColor, isSchaktObj); // Pass flag to texture generator

    // Scale texture repeat based on bounding box roughly
    useEffect(() => {
        if (geometry) {
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            if (box) {
                const width = box.max.x - box.min.x;
                const height = box.max.y - box.min.y;
                hatchTexture.repeat.set(width / 2, height / 2);
            }
        }
    }, [geometry, hatchTexture]);


    if (!geometry) return null;

    return (
        <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} receiveShadow>
            <meshBasicMaterial
                map={hatchTexture}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
                depthWrite={false} // Prevent z-fighting
            />
            {/* Outline for Schakt to make it pop */}
            {isSchaktObj && (
                <lineSegments position={[0, 0, 0]}>
                    <edgesGeometry args={[geometry]} />
                    <lineBasicMaterial color="#B71C1C" />
                </lineSegments>
            )}
        </mesh>
    );
}
