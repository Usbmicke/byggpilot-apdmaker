import React from 'react';
import { Billboard, Text } from '@react-three/drei';
import { APDObject } from '../../../types';

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
