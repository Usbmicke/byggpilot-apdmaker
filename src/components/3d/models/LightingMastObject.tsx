import React from 'react';
import { HighVisPoleRing } from './HighVisPoleRing';

export const LightingMastObject = () => {
    const poleHeight = 15;
    return (
        <group>
            {/* High Vis Base Ring */}
            <HighVisPoleRing radius={2.0} />

            {/* Thicker Pole */}
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.3, 0.4, poleHeight, 16]} />
                <meshStandardMaterial color="#A0A0A0" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Lamp Head */}
            <group position={[0, poleHeight, 0]} rotation={[0, 0, -Math.PI / 8]}>
                <mesh castShadow >
                    <boxGeometry args={[2.0, 0.5, 2.0]} />
                    <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.8} />
                </mesh>
            </group>
        </group>
    );
};

