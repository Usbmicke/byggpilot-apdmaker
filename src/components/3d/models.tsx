
import React, { useMemo, useEffect } from 'react';
import { useTexture, Plane, Line } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryItem } from '../../types';
import { SCALE_FACTOR } from '../../utils/coordinateUtils';

// DEFINITIVE FIX: Polygon shapes must have their local Y-coordinate negated when creating the THREE.Shape
// to counteract the inverted Y-axis of the 2D canvas vs. the 3D coordinate system.
// Helper for building facade texture (Subtle/Sophisticated)
const useBuildingTexture = (baseColor: string) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Base Wall (Light Pink)
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 512, 512);

            // Add Subtle Windows
            const cols = 4;
            const rows = 8;
            const padX = 30;
            const padY = 20;
            const winW = (512 - (cols + 1) * padX) / cols;
            const winH = (512 - (rows + 1) * padY) / rows;

            // Window Color: Slightly darker/desaturated pink-grey for "recessed" look
            // Not stark blue.
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // Lighter glass
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'; // Very faint frame
            ctx.lineWidth = 2;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Don't draw windows on bottom row (door level optionally) or top rim
                    const x = padX + c * (winW + padX);
                    const y = padY + r * (winH + padY);

                    // Draw "Recess" (Shadow)
                    ctx.fillStyle = 'rgba(0,0,0,0.05)';
                    ctx.fillRect(x, y, winW, winH);

                    // Draw Glass (Subtle)
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.fillRect(x + 2, y + 2, winW - 4, winH - 4);

                    // Frame
                    ctx.strokeRect(x, y, winW, winH);
                }
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Repeat texture based on assumption 1 unit = 1 floor? 
        // We'll scale it in the component
        return texture;
    }, [baseColor]);
};

export const PolygonObject = ({ obj }: { obj: APDObject }) => {
    const isBuilding = obj.type === 'building';

    // Config
    const color = isBuilding ? '#FFC0CB' : (obj.item.fill || '#aaaaaa');
    const roofColor = '#CCCCCC'; // Light Grey Roof (Previously too dark)
    const buildingTexture = useBuildingTexture(color);

    // Geometry generation
    const geometry = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return null;

        const shapePoints = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i]) * SCALE_FACTOR;
            const localY = -(obj.points[i + 1]) * SCALE_FACTOR; // Correct 2D->3D Logic
            shapePoints.push(new THREE.Vector2(localX, localY));
        }

        const shape = new THREE.Shape(shapePoints);
        const extrudeSettings = {
            depth: obj.height3d || (isBuilding ? 8 : 1),
            bevelEnabled: isBuilding, // Add bevel for buildings for realism
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelSegments: 2
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Calculate UVs properly for walls (box projection approximation or simple scale)
        // By default ExtrudeGeometry side UVs are roughly 0..1 per segment.
        // We want world-scale mapping.
        // Quick fix: Multiply UVs by world scale
        const uvAttribute = geo.attributes.uv;
        if (uvAttribute) {
            for (let i = 0; i < uvAttribute.count; i++) {
                // Creating specific UV mapping for sides is complex without modifying geometry data deeply
                // But simply scaling repeat works for now if we use box mapping or similar.
                // We'll rely on texture.repeat.
            }
        }
        return geo;

    }, [obj.points, obj.x, obj.y, obj.height3d, isBuilding]);

    // Update texture scale
    useEffect(() => {
        if (isBuilding && geometry) {
            // Rough estimate: 1 repeat per 4 meters width, 1 repeat per 4 meters height
            // Since UVs on ExtrudeGeometry sides are weird, this is experimental.
            // Often side UVs are (0,0) to S length.
            buildingTexture.repeat.set(0.2, 0.2);
        }
    }, [buildingTexture, isBuilding, geometry]);


    // Edges for buildings
    const edgesGeometry = useMemo(() => {
        if (!geometry || !isBuilding) return null;
        return new THREE.EdgesGeometry(geometry, 25);
    }, [geometry, isBuilding]);

    if (!geometry) return null;

    if (isBuilding) {
        return (
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <mesh geometry={geometry} castShadow receiveShadow>
                    {/* Material 0: Front/Back (Top/Bottom in our rotation) -> ROOF */}
                    <meshStandardMaterial attach="material-0" color={roofColor} roughness={0.9} />
                    {/* Material 1: Sides -> FACADE */}
                    <meshStandardMaterial attach="material-1" map={buildingTexture} color={color} roughness={0.8} />
                </mesh>
                {edgesGeometry && (
                    <lineSegments geometry={edgesGeometry}>
                        <lineBasicMaterial color="#444444" linewidth={1} />
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

export const CraneObject = ({ obj }: { obj: APDObject }) => {
    const towerHeight = 30;
    const jibLength = (obj.radius || 25) * SCALE_FACTOR;
    const counterweightLength = jibLength * 0.3;
    const jibY = towerHeight - 1.5;

    return (
        <group rotation={[0, THREE.MathUtils.degToRad(obj.rotation || 0), 0]}>
            {/* Tower Base */}
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[4, 2, 4]} />
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

export const SiteShedObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 8) * SCALE_FACTOR;
    const depth = (obj.height || 2.5) * SCALE_FACTOR;
    const height = 2.6; // Standard cabin height
    const color = '#FA8128'; // Construction Orange
    const roofColor = '#333333';

    // Determine orientation
    const isHorizontal = width > depth;
    const longLen = isHorizontal ? width : depth;
    // Window logic: One window every ~2.5m
    const windowCount = Math.max(1, Math.floor(longLen / 2.5));
    const windowSpacing = longLen / (windowCount + 1);

    return (
        <group>
            {/* Main Body */}
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
            </mesh>

            {/* Roof (Cap) */}
            <mesh castShadow position={[0, height + 0.1, 0]}>
                <boxGeometry args={[width + 0.2, 0.2, depth + 0.2]} />
                <meshStandardMaterial color={roofColor} roughness={0.9} />
            </mesh>

            {/* Windows (on "Front" long side) */}
            {Array.from({ length: windowCount }).map((_, i) => {
                const offset = -longLen / 2 + (i + 1) * windowSpacing;

                // If Horizontal(Wide): Place along X axis, on Z+ face
                // If Vertical(Deep): Place along Z axis, on X+ face
                const wx = isHorizontal ? offset : (width / 2 + 0.01);
                const wz = isHorizontal ? (depth / 2 + 0.01) : offset;
                const wRot = isHorizontal ? 0 : -Math.PI / 2;

                return (
                    <mesh key={`win-${i}`} position={[wx, height / 2, wz]} rotation={[0, wRot, 0]}>
                        <planeGeometry args={[1.0, 1.2]} />
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
                return (
                    <mesh position={[dx, height / 2 - 0.2, dz]} rotation={[0, dRot, 0]}>
                        <planeGeometry args={[0.9, 2.0]} />
                        <meshStandardMaterial color="#F5F5F5" />
                    </mesh>
                )
            })()}

            {/* Concrete Feet/Foundation Blocks (Corners) */}
            {[1, -1].map(xDir => [1, -1].map(zDir => (
                <mesh key={`foot-${xDir}-${zDir}`} position={[xDir * (width / 2 - 0.5), 0.1, zDir * (depth / 2 - 0.5)]}>
                    <boxGeometry args={[0.4, 0.2, 0.4]} />
                    <meshStandardMaterial color="#888888" />
                </mesh>
            )))}
        </group>
    );
};

export const ContainerObject = ({ obj }: { obj: APDObject }) => {
    // 2D Dimensions (from obj) are ignored for visual geometry to separate 2D icon from 3D model
    // 3D Dimensions (Hardcoded for realism)
    let realWidth = 6;
    let realDepth = 2.4;

    if (obj.type.includes('container-30')) {
        realWidth = 9;
        realDepth = 3;
    } else if (obj.type.includes('tipp')) {
        realWidth = 7;
        realDepth = 3;
    }

    const width = realWidth;
    const depth = realDepth;
    const height = 2.6; // Standard height

    // Determine Type & Color
    let color = '#76FF03'; // Default Green (10m3)
    let isOpen = false;
    let wallThickness = 0.1;

    if (obj.type.includes('container-30')) {
        color = '#00E5FF'; // Cyan
        isOpen = true; // User requested "Open" style for 30m3
    } else if (obj.type.includes('tipp')) {
        color = '#2962FF'; // Blue
        isOpen = !obj.type.includes('stangd');
    }

    // Geometry Construction
    return (
        <group>
            {/* Floor */}
            <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[width, 0.2, depth]} />
                <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
            </mesh>

            {!isOpen && (
                // Closed Top
                <mesh castShadow position={[0, height, 0]}>
                    <boxGeometry args={[width, 0.1, depth]} />
                    <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                </mesh>
            )}

            {/* Walls (Front/Back) - Long sides */}
            {[1, -1].map(dir => (
                <group key={`wall-z-${dir}`} position={[0, height / 2, dir * (depth / 2 - wallThickness / 2)]}>
                    <mesh>
                        <boxGeometry args={[width, height, wallThickness]} />
                        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                    </mesh>
                    {/* Ribs */}
                    {[...Array(Math.floor(width / 0.5))].map((_, i) => (
                        <mesh key={i} position={[-width / 2 + (i + 0.5) * 0.5, 0, dir * wallThickness]} >
                            <boxGeometry args={[0.2, height - 0.2, 0.05]} />
                            <meshStandardMaterial color={color} roughness={0.8} />
                        </mesh>
                    ))}
                </group>
            ))}

            {/* Walls (Left/Right) - Short ends */}
            {[1, -1].map(dir => (
                <group key={`wall-x-${dir}`} position={[dir * (width / 2 - wallThickness / 2), height / 2, 0]}>
                    <mesh>
                        <boxGeometry args={[wallThickness, height, depth - 2 * wallThickness]} />
                        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                    </mesh>
                    {/* Detail on door/end */}
                    {dir === -1 && !isOpen && (
                        <mesh position={[-wallThickness, 0, 0]}>
                            <boxGeometry args={[0.05, height - 0.2, depth / 2]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>
                    )}
                </group>
            ))}

            {/* Rubble/Fill for Open Containers (Visual Feedback) */}
            {isOpen && (
                <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[width - 0.5, depth - 0.5]} />
                    <meshStandardMaterial color="#444" roughness={1} />
                </mesh>
            )}
        </group>
    );
}

export const GenericWorkshopObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 4) * SCALE_FACTOR;
    const depth = (obj.height || 4) * SCALE_FACTOR;
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
const useHatchTexture = (color: string) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = color + '33'; // Low opacity background
            ctx.fillRect(0, 0, 64, 64);

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Diagonals
            for (let i = -64; i < 128; i += 16) {
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 64, 64);
            }
            ctx.stroke();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }, [color]);
};

export const FenceObject = ({ obj }: { obj: APDObject }) => {
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
            const localX = (obj.points[i]) * SCALE_FACTOR;
            const localZ = (obj.points[i + 1]) * SCALE_FACTOR;
            result.push(new THREE.Vector3(localX, 0, localZ));
        }
        return result;
    }, [obj.points, obj.x, obj.y]);

    const renderedParts = useMemo(() => {
        const parts: React.ReactNode[] = [];

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const dist = p1.distanceTo(p2);
            const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

            // Calculate how many segments we need
            const totalSegments = Math.max(1, Math.round(dist / segmentLength));
            const actualSegmentLen = dist / totalSegments;

            // Generate posts and panels along the line
            for (let j = 0; j < totalSegments; j++) {
                const t = j / totalSegments;
                const nextT = (j + 1) / totalSegments;

                // Position for this segment's start post
                const segX = THREE.MathUtils.lerp(p1.x, p2.x, t);
                const segZ = THREE.MathUtils.lerp(p1.z, p2.z, t);

                // Midpoint for the panel (mesh)
                const midX = THREE.MathUtils.lerp(p1.x, p2.x, (t + nextT) / 2);
                const midZ = THREE.MathUtils.lerp(p1.z, p2.z, (t + nextT) / 2);

                // Add Post
                parts.push(
                    <mesh key={`post-${i}-${j}`} position={[segX, fenceHeight / 2, segZ]} castShadow>
                        <cylinderGeometry args={[postRadius, postRadius, fenceHeight, 8]} />
                        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
                    </mesh>
                );

                // Add Mesh Panel
                const clonedTexture = fenceTexture.clone();
                clonedTexture.repeat.set(actualSegmentLen, 2); // 1 unit texture per meter roughly
                clonedTexture.needsUpdate = true;

                parts.push(
                    <mesh
                        key={`panel-${i}-${j}`}
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
        }
        // Add final post at the very end
        if (points.length > 0) {
            const lastP = points[points.length - 1];
            parts.push(
                <mesh key={`post-last`} position={[lastP.x, fenceHeight / 2, lastP.z]} castShadow>
                    <cylinderGeometry args={[postRadius, postRadius, fenceHeight, 8]} />
                    <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
                </mesh>
            );
        }

        return parts;
    }, [points, fenceTexture]);

    return <group>{renderedParts}</group>;
};

export const GateObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 5) * SCALE_FACTOR;
    const height = 2.5; // Taller
    const postSize = 0.3;

    return (
        <group>
            {/* Gate Posts */}
            <mesh castShadow position={[-width / 2, height / 2, 0]}>
                <boxGeometry args={[postSize, height + 0.5, postSize]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh castShadow position={[width / 2, height / 2, 0]}>
                <boxGeometry args={[postSize, height + 0.5, postSize]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Gate Wings */}
            <mesh castShadow position={[-width / 4, height / 2, 0]} rotation={[0, -Math.PI / 4, 0]}>
                <boxGeometry args={[width / 2, height, 0.1]} />
                <meshStandardMaterial color="#00E676" transparent opacity={0.8} />
                {/* Wireframe/Detail effect could go here */}
            </mesh>
            <mesh castShadow position={[width / 4, height / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[width / 2, height, 0.1]} />
                <meshStandardMaterial color="#00E676" transparent opacity={0.8} />
            </mesh>
        </group>
    )
}

export const HissObject = ({ obj }: { obj: APDObject }) => {
    const height = 15; // Standard hoist height
    const cageWidth = 2.5;
    const cageDepth = 2.5;
    const cageHeight = 3.0;
    const mastWidth = 0.8;

    return (
        <group>
            {/* Mast (Lattice structure) */}
            <mesh castShadow position={[0, height / 2, -cageDepth / 2 - mastWidth / 2]}>
                <boxGeometry args={[mastWidth, height, mastWidth]} />
                <meshStandardMaterial color="#555" wireframe={false} />
            </mesh>
            {/* Lattice detail (visual trick) */}
            <mesh position={[0, height / 2, -cageDepth / 2 - mastWidth / 2]}>
                <boxGeometry args={[mastWidth + 0.05, height, mastWidth + 0.05]} />
                <meshStandardMaterial color="#333" wireframe />
            </mesh>

            {/* Base */}
            <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
                <boxGeometry args={[cageWidth + 1, 0.4, cageDepth + 2]} />
                <meshStandardMaterial color="#888" />
            </mesh>

            {/* Cage (Elevator Car) - Positioned near ground for now */}
            <group position={[0, cageHeight / 2 + 0.4, 0]}>
                {/* Car Body */}
                <mesh castShadow>
                    <boxGeometry args={[cageWidth, cageHeight, cageDepth]} />
                    <meshStandardMaterial color="#FFD700" transparent opacity={0.4} />
                    {/* Yellow mesh look */}
                </mesh>
                {/* Frame */}
                <mesh>
                    <boxGeometry args={[cageWidth, cageHeight, cageDepth]} />
                    <meshStandardMaterial color="#DAA520" wireframe />
                </mesh>
                {/* Roof */}
                <mesh position={[0, cageHeight / 2, 0]}>
                    <boxGeometry args={[cageWidth + 0.1, 0.1, cageDepth + 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>

            {/* Safety Gate at Ground Level */}
            <mesh position={[0, 1.2, cageDepth / 2 + 0.1]}>
                <boxGeometry args={[cageWidth, 2.4, 0.1]} />
                <meshStandardMaterial color="#DAA520" visible={false} />
                {/* Invisible trigger or just decorative */}
            </mesh>
            <group position={[0, 1.25, cageDepth / 2]}>
                <mesh position={[-cageWidth / 2 + 0.1, 0, 0]}>
                    <boxGeometry args={[0.1, 2.5, 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[cageWidth / 2 - 0.1, 0, 0]}>
                    <boxGeometry args={[0.1, 2.5, 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>
        </group>
    );
};

export const WCObject = ({ obj }: { obj: APDObject }) => {
    // Standard portable toilet dimensions
    const width = 1.2;
    const depth = 1.2;
    const height = 2.4;
    const color = '#1E88E5'; // Classic Blue

    return (
        <group>
            {/* Main Body */}
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>

            {/* Roof (White translucent or just white cap) */}
            <mesh position={[0, height + 0.1, 0]}>
                <boxGeometry args={[width + 0.1, 0.2, depth + 0.1]} />
                <meshStandardMaterial color="#EEE" />
            </mesh>

            {/* Ventilation Pipe */}
            <mesh position={[width / 3, height + 0.4, -depth / 3]}>
                <cylinderGeometry args={[0.08, 0.08, 0.6]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Door Detail */}
            <mesh position={[0, height / 2 - 0.1, depth / 2 + 0.01]}>
                <planeGeometry args={[width - 0.2, height - 0.4]} />
                <meshStandardMaterial color={color} polygonOffset polygonOffsetFactor={-1} />
            </mesh>
            {/* Door Outline/Gap */}
            <mesh position={[0.4, height / 2, depth / 2 + 0.02]}>
                <boxGeometry args={[0.05, 0.2, 0.05]} />
                <meshStandardMaterial color="#333" /> {/* Handle */}
            </mesh>
        </group>
    );
};

export const TippContainerObject = ({ obj }: { obj: APDObject }) => {
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

export const SignObject = ({ item }: { item: LibraryItem }) => {
    const poleHeight = 3.0; // Taller pole
    const symbolSize = 1.5; // Larger symbol
    const texture = useTexture(item.iconUrl!);
    useEffect(() => () => { if (texture) texture.dispose() }, [texture]);

    return (
        <group>
            {/* Pole */}
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Sign Holder (Top) */}
            <group position={[0, poleHeight, 0]}>
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
            </group>
        </group>
    );
};

export const GroundMarkingObject = ({ obj }: { obj: APDObject }) => {
    const geometry = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return null;

        const shapePoints = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i]) * SCALE_FACTOR;
            const localY = -(obj.points[i + 1]) * SCALE_FACTOR;
            shapePoints.push(new THREE.Vector2(localX, localY));
        }
        const shape = new THREE.Shape(shapePoints);
        return new THREE.ShapeGeometry(shape);
    }, [obj.points, obj.x, obj.y]);

    let baseColor = obj.item.fill || '#FFFFFF';

    if (obj.type === 'schakt') baseColor = '#FF1744'; // Reddish for excavation (matches 2D)
    if (obj.type.includes('traffic')) baseColor = '#FBBF24';
    if (obj.type.includes('pedestrian')) baseColor = '#3B82F6';
    if (obj.type.includes('unloading')) baseColor = '#F87171';
    if (obj.type.includes('storage')) baseColor = '#A78BFA';

    const hatchTexture = useHatchTexture(baseColor);

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
        <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
            <meshBasicMaterial
                map={hatchTexture}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
                depthWrite={false} // Prevent z-fighting
            />
        </mesh>
    );
}

export const PathObject = ({ obj }: { obj: APDObject }) => {
    const points = useMemo(() => {
        if (!obj.points || obj.points.length < 2) return [];
        const result = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i]) * SCALE_FACTOR;
            const localZ = (obj.points[i + 1]) * SCALE_FACTOR;
            result.push(new THREE.Vector3(localX, 0.05, localZ));
        }
        return result;
    }, [obj.points, obj.x, obj.y]);

    const color = obj.item.stroke || '#FFFFFF';
    // Dramatically increase width for visibility. 2D strokeWidth is e.g. 5 or 25.
    // Drei Line lineWidth is pixels (if not world units).
    // Let's make it thicker.
    const width = (obj.item.strokeWidth || 5) * 1;

    return (
        <Line
            points={points}
            color={color}
            lineWidth={width}
            dashed={!!obj.item.dash}
            dashScale={1}
            dashSize={5}
            gapSize={3}
            position={[0, 0.15, 0]} // Raise slightly higher
        />
    );
};
