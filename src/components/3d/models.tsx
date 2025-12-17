
import React, { useMemo } from 'react';
import { useTexture, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryItem } from '../../types';
import { SCALE_FACTOR } from '../../utils/coordinateUtils';

// Generic component for simple box-like structures
const SimpleBox = ({ width, height, depth, color, position }) => (
    <mesh castShadow position={position}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} />
    </mesh>
);

export const CraneObject = ({ obj }: { obj: APDObject }) => {
    const height = 30;
    const armLength = (obj.width || 25) * SCALE_FACTOR;
    return (
        <group rotation={[0, THREE.MathUtils.degToRad(90), 0]}> 
            <SimpleBox width={1.5} height={height} depth={1.5} color="#FFD700" position={[0, height / 2, 0]} />
            <SimpleBox width={2} height={1.5} depth={2} color="#333333" position={[1.5, height - 2, 0]} />
            <SimpleBox width={armLength} height={1.5} depth={1.5} color="#FFD700" position={[armLength / 2, height, 0]} />
            <SimpleBox width={armLength * 0.25} height={3} depth={3} color="#555555" position={[-armLength * 0.125, height - 1.5, 0]} />
            <mesh position={[armLength * 0.7, height / 2, 0]}>
                <cylinderGeometry args={[0.1, 0.1, height, 8]} />
                <meshStandardMaterial color="#444444" />
            </mesh>
        </group>
    );
};

export const SiteShedObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 8) * SCALE_FACTOR;
    const depth = (obj.height || 2.5) * SCALE_FACTOR;
    const height = 2.5;
    const color = obj.type === 'office' ? '#E0E0E0' : '#3B82F6';
    return (
        <group position={[width / 2, 0, depth / 2]}>
             <SimpleBox width={width} height={height} depth={depth} color={color} position={[0, height/2, 0]} />
             {[ -width/2, width/2 ].map(x => 
                 [ -depth/2, depth/2 ].map(z => 
                    <SimpleBox key={`${x}-${z}`} width={0.2} height={0.3} depth={0.2} color="#444444" position={[x*0.9, 0.15, z*0.9]} />
                 )
             )}
        </group>
    );
};

export const ContainerObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 6) * SCALE_FACTOR;
    const depth = (obj.height || 2.4) * SCALE_FACTOR;
    const height = 2.6;
    let color = '#22C55E'; // Default green (10m3)
    if (obj.type === 'container_30') color = '#EF4444'; // Red for 30m3
    if (obj.type === 'container_open_tipper') color = '#F59E0B'; // Amber for open tipper
    if (obj.type === 'container_closed_tipper') color = '#8B5CF6'; // Violet for closed tipper

    return (
        <group position={[width / 2, height / 2, depth / 2]}>
            <SimpleBox width={width} height={height} depth={depth} color={color} position={[0, 0, 0]} />
        </group>
    );
}

export const GenericWorkshopObject = ({ obj }: { obj: APDObject }) => {
    const width = (obj.width || 4) * SCALE_FACTOR;
    const depth = (obj.height || 4) * SCALE_FACTOR;
    const height = 3.5;
    const color = obj.type === 'saw_shed' ? '#A1662F' : '#6B7280'; // Brown for saw, grey for rebar
    return (
        <group position={[width / 2, 0, depth / 2]}>
            <SimpleBox width={width} height={height} depth={depth} color={color} position={[0, height/2, 0]} />
        </group>
    );
}

export const LightingMastObject = () => {
    const poleHeight = 15;
    return (
        <group>
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.2, 0.25, poleHeight, 12]} />
                <meshStandardMaterial color="#A0A0A0" />
            </mesh>
            <mesh castShadow position={[0, poleHeight, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.8} />
            </mesh>
        </group>
    );
};

export const FenceObject = ({ obj }: { obj: APDObject }) => {
    const fenceHeight = 2.0;
    const postRadius = 0.05;
    const points = useMemo(() => {
        const result = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            result.push(new THREE.Vector3(obj.points[i] * SCALE_FACTOR, 0, -obj.points[i + 1] * SCALE_FACTOR));
        }
        return result;
    }, [obj.points]);

    return (
        <group>
            {points.map((p, i) => (
                <React.Fragment key={i}>
                    <mesh position={[p.x, fenceHeight / 2, p.z]} castShadow>
                        <cylinderGeometry args={[postRadius, postRadius, fenceHeight, 8]} />
                        <meshStandardMaterial color="#777777" />
                    </mesh>
                    {i < points.length - 1 && (
                         <Plane args={[p.distanceTo(points[i+1]), fenceHeight]} position={[(p.x + points[i+1].x) / 2, fenceHeight / 2, (p.z + points[i+1].z) / 2]} lookAt={points[i+1]}>
                            <meshStandardMaterial color="#555555" transparent opacity={0.6} side={THREE.DoubleSide} />
                        </Plane>
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
        <group position={[width/2, 0, 0]}>
            <SimpleBox width={width} height={height} depth={0.2} color="#DC2626" position={[0, height/2, 0]} />
        </group>
    )
}

// Fallback for simple signs
export const SignObject = ({ item }: { item: LibraryItem }) => {
    const poleHeight = 2.5;
    const symbolSize = 1.0;
    const texture = useTexture(item.iconUrl!);
    return (
        <group>
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            <Plane args={[symbolSize, symbolSize]} position={[0, poleHeight + symbolSize / 2, 0]}>
                <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
            </Plane>
        </group>
    );
};


// ==================================================================
// GROUND MARKINGS (Phase 3)
// ==================================================================

export const GroundMarkingObject = ({ obj }: { obj: APDObject }) => {
    const geometry = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return null;
        const shapePoints = obj.points.map((p, i) => i % 2 === 0 ? p * SCALE_FACTOR : -p * SCALE_FACTOR);
        const shape = new THREE.Shape(shapePoints.map((v,i) => i % 2 === 0 ? new THREE.Vector2(shapePoints[i], shapePoints[i+1]) : null).filter(v=>v));
        return new THREE.ShapeGeometry(shape);
    }, [obj.points]);

    let color = obj.item.fill || '#FFFFFF';
    let opacity = 0.5;

    if(obj.type === 'zone_construction_traffic') color = '#FBBF24';
    if(obj.type === 'zone_pedestrian_path') color = '#3B82F6';
    if(obj.type === 'zone_unloading') color = '#F87171';
    if(obj.type === 'zone_material_storage') color = '#A78BFA';

    return (
        <mesh geometry={geometry} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
             <meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
        </mesh>
    );
}
