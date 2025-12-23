
import React, { useMemo, useEffect } from 'react';
import { useTexture, Line, Text, Plane, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryItem, isGate } from '../../types';


// DEFINITIVE FIX: Polygon shapes must have their local Y-coordinate negated when creating the THREE.Shape
// to counteract the inverted Y-axis of the 2D canvas vs. the 3D coordinate system.
// Helper for building facade texture (Realistic Stucco/Concrete)
const useBuildingTexture = (baseColor: string) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 1. Base Wall (Stucco/Concrete)
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 1024, 1024);

            // 2. Add Noise/Texture
            for (let i = 0; i < 50000; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 1024;
                // Dark specs
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
                ctx.fillRect(x, y, 2, 2);
                // Light specs
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
                ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
            }

            // 3. Draw Windows
            const cols = 4; // Horizontal windows per texture tile
            const rows = 4; // Vertical floors per texture tile

            const tileW = 1024;
            const tileH = 1024;

            const winW = 120;
            const winH = 160;
            const paddingX = (tileW - (cols * winW)) / (cols + 1);
            const paddingY = (tileH - (rows * winH)) / (rows + 1);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = paddingX + c * (winW + paddingX);
                    const y = paddingY + r * (winH + paddingY);

                    // Window Sill/Frame (Outer)
                    ctx.fillStyle = '#CCCCCC'; // Concrete sill
                    ctx.fillRect(x - 4, y - 4, winW + 8, winH + 8);

                    // Frame (Inner)
                    ctx.fillStyle = '#333333'; // Dark Grey/Black Frame
                    ctx.fillRect(x, y, winW, winH);

                    // Interior (Dark backing)
                    ctx.fillStyle = '#1a252f';
                    ctx.fillRect(x + 6, y + 6, winW - 12, winH - 12);

                    // Glass Reflection
                    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'; // Light Blue tint
                    ctx.fillRect(x + 6, y + 6, winW - 12, winH - 12);

                    // Simple diagonal reflection streak
                    ctx.beginPath();
                    ctx.moveTo(x + 10, y + winH - 20);
                    ctx.lineTo(x + winW - 20, y + 10);
                    ctx.lineTo(x + winW - 10, y + 10);
                    ctx.lineTo(x + 10, y + winH - 10);
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.fill();
                }
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Optimization: Reduce anisotropy if performance issue, but 4 is good for oblique views
        texture.anisotropy = 4;
        return texture;
    }, [baseColor]);
};

const useHatchTexture = (baseColor: string, isSchakt: boolean = false) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            if (isSchakt) {
                // Schakt: Dark soil with noise/texture
                ctx.fillStyle = '#3E2723'; // Dark earth
                ctx.fillRect(0, 0, 512, 512);

                // Add noise
                for (let i = 0; i < 20000; i++) {
                    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
                    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
                    ctx.fillStyle = `rgba(100,60,40,${Math.random() * 0.2})`;
                    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
                }

                // Inner Shadow / Depth Gradient
                const grad = ctx.createRadialGradient(256, 256, 100, 256, 256, 300);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,0,0.5)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 512, 512);

            } else {
                // Standard Hatching for Zones (e.g. No Parking)
                ctx.fillStyle = baseColor; // Background
                ctx.fillRect(0, 0, 512, 512);

                // Diagonal Lines
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 10;
                ctx.beginPath();
                for (let i = -512; i < 1024; i += 40) {
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i + 512, 512);
                }
                ctx.stroke();
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }, [baseColor, isSchakt]);
};

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
            depth: obj.height3d || (isBuilding ? 8 : 1),
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

    }, [obj.points, obj.x, obj.y, obj.height3d, isBuilding, scale]);

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

const MemoizedPlane = React.memo(Plane);

export const CraneObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    const towerHeight = 30;
    const jibLength = (obj.radius || 30) * scale;
    const counterweightLength = jibLength * 0.3;
    const jibY = towerHeight - 1.5;

    return (
        <group>
            {/* Tower Base (Reduced to 3x3m) */}
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[3, 2, 3]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Tower Lattice Representation (using a texture would be better, but simplified here) */}
            <mesh castShadow position={[0, towerHeight / 2 + 1, 0]}>
                <boxGeometry args={[2, towerHeight, 2]} />
                <meshStandardMaterial color="#FFD700" wireframe />
            </mesh>
            <mesh castShadow position={[0, towerHeight / 2 + 1, 0]}>
                <boxGeometry args={[1.8, towerHeight, 1.8]} />
                <meshStandardMaterial color="#FFD700" transparent opacity={0.3} />
            </mesh>

            {/* Cab */}
            <mesh castShadow position={[1.2, jibY, 0]}>
                <boxGeometry args={[2, 2.5, 2]} />
                <meshStandardMaterial color="#EEE" />
            </mesh>

            {/* Jib (Arm) */}
            <group position={[0, jibY + 1, 0]}>
                <mesh castShadow position={[jibLength / 2 - counterweightLength / 2, 0, 0]}>
                    <boxGeometry args={[jibLength + counterweightLength, 1.5, 1.5]} />
                    <meshStandardMaterial color="#FFD700" wireframe />
                </mesh>
                <mesh castShadow position={[jibLength / 2 - counterweightLength / 2, 0, 0]}>
                    <boxGeometry args={[jibLength + counterweightLength, 1.4, 1.4]} />
                    <meshStandardMaterial color="#FFD700" transparent opacity={0.3} />
                </mesh>
            </group>

            {/* Counterweights */}
            <mesh castShadow position={[-counterweightLength * 0.8, jibY + 0.5, 0]}>
                <boxGeometry args={[3, 2, 3]} />
                <meshStandardMaterial color="#555" />
            </mesh>

            {/* Cables */}
            <mesh position={[jibLength * 0.5, jibY - 5, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 10]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[jibLength * 0.5, jibY - 10, 0]}>
                <boxGeometry args={[2, 0.2, 2]} />
                <meshStandardMaterial color="#111" />
            </mesh>
        </group>
    );
};

export const SiteShedObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    // FIX: Use explicit width/height if available (which comes from 2D resize), otherwise fallback to defaults.
    // This fixed the "Floating Shed" issue where stacked sheds didn't know the bottom one was smaller.
    // We already passed the correct 'scale' (pixels->meters) globally, now we must respect obj.width/height * scale.
    const width = (obj.width && obj.width > 0 ? obj.width : 8) * scale;
    const depth = (obj.height && obj.height > 0 ? obj.height : 2.5) * scale;

    // Height is fixed standard for sheds unless specialized
    // Height is fixed standard for sheds unless specialized
    // const height = 2.6; // Removed due to duplicate declaration below

    // Determine orientation and dimensions
    const isHorizontal = width > depth;
    const longLen = isHorizontal ? width : depth;
    const shortLen = isHorizontal ? depth : width;

    // Dynamic Height: Maintain aspect ratio so it doesn't look like a tower when small.
    // Standard shed is ~8.4m long, ~2.6m high. Ratio Height/Length ~= 0.31.
    // We'll clamp it slightly so it doesn't get paper thin, but scales well.
    const heightRatio = 0.35;
    const minHeight = 0.5;
    const calculatedHeight = longLen * heightRatio;
    const height = Math.max(minHeight, calculatedHeight);

    const color = '#FA8128'; // Construction Orange
    const roofColor = '#333333';

    // Window logic: Ensure "massa fönster" (lots of windows) even when small.
    // Force at least 2 windows, and scale window size down if needed.
    const desiredWindowSpacing = 1.5; // Every 1.5m
    const windowCount = Math.max(2, Math.floor(longLen / desiredWindowSpacing));
    const windowSpacing = longLen / (windowCount + 1);

    // Dynamic Text Scaling
    // We want text to fit within the "short" side or generic size.
    // Base font size on object width/depth.
    const fontSize = Math.min(shortLen * 0.7, longLen * 0.3, 1.5);

    return (
        <group>
            {/* Main Body */}
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
            </mesh>

            {/* Roof (Cap) */}
            <mesh castShadow position={[0, height + (0.05 * scale), 0]}>
                {/* Scale roof overhang slightly with object size */}
                <boxGeometry args={[width + (0.15 * scale), 0.1 * scale, depth + (0.15 * scale)]} />
                <meshStandardMaterial color={roofColor} roughness={0.9} />
            </mesh>

            {/* Windows (on "Front" long side) */}
            {Array.from({ length: windowCount }).map((_, i) => {
                const offset = -longLen / 2 + (i + 1) * windowSpacing;

                // Window dimensions relative to Shed Height/Length
                const winH = height * 0.5; // Windows take up 50% of height
                const winW = Math.min(1.0, windowSpacing * 0.7); // Fit within spacing

                // If Horizontal(Wide): Place along X axis, on Z+ face
                // If Vertical(Deep): Place along Z axis, on X+ face
                const wx = isHorizontal ? offset : (width / 2 + 0.01);
                const wz = isHorizontal ? (depth / 2 + 0.01) : offset;
                const wRot = isHorizontal ? 0 : -Math.PI / 2;

                return (
                    <mesh key={`win-${i}`} position={[wx, height / 2, wz]} rotation={[0, wRot, 0]}>
                        <planeGeometry args={[winW, winH]} />
                        <meshStandardMaterial color="#87CEEB" roughness={0.1} metalness={0.8} />
                    </mesh>
                );
            })}

            {/* Door (On "Start" short end) */}
            {(() => {
                // Place door on Left end (if horizontal) or Top end (if vertical)
                const dx = isHorizontal ? (-width / 2 - 0.01) : 0;
                const dz = isHorizontal ? 0 : (-depth / 2 - 0.01);
                const dRot = isHorizontal ? -Math.PI / 2 : Math.PI; // Face outwards

                const doorH = height * 0.8;
                const doorW = Math.min(0.9, shortLen * 0.6);

                return (
                    <mesh position={[dx, height / 2 - (height * 0.05), dz]} rotation={[0, dRot, 0]}>
                        <planeGeometry args={[doorW, doorH]} />
                        <meshStandardMaterial color="#F5F5F5" />
                    </mesh>
                )
            })()}

            {/* Concrete Feet/Foundation Blocks (Corners) */}
            {[1, -1].map(xDir => [1, -1].map(zDir => (
                <mesh key={`foot-${xDir}-${zDir}`} position={[xDir * (width / 2 - (0.3 * scale)), 0.05, zDir * (depth / 2 - (0.3 * scale))]}>
                    <boxGeometry args={[0.3 * scale, 0.1, 0.3 * scale]} />
                    <meshStandardMaterial color="#888888" />
                </mesh>
            )))}

            {/* TEXT LABEL ON ROOF - Scaled */}
            <group position={[0, height + (0.15 * scale), 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <Text
                    fontSize={Math.max(0.3, fontSize)} // Ensure readable minimum, but scale down
                    maxWidth={longLen * 0.95}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={fontSize * 0.05}
                    outlineColor="#000000"
                >
                    {obj.type === 'kontor' ? 'KONTOR' : 'BYGGBOD'}
                </Text>
            </group>
        </group>
    );
};

export const ContainerObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    // Sync 3D dimensions with 2D footprint
    const width = (obj.width || 6) * scale;
    const depth = (obj.height || 2.4) * scale;
    // Determine Type & Color
    let color = '#76FF03'; // Default Green (10m3)
    let hasNoRoof = false; // By default, containers have roofs
    let isSideOpen = false; // Open side (long side)
    let onlyBackWall = false; // Only back wall (no sides, no front)
    let wallThickness = 0.1;
    let targetHeight = 2.4; // Base height

    // Workshop Flags
    const isSawShed = obj.type.includes('saw-shed') || obj.type === 'saw_shed';
    const isRebarStation = obj.type.includes('rebar-station') || obj.type === 'rebar_station';

    if (obj.type.includes('container-30')) {
        color = '#00E5FF'; // Cyan
        hasNoRoof = true; // Open Top
        targetHeight = 2.2;
    } else if (obj.type.includes('tipp')) {
        color = '#2962FF'; // Blue
        hasNoRoof = true; // Open Top
        targetHeight = 1.25; // Handled nicely above though? No, this is fallback for obj properties if code flow reaches here?
        // Wait, 'tipp' logic is handled in the EARLIER if-block that returns early.
        // So this code block is for NON-tipp containers.
        // But let's keep it safe.
    } else if (isSawShed) {
        color = '#795548'; // Wood/Brown
        hasNoRoof = true; // No Roof
        onlyBackWall = true; // Back Wall Only
        targetHeight = 2.4;
    } else if (isRebarStation) {
        color = '#607D8B'; // Steel/Grey
        hasNoRoof = true; // No Roof
        onlyBackWall = true; // Back Wall Only
        targetHeight = 2.4;
    } else {
        // Default (10m3)
        targetHeight = 2.0;
    }

    // Safety clamp: Don't let height exceed width*1.5 (avoid towers on small icons)
    const maxDimension = Math.max(width, depth);
    const height = Math.min(targetHeight, maxDimension * 2.0); // Allow up to 2x aspect ratio, but cap at targetHeight

    // --- Tippcontainer Specific Logic ---
    if (obj.type.includes('tipp')) {
        // More specific geometry for Dumpster/Sopcontainer

        // Adjust dimensions to be smaller/shorter as requested
        const tWidth = width * 0.95;
        const tDepth = depth * 0.9;
        const tHeight = 1.25; // Significant height reduction (was 1.6)

        const bottomScale = 0.7;

        // Colors
        const wallColor = '#2962FF'; // Standard Blue
        const ribColor = '#1565C0'; // Darker Blue
        const wallThick = 0.05;

        // Custom Lid Color for 'Closed'
        const isClosed = obj.type.includes('stangd');
        // If closed, maybe use a darker blue or black lid?
        const lidColor = '#0D47A1';

        const sideShape = new THREE.Shape();
        // (Shape definition same as before, depending on tHeight/tDepth)
        const createSideWall = () => {
            const s = new THREE.Shape();
            s.moveTo(0, 0);
            s.lineTo(tDepth * bottomScale, 0);

            const slant = (tDepth * (1 - bottomScale)) / 2;

            s.moveTo(slant, 0);
            s.lineTo(tDepth - slant, 0);
            s.lineTo(tDepth, tHeight);
            s.lineTo(0, tHeight);
            s.lineTo(slant, 0);

            // Use thicker walls for visual solidity
            const geom = new THREE.ExtrudeGeometry(s, { depth: wallThick, bevelEnabled: false });
            return geom;
        };

        const sideGeom = useMemo(() => createSideWall(), [tDepth, tHeight, bottomScale]);

        return (
            <group position={[-tWidth / 2, 0, -tDepth / 2]}>
                {/* Left Side */}
                <mesh geometry={sideGeom} position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <meshStandardMaterial color={wallColor} />
                </mesh>
                {/* Right Side */}
                <mesh geometry={sideGeom} position={[tWidth, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <meshStandardMaterial color={wallColor} />
                </mesh>

                <group position={[tWidth / 2, 0, tDepth / 2]}>
                    {/* Bottom Plate */}
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <boxGeometry args={[tWidth, 0.1, tDepth * bottomScale]} />
                        <meshStandardMaterial color={wallColor} />
                    </mesh>

                    {/* Front/Back Walls (Slanted) */}
                    {(() => {
                        const slant = (tDepth * (1 - bottomScale)) / 2;
                        const hyp = Math.sqrt(slant * slant + tHeight * tHeight);
                        const angle = Math.atan2(slant, tHeight);
                        return (
                            <group>
                                {/* Front Wall */}
                                <mesh position={[0, tHeight / 2, tDepth / 2 - slant / 2]} rotation={[angle, 0, 0]}>
                                    <boxGeometry args={[tWidth, hyp, wallThick]} />
                                    <meshStandardMaterial color={wallColor} />
                                </mesh>
                                {/* Back Wall */}
                                <mesh position={[0, tHeight / 2, -tDepth / 2 + slant / 2]} rotation={[-angle, 0, 0]}>
                                    <boxGeometry args={[tWidth, hyp, wallThick]} />
                                    <meshStandardMaterial color={wallColor} />
                                </mesh>
                            </group>
                        )
                    })()}

                    {/* Ribs */}
                    {[0.2, 0.5, 0.8].map((pct, i) => (
                        <group key={i}>
                            <mesh position={[-tWidth / 2 - 0.05, tHeight / 2, (pct - 0.5) * tDepth]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.05, tHeight * 0.8, 0.1]} />
                                <meshStandardMaterial color={ribColor} />
                            </mesh>
                            <mesh position={[tWidth / 2 + 0.05, tHeight / 2, (pct - 0.5) * tDepth]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.05, tHeight * 0.8, 0.1]} />
                                <meshStandardMaterial color={ribColor} />
                            </mesh>
                        </group>
                    ))}

                    {/* Lids (Exclusively for 'stangd') */}
                    {isClosed && (
                        <group position={[0, tHeight, 0]}>
                            <mesh position={[-tWidth / 4, 0.05, 0]} rotation={[0, 0, 0.05]}>
                                <boxGeometry args={[tWidth / 2 + 0.1, 0.05, tDepth + 0.2]} />
                                <meshStandardMaterial color={lidColor} roughness={0.5} />
                            </mesh>
                            <mesh position={[tWidth / 4, 0.05, 0]} rotation={[0, 0, -0.05]}>
                                <boxGeometry args={[tWidth / 2 + 0.1, 0.05, tDepth + 0.2]} />
                                <meshStandardMaterial color={lidColor} roughness={0.5} />
                            </mesh>
                            {/* Hint of handle? */}
                            <mesh position={[-tWidth / 4, 0.1, 0]}><boxGeometry args={[0.1, 0.1, 0.4]} /><meshStandardMaterial color="#999" /></mesh>
                            <mesh position={[tWidth / 4, 0.1, 0]}><boxGeometry args={[0.1, 0.1, 0.4]} /><meshStandardMaterial color="#999" /></mesh>
                        </group>
                    )}
                </group>
            </group>
        );
    }

    // Geometry Construction (Standard Container - Fallback)
    return (
        <group>
            {/* Floor */}
            <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[width, 0.2, depth]} />
                <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
            </mesh>

            {!hasNoRoof && (
                // Closed Top (Roof)
                <mesh castShadow position={[0, height, 0]}>
                    <boxGeometry args={[width + 0.2, 0.1, depth + 0.2]} /> {/* Slight overhang for roof */}
                    <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                </mesh>
            )}

            {/* Walls (Front/Back) - Long sides */}
            {[1, -1].map(dir => {
                // If Open Side or Only Back Wall, skip Front Wall (dir === 1)
                if ((isSideOpen || onlyBackWall) && dir === 1) return null;

                return (
                    <group key={`wall-z-${dir}`} position={[0, height / 2, dir * (depth / 2 - wallThickness / 2)]}>
                        <mesh>
                            <boxGeometry args={[width, height, wallThickness]} />
                            <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                        </mesh>
                        {/* Ribs (only for containers, skip for sheds if desired, but ok to keep for style) */}
                        {!isSawShed && [...Array(Math.floor(width / 0.5))].map((_, i) => (
                            <mesh key={i} position={[-width / 2 + (i + 0.5) * 0.5, 0, dir * wallThickness]} >
                                <boxGeometry args={[0.2, height - 0.2, 0.05]} />
                                <meshStandardMaterial color={color} roughness={0.8} />
                            </mesh>
                        ))}
                    </group>
                );
            })}

            {/* Walls (Left/Right) - Short ends */}
            {[1, -1].map(dir => {
                // Skip side walls if onlyBackWall is active
                if (onlyBackWall) return null;

                return (
                    <group key={`wall-x-${dir}`} position={[dir * (width / 2 - wallThickness / 2), height / 2, 0]}>
                        <mesh>
                            <boxGeometry args={[wallThickness, height, depth - 2 * wallThickness]} />
                            <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                        </mesh>
                        {/* Container door details (only on back end if closed) */}
                        {dir === -1 && !hasNoRoof && !isSideOpen && (
                            <mesh position={[-wallThickness, 0, 0]}>
                                <boxGeometry args={[0.05, height - 0.2, depth / 2]} />
                                <meshStandardMaterial color="#333" />
                            </mesh>
                        )}
                    </group>
                );
            })}

            {/* Rubble/Fill for Open Containers */}
            {
                hasNoRoof && (
                    <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[width - 0.5, depth - 0.5]} />
                        <meshStandardMaterial color="#444" roughness={1} />
                    </mesh>
                )
            }

            {/* WORKSHOP CONTENTS */}
            {
                isSawShed && (
                    <group position={[0, 0, 0]}>
                        {/* Saw Table */}
                        <mesh position={[0, 0.8, 0]} castShadow>
                            <boxGeometry args={[1.5, 0.1, 0.8]} />
                            <meshStandardMaterial color="#D7CCC8" />
                        </mesh>
                        {/* Table Legs */}
                        <mesh position={[-0.6, 0.4, 0.3]}> <boxGeometry args={[0.1, 0.8, 0.1]} /> <meshStandardMaterial color="#5D4037" /> </mesh>
                        <mesh position={[0.6, 0.4, 0.3]}> <boxGeometry args={[0.1, 0.8, 0.1]} /> <meshStandardMaterial color="#5D4037" /> </mesh>
                        <mesh position={[-0.6, 0.4, -0.3]}> <boxGeometry args={[0.1, 0.8, 0.1]} /> <meshStandardMaterial color="#5D4037" /> </mesh>
                        <mesh position={[0.6, 0.4, -0.3]}> <boxGeometry args={[0.1, 0.8, 0.1]} /> <meshStandardMaterial color="#5D4037" /> </mesh>

                        {/* The Saw (Blade) */}
                        <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
                            <meshStandardMaterial color="silver" metalness={0.8} roughness={0.2} />
                        </mesh>
                    </group>
                )
            }

            {
                isRebarStation && (
                    <group position={[0, 0, 0]}>
                        {/* Rebar Rack */}
                        {/* Horizontal bars */}
                        <mesh position={[0, 0.5, -0.5]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>
                        <mesh position={[0, 0.5, 0.5]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>

                        {/* Rebars (Orange/Rust) */}
                        {[...Array(5)].map((_, i) => (
                            <mesh key={i} position={[-0.8 + i * 0.4, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <cylinderGeometry args={[0.02, 0.02, 2.2, 8]} />
                                <meshStandardMaterial color="#E65100" />
                            </mesh>
                        ))}
                        {[...Array(5)].map((_, i) => (
                            <mesh key={`b-${i}`} position={[-0.8 + i * 0.4, 0.65, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
                                <cylinderGeometry args={[0.02, 0.02, 2.2, 8]} />
                                <meshStandardMaterial color="#E65100" />
                            </mesh>
                        ))}
                    </group>
                )
            }

        </group >
    );
}

export const GenericWorkshopObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    const width = (obj.width || 4) * scale;
    const depth = (obj.height || 4) * scale;
    const height = 3.5;
    const color = obj.type === 'saw_shed' ? '#A1662F' : '#6B7280';
    return (
        <group>
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[0, height, 0]}>
                <boxGeometry args={[width, 0.2, depth * 1.2]} />
                <meshStandardMaterial color="#555" />
            </mesh>
        </group>
    );
}

export const LightingMastObject = () => {
    const poleHeight = 15;
    return (
        <group>
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.2, 0.25, poleHeight, 12]} />
                <meshStandardMaterial color="#A0A0A0" metalness={0.8} roughness={0.2} />
            </mesh>
            <group position={[0, poleHeight, 0]} rotation={[0, 0, -Math.PI / 8]}>
                <mesh castShadow >
                    <boxGeometry args={[1.5, 0.4, 1.5]} />
                    <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.8} />
                </mesh>
            </group>
        </group>
    );
};

// Helper to generate a procedural fence texture
const useFenceTexture = (color: string) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'rgba(0,0,0,0)'; // Transparent background
            ctx.clearRect(0, 0, 64, 64);

            // Draw chainlink pattern (diamond shape)
            ctx.strokeStyle = color; // Dynamic Color (Light Green)
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            // Criss-cross lines
            ctx.moveTo(0, 0); ctx.lineTo(32, 32);
            ctx.moveTo(32, 0); ctx.lineTo(64, 32);
            ctx.moveTo(0, 32); ctx.lineTo(32, 64);
            ctx.moveTo(32, 32); ctx.lineTo(64, 64);

            ctx.moveTo(32, 0); ctx.lineTo(0, 32);
            ctx.moveTo(64, 0); ctx.lineTo(32, 32);
            ctx.moveTo(32, 32); ctx.lineTo(0, 64);
            ctx.moveTo(64, 32); ctx.lineTo(32, 64);

            ctx.stroke();

            // Border (Top/Bottom wires)
            ctx.strokeStyle = color; // Match wire color
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 2); ctx.lineTo(64, 2);
            ctx.moveTo(0, 62); ctx.lineTo(64, 62);
            ctx.stroke();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }, [color]);
};

// Helper for hatched texture (construction zones)
// Helper for hatched texture (construction zones) - REMOVED (Replaced by enhanced version at top of file)
// const useHatchTexture = (color: string, isCrossHatch = false) => { ... }

export const FenceObject = ({ obj, scale, objects }: { obj: APDObject, scale: number, objects?: APDObject[] }) => {
    const fenceHeight = 2.0;
    const postRadius = 0.05; // Standard post
    const segmentLength = 3.0; // Meters between posts
    const color = obj.stroke || obj.item?.stroke || '#00C853'; // Match 2D color (Light Green)
    const fenceTexture = useFenceTexture(color);

    // Parse points
    const points = useMemo(() => {
        if (!obj.points || obj.points.length < 2) return [];
        const result = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i]) * scale;
            const localZ = (obj.points[i + 1]) * scale;
            result.push(new THREE.Vector3(localX, 0, localZ));
        }
        return result;
    }, [obj.points, obj.x, obj.y, scale]);

    const renderedParts = useMemo(() => {
        if (!points.length) return null;
        const parts: React.ReactNode[] = [];
        const gates = objects ? objects.filter(o => isGate(o)) : [];

        // Helper to Render a Strip of fence
        const renderStrip = (startP: THREE.Vector3, endP: THREE.Vector3, keyPrefix: string) => {
            const dist = startP.distanceTo(endP);
            if (dist < 0.1) return; // Skip tiny segments

            const angle = Math.atan2(endP.z - startP.z, endP.x - startP.x);
            // Calculate how many segments we need
            const totalSegments = Math.max(1, Math.round(dist / segmentLength));
            const actualSegmentLen = dist / totalSegments;

            // Posts & Panels
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
                    <mesh key={`${keyPrefix}-post-${j}`} position={[segX, fenceHeight / 2, segZ]} castShadow>
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
                        key={`${keyPrefix}-panel-${j}`}
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
            // Add final post
            parts.push(
                <mesh key={`${keyPrefix}-post-end`} position={[endP.x, fenceHeight / 2, endP.z]} castShadow>
                    <cylinderGeometry args={[postRadius, postRadius, fenceHeight, 8]} />
                    <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
                </mesh>
            );
        };

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const segDist = p1.distanceTo(p2);

            // Gates cutting logic
            // We want to find intervals on [0, segDist] that are BLOCKED by gates
            const cuts: { start: number, end: number }[] = [];

            gates.forEach(gate => {
                // Correct coordinate space! 
                // ThreeDObject transforms obj.x/y to (obj.x - w/2)*scale ...
                // But here gate.x/y are raw 2D. 
                // We need Gate's 3D position relative to the SCENE origin (which matches points).
                // Our points are computed as `(obj.points[i]) * scale`.
                // Wait, `obj.points` are relative to `obj`. `points` list above are LOCAL to the Loop?
                // Wait, `points` list above are LOCAL to the Loop?
                // NO. `points` calc uses only `obj.points`. It does NOT add `obj.x`.
                // Line 622: `localX = (obj.points[i]) * scale`. 
                // So the fence points are LOCAL to the Fence Group.
                // The Fence Group is at `fence.x, fence.y`.

                // Gate 2D pos: `gate.x, gate.y` (Top-Left)
                // Fence 2D pos: `obj.x, obj.y`.
                // We need Gate CENTER for the cut check.
                const gateCenterX = gate.x + (gate.width || 0) / 2;
                const gateCenterY = gate.y + (gate.height || 0) / 2;
                const gw = (gate.width || 5) * scale; // Restore missing gw definition

                const lx = (gateCenterX - obj.x) * scale;
                const lz = (gateCenterY - obj.y) * scale;
                const gatePos = new THREE.Vector3(lx, 0, lz);

                // Rotate if the fence object itself has rotation (unlikely for drawn lines but possible)
                if (obj.rotation) {
                    const rotRad = THREE.MathUtils.degToRad(-obj.rotation);
                    gatePos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotRad);
                }

                // Project gatePos onto line segment p1-p2
                const lineVec = new THREE.Vector3().subVectors(p2, p1);
                const pointVec = new THREE.Vector3().subVectors(gatePos, p1);
                const lineLenSq = lineVec.lengthSq();

                if (lineLenSq > 0) {
                    let t = pointVec.dot(lineVec) / lineLenSq;
                    // Check if gate is roughly "on" the line extended
                    // Calculate lateral distance
                    const proj = new THREE.Vector3().copy(p1).add(lineVec.clone().multiplyScalar(t));
                    const lateralDist = gatePos.distanceTo(proj);

                    // Threshold: Gate must be roughly on the line. 
                    // Reduced to 0.5m to represent "thickness" of interaction. 
                    // Prevents cutting nearby parallel fences.
                    if (lateralDist < 0.5) {
                        // It intersects! Calculate cut range on the line.
                        // FIX: Gate anchor is one post (Top-Left). Gate extends 'width' from there.
                        // We need to check if gate is aligned with line direction or opposite.

                        // Fence Segment Angle
                        const segAngle = Math.atan2(lineVec.z, lineVec.x); // Z is 2D Y
                        // Gate Angle (already converted to radians, negated earlier? No, obj.rotation is degrees)
                        const gateAngleRad = THREE.MathUtils.degToRad(gate.rotation || 0);

                        // Compare angles.
                        // We need 2D vector for gate direction.
                        // Fence is P1->P2.
                        // Gate is Anchor -> +Width.
                        // If Gate vector aligns with Fence vector, we cut [t, t+width].
                        // If Gate vector opposes Fence vector, we cut [t-width, t].

                        // Simple dot product of direction vectors
                        const fenceDir = new THREE.Vector2(lineVec.x, lineVec.z).normalize();
                        const gateDir = new THREE.Vector2(Math.cos(gateAngleRad), Math.sin(gateAngleRad)); // Konva 2D is CW, Y is down (Z in 3D).
                        // Wait, 3D Z is 2D Y.
                        // 2D Rotation: 0 is X+. 90 is Y+ (Z+).
                        // So `cos(rot), sin(rot)` gives correct 2D direction (X, Z).

                        const alignment = fenceDir.dot(gateDir);

                        // Margin
                        const margin = 0.2;
                        const tMeters = t * segDist;
                        const gWidth = gw;

                        let startM, endM;

                        if (alignment >= 0) {
                            // Forward: Cut from Anchor to Anchor+Width
                            startM = tMeters - margin;
                            endM = tMeters + gWidth + margin;
                        } else {
                            // Backward: Cut from Anchor-Width to Anchor
                            startM = tMeters - gWidth - margin;
                            endM = tMeters + margin;
                        }

                        cuts.push({ start: startM, end: endM });
                    }
                }
            });

            // Sort and merge cuts
            cuts.sort((a, b) => a.start - b.start);
            const merged: { start: number, end: number }[] = [];
            if (cuts.length > 0) {
                let curr = cuts[0];
                for (let k = 1; k < cuts.length; k++) {
                    if (cuts[k].start < curr.end) {
                        curr.end = Math.max(curr.end, cuts[k].end);
                    } else {
                        merged.push(curr);
                        curr = cuts[k];
                    }
                }
                merged.push(curr);
            }

            // Generate renderable segments from merged cuts
            let currPos = 0;
            merged.forEach((cut, idx) => {
                const s = Math.max(0, cut.start);
                const e = Math.min(segDist, cut.end);

                if (s > currPos + 0.1) {
                    // Render from currPos to s
                    const subP1 = new THREE.Vector3().lerpVectors(p1, p2, currPos / segDist);
                    const subP2 = new THREE.Vector3().lerpVectors(p1, p2, s / segDist);
                    renderStrip(subP1, subP2, `seg-${i}-sub-${idx}`);
                }
                currPos = Math.max(currPos, e);
            });

            // Final segment after last cut (or full if no cuts)
            if (currPos < segDist - 0.1) {
                const subP1 = new THREE.Vector3().lerpVectors(p1, p2, currPos / segDist);
                renderStrip(subP1, p2, `seg-${i}-last`);
            }
        }
        return parts;
    }, [points, fenceTexture, objects, scale, obj.x, obj.y, color]); // Dependencies added

    return <group>{renderedParts}</group>;
};

export const GateObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    const width = (obj.width || 5) * scale;
    const height = 2.0; // Match standard fence height
    const depth = (obj.height || 1.0) * scale; // 2D Height = 3D Depth
    const postSize = 0.3;

    // Helper to render gate bars/mesh
    const renderGateMesh = (w: number, h: number) => {
        const bars = [];
        const barCount = Math.floor(w * 3); // Density of bars
        for (let i = 1; i < barCount; i++) {
            const x = (w / barCount) * i; // Local to wing, start from 0
            bars.push(
                <mesh key={`vbar-${i}`} position={[x, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, h, 6]} />
                    <meshStandardMaterial color="#00C853" />
                </mesh>
            );
        }
        // Horizontal bar
        bars.push(
            <mesh key={`hbar-mid`} position={[w / 2, 0, 0]}>
                <boxGeometry args={[w, 0.05, 0.05]} />
                <meshStandardMaterial color="#00C853" />
            </mesh>
        );
        return <group>{bars}</group>;
    };

    // Correct Rotation: Apply obj.rotation around the Y axis.
    // Matches 2D 'Top-Left' pivots if we align geometry to start at 0.
    // FIX: Rotation is handled by ThreeDView wrapper! Do not apply here.
    return (
        <group>
            {/* Shift by depth/2 to align posts with the Center Line of the 2D bounding box (fence line) */}
            <group position={[0, 0, depth / 2]}>

                {/* Gate Posts - Origin at Left Post (0,0) */}

                {/* Left Post at 0 */}
                <mesh castShadow position={[0, height / 2, 0]}>
                    <boxGeometry args={[postSize, height + 0.5, postSize]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Right Post at width */}
                <mesh castShadow position={[width, height / 2, 0]}>
                    <boxGeometry args={[postSize, height + 0.5, postSize]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Left Wing Group - Pivoting at Left Post (0,0) */}
                {/* FIX: Flipped rotation to match 2D icon direction (+PI/4 instead of -PI/4) */}
                <group position={[postSize / 2, height / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
                    {/* Wing extends from 0 to width/2 */}
                    {/* Visual adjustment: wing starts slightly offset from post center */}
                    <group position={[0, 0, 0]}>
                        {/* Frame */}
                        <mesh castShadow position={[(width / 2 - 0.2) / 2, 0, 0]}>
                            <boxGeometry args={[width / 2 - 0.2, height, 0.1]} />
                            <meshStandardMaterial color="#000000" wireframe={true} />
                        </mesh>

                        {/* Green Mesh/Bars */}
                        <group position={[- (width / 2 - 0.2) / 2, 0, 0]}>
                            {/* Adjusted renderHelper to start from 0, so shift back if needed or adjust helper */}
                            {/* Let's simplify: pass width, render centered in helper? No, helper renders 0..w. 
                             Let's adjust helper usage or helper itself.
                             Helper above renders 0..w centered at w/2? No, previous helper was centered.
                             New helper renders 0..w? No, looked like -w/2..w/2.
                             Let's inline simple bars for stability.
                         */}
                        </group>
                        {/* Re-implementing simplified mesh for new coords */}
                        {(() => {
                            const w = width / 2 - 0.2;
                            return (
                                <group position={[0, 0, 0]}>
                                    {/* Frame Horizontal */}
                                    <mesh position={[w / 2, height / 2 - 0.05, 0]}><boxGeometry args={[w, 0.1, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
                                    <mesh position={[w / 2, -height / 2 + 0.05, 0]}><boxGeometry args={[w, 0.1, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
                                    {/* Vertical ends */}
                                    <mesh position={[0, 0, 0]}><boxGeometry args={[0.1, height, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
                                    <mesh position={[w, 0, 0]}><boxGeometry args={[0.1, height, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
                                    {/* Bars */}
                                    {Array.from({ length: Math.floor(w * 3) }).map((_, i) => (
                                        <mesh key={i} position={[w / (Math.floor(w * 3)) * (i + 1), 0, 0]}>
                                            <cylinderGeometry args={[0.03, 0.03, height, 6]} />
                                            <meshStandardMaterial color="#00C853" />
                                        </mesh>
                                    ))}
                                    {/* CrossX */}
                                    <mesh position={[w / 2, 0, 0]}>
                                        <boxGeometry args={[w, 0.05, 0.05]} />
                                        <meshStandardMaterial color="#00C853" />
                                    </mesh>
                                </group>
                            )
                        })()}
                    </group>
                </group>

                {/* Right Wing Group - Pivoting at Right Post (width) */}
                {/* FIX: Flipped rotation to match 2D icon (-PI/4 instead of +PI/4) */}
                <group position={[width - postSize / 2, height / 2, 0]} rotation={[0, -Math.PI / 4, 0]}>
                    {/* Mirror the left wing logic but go backwards? Or just rotate? */}
                    {/* Rotating Right Wing: Pivot is at Right Post. Wing should extend towards Left (-X). */}
                    {/* Inside this group, +X is 'Right'. We want wing to go Left. */}
                    <group rotation={[0, Math.PI, 0]}> {/* Flip 180 to face inwards */}
                        {(() => {
                            const w = width / 2 - 0.2;
                            return (
                                <group position={[0, 0, 0]}>
                                    <mesh position={[w / 2, height / 2 - 0.05, 0]}><boxGeometry args={[w, 0.1, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
                                    <mesh position={[w / 2, -height / 2 + 0.05, 0]}><boxGeometry args={[w, 0.1, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
                                    <mesh position={[0, 0, 0]}><boxGeometry args={[0.1, height, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
                                    <mesh position={[w, 0, 0]}><boxGeometry args={[0.1, height, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
                                    {Array.from({ length: Math.floor(w * 3) }).map((_, i) => (
                                        <mesh key={i} position={[w / (Math.floor(w * 3)) * (i + 1), 0, 0]}>
                                            <cylinderGeometry args={[0.03, 0.03, height, 6]} />
                                            <meshStandardMaterial color="#00C853" />
                                        </mesh>
                                    ))}
                                    <mesh position={[w / 2, 0, 0]}>
                                        <boxGeometry args={[w, 0.05, 0.05]} />
                                        <meshStandardMaterial color="#00C853" />
                                    </mesh>
                                </group>
                            )
                        })()}
                    </group>
                </group>

            </group>
        </group>
    )
}

export const HissObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    // Dynamic Dimensions from 2D Object
    const width = (obj.width || 3.0) * scale;
    const depth = (obj.height || 3.0) * scale;
    // Smart Height: Use snapped building height (height3d) or default to 15m
    const height = obj.height3d || 15;

    // Calculate component sizes ratios
    // Standard Hiss: Mast is usually central or rear, Cage is the main volume.
    // Let's assume the 2D box represents the Cage + clearance.

    const cageWidth = width * 0.85;
    const cageDepth = depth * 0.85;
    const cageHeight = 2.5;

    const mastWidth = Math.min(width, depth) * 0.3; // Mast relative to size

    return (
        <group>
            {/* Mast Structure */}
            <mesh castShadow receiveShadow position={[0, height / 2, -depth / 2 + mastWidth / 2]}>
                <boxGeometry args={[mastWidth, height, mastWidth]} />
                <meshStandardMaterial color="#555" metalness={0.6} roughness={0.2} />
            </mesh>

            {/* Roof Sign (When snapped to building, i.e., has explicit height3d) */}
            {obj.height3d && (
                <Billboard position={[0, height + 1.0, -depth / 2 + mastWidth / 2]} follow={true} lockX={false} lockY={false} lockZ={false}>
                    <group>
                        {/* Pole for sign */}
                        <mesh position={[0, -0.5, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 1.0]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>
                        {/* Sign Plate */}
                        <mesh position={[0, 0, 0]}>
                            <planeGeometry args={[1.5, 0.5]} />
                            <meshStandardMaterial color="#FFD700" />
                        </mesh>
                        <Text
                            position={[0, 0, 0.01]}
                            fontSize={0.25}
                            color="black"
                            anchorX="center"
                            anchorY="middle"
                            fontWeight="bold"
                        >
                            HISS
                        </Text>
                    </group>
                </Billboard>
            )}

            {/* Base */}
            <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[width, 0.2, depth]} />
                <meshStandardMaterial color="#888" />
            </mesh>

            {/* Cage (Elevator Car) - Positioned near ground for now */}
            <group position={[0, cageHeight / 2 + 0.2, 0]}>
                {/* Car Body */}
                <mesh castShadow>
                    {/* Scale cage slightly smaller than full bounding box */}
                    <boxGeometry args={[cageWidth, cageHeight, cageDepth]} />
                    <meshStandardMaterial color="#FFD700" transparent opacity={0.6} />
                </mesh>
                {/* Frame */}
                <mesh>
                    <boxGeometry args={[cageWidth, cageHeight, cageDepth]} />
                    <meshStandardMaterial color="#B8860B" wireframe />
                </mesh>
                {/* Roof */}
                <mesh position={[0, cageHeight / 2, 0]}>
                    <boxGeometry args={[cageWidth + 0.1, 0.1, cageDepth + 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>

            {/* Safety Gate Logic (Visual only) */}
            <group position={[0, 1.25, cageDepth / 2 + 0.1]}>
                <mesh position={[-cageWidth / 2 + 0.1, 0, 0]}>
                    <boxGeometry args={[0.05, 2.5, 0.05]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[cageWidth / 2 - 0.1, 0, 0]}>
                    <boxGeometry args={[0.05, 2.5, 0.05]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>
        </group>
    );
};

// Reusing SignObject structure but specialized for WC if needed, or we can just use the `SignObject` directly if we passed the item correctly.
// However, WCObject is called specifically in ThreeDView. Let's make it look like a Sign.
// We need the texture from the icon.
export const WCObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    // WC is now a sign with a post.
    const poleHeight = 2.5;
    const symbolSize = 0.8;

    const iconUrl = obj.item?.iconUrl;
    const texture = useTexture(iconUrl || '/assets/ikoner/wc.svg');

    useEffect(() => () => { if (texture) texture.dispose() }, [texture]);

    return (
        <group>
            {/* Pole */}
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Sign Plate */}
            <group position={[0, poleHeight, 0]}>
                <mesh rotation={[0, 0, 0]}>
                    <boxGeometry args={[symbolSize, symbolSize, 0.05]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>

                <MemoizedPlane args={[symbolSize - 0.1, symbolSize - 0.1]} position={[0, 0, 0.03]}>
                    <meshStandardMaterial
                        map={texture}
                        transparent
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                    />
                </MemoizedPlane>

                {/* Floor Label */}
                {obj.floorLabel && (
                    <group position={[0, symbolSize / 2 + 0.3, 0]}>
                        <mesh position={[0, 0, 0]}>
                            <planeGeometry args={[1.2, 0.4]} />
                            <meshStandardMaterial color="#000000" transparent opacity={0.8} />
                        </mesh>
                        <Text
                            position={[0, 0, 0.01]}
                            fontSize={0.25}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {obj.floorLabel}
                        </Text>
                    </group>
                )}
            </group>
        </group>
    );
};

export const TippContainerObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    // 3D Visuals for Tippcontainer
    const width = 2.0;
    const length = 4.0; // Long axis
    const height = 1.5;

    // Wedge shape logic
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.lineTo(length, 0);
        s.lineTo(length, height / 2); // Front is lower
        s.lineTo(0, height); // Back is higher
        s.lineTo(0, 0);
        return s;
    }, []);

    const extrudeSettings = {
        depth: width,
        bevelEnabled: false
    };

    const isOpen = !obj.type.includes('stangd');
    const color = '#2962FF';

    return (
        <group>
            {/* The Container Body */}
            <group position={[-length / 2, 0, -width / 2]}> {/* Centering adjustment */}
                <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
                    <extrudeGeometry args={[shape, extrudeSettings]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                </mesh>
            </group>

            {/* Base / Forklift Pockets */}
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[length, 0.2, width - 0.4]} />
                <meshStandardMaterial color="#111" />
            </mesh>

            {/* Lid if closed */}
            {!isOpen && (
                <mesh position={[0, height / 1.3, 0]} rotation={[0, 0, -0.12]}> {/* Slight slope to match top roughly */}
                    <boxGeometry args={[length + 0.2, 0.1, width + 0.1]} />
                    <meshStandardMaterial color="#1565C0" />
                </mesh>
            )}
        </group>
    );
};

export const SignObject = ({ item, obj }: { item: LibraryItem, obj?: APDObject }) => {
    const poleHeight = 3.0; // Taller pole
    const symbolSize = 0.8; // Smaller symbol (was 1.5)
    const texture = useTexture(item.iconUrl!);
    useEffect(() => () => { if (texture) texture.dispose() }, [texture]);

    // Use obj floorLabel if available (passed from parent wrapper)
    const floorLabel = obj?.floorLabel;

    return (
        <group>
            {/* Pole */}
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Pole */}
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Sign Holder (Top) - WRAPPED IN BILLBOARD */}
            <Billboard position={[0, poleHeight, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
                <group>
                    {/* The Ring/Frame */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[symbolSize / 1.4, 0.08, 16, 32]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
                    </mesh>

                    {/* Backing Plate (White circle behind icon for contrast) */}
                    <mesh rotation={[0, 0, 0]}>
                        <circleGeometry args={[symbolSize / 1.4 - 0.02, 32]} />
                        <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
                    </mesh>

                    {/* The Icon */}
                    <MemoizedPlane args={[symbolSize, symbolSize]} position={[0, 0, 0.02]}>
                        <meshStandardMaterial
                            map={texture}
                            transparent
                            side={THREE.DoubleSide}
                            alphaTest={0.5}
                        />
                    </MemoizedPlane>

                    {/* Floor Label */}
                    {floorLabel && (
                        <group position={[0, symbolSize / 2 + 0.4, 0]}>
                            <mesh position={[0, 0, 0]}>
                                <planeGeometry args={[1.5, 0.45]} />
                                <meshStandardMaterial color="#1E293B" transparent opacity={0.9} />
                            </mesh>
                            <Text
                                position={[0, 0, 0.01]}
                                fontSize={0.25}
                                fontWeight="bold"
                                color="#F8FAFC"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {floorLabel}
                            </Text>
                        </group>
                    )}
                </group>
            </Billboard>
        </group>
    );
};

export const GroundMarkingObject = ({ obj, item, scale }: { obj: APDObject, item?: LibraryItem, scale: number }) => {
    const geometry = useMemo(() => {
        // Fallback for objects without points (like standard rectangles)
        if (!obj.points || obj.points.length < 4) {
            if (obj.width && obj.height) {
                const w = obj.width * scale;
                const h = obj.height * scale;
                return new THREE.PlaneGeometry(w, h);
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

    // FIX 2: User wants discrete lines, not big blocks.
    // If we use worldUnits, we must ensure it's not too thick.
    // 1.2m might be too much for a visual "line". Let's reduce significantly.
    // Traffic: 3.5m -> Reduce to 0.5m for "markings" or keep it but make it transparent?
    // User said: "not so wide".

    // Revised widths for "Discrete Markings"
    // Walkway: 0.15m (like a taped line) -> Increased to 0.25m for visibility
    // Traffic: 0.3m -> Increased to 0.4m
    let width = 0.5;
    if (isWalkway) width = 0.25;
    if (isConstructionTraffic) width = 0.4;

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
        <group position={[0, 0.2, 0]}> {/* Raised to 0.2 to avoid Z-fighting with building floors */}
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
                opacity={0.8} // Slightly more visible but still discrete
            />
        </group>
    );
};

export const LineObject = ({ obj, item, scale }: { obj: APDObject, item?: LibraryItem, scale: number }) => {
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

    const color = obj.stroke || obj.item?.stroke || '#000000';
    // Pen lines
    const width = 0.1; // Very thin line (10cm)

    return (
        <group position={[0, 0.2, 0]}>
            <Line
                points={points}
                color={color}
                lineWidth={width}
                worldUnits={true}
            />
        </group>
    );
};
