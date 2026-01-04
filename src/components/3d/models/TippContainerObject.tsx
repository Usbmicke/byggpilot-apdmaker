import React, { useMemo } from 'react';
import * as THREE from 'three';
import { APDObject } from '../../../types';

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
