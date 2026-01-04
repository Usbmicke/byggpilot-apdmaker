import React from 'react';

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
