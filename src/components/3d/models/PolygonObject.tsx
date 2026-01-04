import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { APDObject } from '../../../types';
import { useBuildingTexture } from '../textureUtils';

export const PolygonObject = ({ obj, scale, isSelected }: { obj: APDObject, scale: number, isSelected?: boolean }) => {
    const isBuilding = obj.type === 'building';

    // Improved Colors
    // If it's a building and still has the default pink/grey, upgrade it to a nice Concrete White.
    const defaultBuildingColor = '#F2F2F2'; // Off-white concrete

    // Deterministic subtle color variation based on ID
    const colorVariation = useMemo(() => {
        if (!isBuilding) return null;
        let hash = 0;
        for (let i = 0; i < obj.id.length; i++) {
            hash = obj.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Generate a subtle Tint/Shade
        // We can just shift the lightness or hue slightly
        // Let's use HSL via ThreeJS Color
        const c = new THREE.Color(obj.item?.fill === '#FFC0CB' || !obj.item?.fill ? defaultBuildingColor : obj.item?.fill);
        const hsl = { h: 0, s: 0, l: 0 };
        c.getHSL(hsl);

        // Vary lightness by up to +/- 5%
        const lShift = ((hash % 100) - 50) / 1000; // -0.05 to +0.05
        hsl.l = Math.max(0.1, Math.min(0.9, hsl.l + lShift));

        // Vary Hue slightly by +/- 5 degrees
        const hShift = ((hash % 360) - 180) / 3600; // Small hue shift
        hsl.h = (hsl.h + hShift + 1) % 1;

        c.setHSL(hsl.h, hsl.s, hsl.l);
        return c.getStyle();
    }, [obj.id, obj.item?.fill, isBuilding]);

    const color = isBuilding ? (colorVariation || defaultBuildingColor) : (obj.item?.fill || '#aaaaaa');

    const roofColor = '#3A4042'; // Dark Asphalt/Membrane
    const buildingTexture = useBuildingTexture(color);

    // Geometry generation
    const geometry = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return null;

        const shapePoints = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i]) * scale;
            const localY = -(obj.points[i + 1]) * scale; // Correct 2D->3D Logic
            shapePoints.push(new THREE.Vector2(localX, localY));
        }

        const shape = new THREE.Shape(shapePoints);
        const extrudeSettings = {
            depth: obj.height3d || (isBuilding ? 8 : 0.05), // Zones are flat (5cm)
            bevelEnabled: isBuilding,
            bevelThickness: 0.05, // Subtle bevel
            bevelSize: 0.05,
            bevelSegments: 2
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Calculate UVs manually for better texture mapping
        // We want the texture to tile nicely based on world units.
        const uvAttribute = geo.attributes.uv;
        const posAttribute = geo.attributes.position;

        // This is a complex area in ThreeJS ExtrudeGeo. 
        // Standard UVs are often just 0-1 for the side. 
        // We rely on texture.repeat in useEffect to fix scaling relative to bounding box or hardcoded factor.

        return geo;

    }, [obj.points, obj.width, obj.height, obj.x, obj.y, obj.height3d, isBuilding, scale]);

    // Update texture scale
    useEffect(() => {
        if (isBuilding && geometry) {
            // New logic: 1 texture tile per ~12m width, ~12m height (based on our texture gen logic)
            // 2D APD scale: usually 1 unit = 1 meter if calibrated? Or 10px = 1m?
            // "scale" prop converts pixels to 3D units.
            // If scale is correct, then geometry is in Meters.

            // Texture settings:
            // We want windows to be approx 1.5m wide. Our texture has 4 windows in 1024px.
            // So 1 tile width should map to roughly 4 * 2.5m (spacing) = 10m in world space.

            // ExtrudeGeometry side UVs typically wrap around the shape 0..1 or something. 
            // We'll use a rough Repeat factor.
            // A constant repeat of 0.1 means 1 tile repeats every 10 UV units.

            // Let's try a denser repeat for testing.
            buildingTexture.repeat.set(0.15, 0.15);
        }
    }, [buildingTexture, isBuilding, geometry]);


    // Edges for buildings
    const edgesGeometry = useMemo(() => {
        if (!geometry || !isBuilding) return null;
        return new THREE.EdgesGeometry(geometry, 30);
    }, [geometry, isBuilding]);

    if (!geometry) return null;

    if (isBuilding) {
        return (
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <mesh geometry={geometry} castShadow receiveShadow>
                    {/* Material 0: Front/Back (Top/Bottom in our rotation) -> ROOF */}
                    <meshStandardMaterial attach="material-0" color={roofColor} roughness={0.9} metalness={0.1} />
                    {/* Material 1: Sides -> FACADE */}
                    <meshStandardMaterial
                        attach="material-1"
                        map={buildingTexture}
                        color={color}
                        roughness={0.9} // Concrete is rough
                        metalness={0.0}
                    />
                </mesh>
                {edgesGeometry && (
                    <lineSegments geometry={edgesGeometry}>
                        <lineBasicMaterial color="#222222" linewidth={1} opacity={0.3} transparent />
                    </lineSegments>
                )}

                {/* Selection Highlight (Blue Frame) */}
                {isSelected && edgesGeometry && (
                    <lineSegments geometry={edgesGeometry}>
                        <lineBasicMaterial color="#007bff" linewidth={3} depthTest={false} opacity={0.8} transparent />
                    </lineSegments>
                )}
            </group>
        );
    }

    // Default for non-buildings (Ground zones etc)
    return (
        <group>
            <mesh geometry={geometry} castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <meshStandardMaterial
                    color={color}
                    roughness={0.8}
                    metalness={0.0}
                />
            </mesh>
        </group>
    );
};
