
import React, { useMemo, useEffect } from 'react';
import { useTexture, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryItem } from '../../types';
import { SCALE_FACTOR } from '../../utils/coordinateUtils';

// DEFINITIVE FIX: Polygon shapes must have their local Y-coordinate negated when creating the THREE.Shape
// to counteract the inverted Y-axis of the 2D canvas vs. the 3D coordinate system.
export const PolygonObject = ({ obj }: { obj: APDObject }) => {
    const geometry = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return null;

        const shapePoints = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i] - obj.x) * SCALE_FACTOR;
            const localY = -(obj.points[i+1] - obj.y) * SCALE_FACTOR; // Negating Y to fix mirroring.
            shapePoints.push(new THREE.Vector2(localX, localY));
        }

        const shape = new THREE.Shape(shapePoints);
        const extrudeSettings = { depth: obj.height3d || 3, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [obj.points, obj.x, obj.y, obj.height3d]);

    useEffect(() => () => { if (geometry) geometry.dispose(); }, [geometry]);

    return (
        <mesh geometry={geometry} castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={obj.item.fill || '#C2B280'} side={THREE.DoubleSide} />
        </mesh>
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
            <mesh castShadow position={[0, towerHeight / 2, 0]}>
                <boxGeometry args={[1.5, towerHeight, 1.5]} />
                <meshStandardMaterial color="#FFD700" />
            </mesh>
            <mesh castShadow position={[jibLength / 2, jibY, 0]}>
                <boxGeometry args={[jibLength, 1, 1.5]} />
                <meshStandardMaterial color="#FFD700" />
            </mesh>
            <mesh castShadow position={[-counterweightLength / 2, jibY, 0]}>
                <boxGeometry args={[counterweightLength, 1.5, 1.5]} />
                <meshStandardMaterial color="#FFD700" />
            </mesh>
            <mesh castShadow position={[-counterweightLength, jibY, 0]}>
                <boxGeometry args={[2, 3, 3]} />
                <meshStandardMaterial color="#555555" />
            </mesh>
             <mesh position={[jibLength * 0.7, jibY - 1, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
                <meshStandardMaterial color="#444444" />
            </mesh>
        </group>
    );
};

export const SiteShedObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 8) * SCALE_FACTOR;
    const depth = (obj.height || 2.5) * SCALE_FACTOR;
    const height = 2.5;
    const roofHeight = 0.3;
    const color = obj.type === 'office' ? '#E0E0E0' : '#3B82F6';

    return (
        <group>
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[0, height + roofHeight / 2, 0]}>
                <boxGeometry args={[width, roofHeight, depth]} />
                <meshStandardMaterial color="#666666" />
            </mesh>
             {[ -width/2, width/2 ].map(x => 
                 [ -depth/2, depth/2 ].map(z => 
                    <mesh key={`${x}-${z}`} position={[x*0.9, 0.15, z*0.9]}>
                        <boxGeometry args={[0.2, 0.3, 0.2]} />
                        <meshStandardMaterial color="#444444" />
                    </mesh>
                 )
             )}
        </group>
    );
};

export const ContainerObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 6) * SCALE_FACTOR;
    const depth = (obj.height || 2.4) * SCALE_FACTOR;
    const height = 2.6;
    let color = '#22C55E';
    if (obj.type.includes('30')) color = '#EF4444';

    return (
        <group>
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {[...Array(10)].map((_, i) => (
                <mesh key={i} position={[-width / 2 + (i + 0.5) * (width/10), height / 2, depth/2]}>
                    <boxGeometry args={[0.05, height, 0.05]} />
                    <meshStandardMaterial color={color} metalness={0.5} roughness={0.8} />
                </mesh>
            ))}
             {[...Array(10)].map((_, i) => (
                <mesh key={i} position={[-width / 2 + (i + 0.5) * (width/10), height / 2, -depth/2]}>
                    <boxGeometry args={[0.05, height, 0.05]} />
                    <meshStandardMaterial color={color} metalness={0.5} roughness={0.8} />
                </mesh>
            ))}
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
            <group position={[0, poleHeight, 0]} rotation={[0,0, -Math.PI / 8]}>
                <mesh castShadow >
                    <boxGeometry args={[1.5, 0.4, 1.5]} />
                    <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.8} />
                </mesh>
            </group>
        </group>
    );
};

export const FenceObject = ({ obj }: { obj: APDObject }) => {
    const fenceHeight = 2.0;
    const postRadius = 0.05;
    const points = useMemo(() => {
        if (!obj.points || obj.points.length < 2) return [];
        const result = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i] - obj.x) * SCALE_FACTOR;
            const localZ = -(obj.points[i + 1] - obj.y) * SCALE_FACTOR; // Correctly negate to handle coordinate system difference
            result.push(new THREE.Vector3(localX, 0, localZ));
        }
        return result;
    }, [obj.points, obj.x, obj.y]);

    return (
        <group>
            {points.map((p, i) => (
                <React.Fragment key={i}>
                    <mesh position={[p.x, fenceHeight / 2, p.z]} castShadow>
                        <cylinderGeometry args={[postRadius, postRadius, fenceHeight, 8]} />
                        <meshStandardMaterial color="#777777" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {i < points.length - 1 && (
                         <MemoizedPlane args={[p.distanceTo(points[i+1]), fenceHeight]} position={[(p.x + points[i+1].x) / 2, fenceHeight / 2, (p.z + points[i+1].z) / 2]} lookAt={points[i+1]}>
                            <meshStandardMaterial wireframe color="#AAAAAA" transparent opacity={0.7} side={THREE.DoubleSide} />
                        </MemoizedPlane>
                    )}
                </React.Fragment>
            ))}
        </group>
    );
};

export const GateObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 5) * SCALE_FACTOR;
    const height = 2.2;
    return (
        <group>
             <mesh castShadow position={[-width/4, height/2, 0]} rotation={[0, -Math.PI/4, 0]}>
                <boxGeometry args={[width/2, height, 0.2]} />
                <meshStandardMaterial color="#DC2626" />
            </mesh>
             <mesh castShadow position={[width/4, height/2, 0]} rotation={[0, Math.PI/4, 0]}>
                <boxGeometry args={[width/2, height, 0.2]} />
                <meshStandardMaterial color="#DC2626" />
            </mesh>
        </group>
    )
}

export const SignObject = ({ item }: { item: LibraryItem }) => {
    const poleHeight = 2.5;
    const symbolSize = 1.0;
    const texture = useTexture(item.iconUrl!);
    useEffect(() => () => { if(texture) texture.dispose() }, [texture]);

    return (
        <group>
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
            </mesh>
            <MemoizedPlane args={[symbolSize, symbolSize]} position={[0, poleHeight, 0]}>
                <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
            </MemoizedPlane>
        </group>
    );
};

export const GroundMarkingObject = ({ obj }: { obj: APDObject }) => {
    const geometry = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return null;

        const shapePoints = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i] - obj.x) * SCALE_FACTOR;
            const localY = -(obj.points[i + 1] - obj.y) * SCALE_FACTOR; // Negating Y to fix mirroring.
            shapePoints.push(new THREE.Vector2(localX, localY));
        }
        const shape = new THREE.Shape(shapePoints);
        return new THREE.ShapeGeometry(shape);
    }, [obj.points, obj.x, obj.y]);

    useEffect(() => () => { if (geometry) geometry.dispose() }, [geometry]);

    let color = obj.item.fill || '#FFFFFF';
    let opacity = 0.5;

    if (obj.type === 'schakt') color = '#8D6E63';
    if (obj.type.includes('traffic')) color = '#FBBF24';
    if (obj.type.includes('pedestrian')) color = '#3B82F6';
    if (obj.type.includes('unloading')) color = '#F87171';
    if (obj.type.includes('storage')) color = '#A78BFA';

    return (
        <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
             <meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
        </mesh>
    );
}
