import React from 'react';
import { APDObject } from '../../../types';

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
