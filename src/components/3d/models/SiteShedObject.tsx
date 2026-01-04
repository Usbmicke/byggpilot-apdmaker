import React from 'react';
import { Billboard, Text } from '@react-three/drei';
import { APDObject } from '../../../types';

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

            {/* TEXT LABEL ON ROOF - Billboarded for readability */}
            <Billboard
                position={[0, height + 0.5, 0]} // Closer to roof
                follow={true}
                lockX={false}
                lockY={false}
                lockZ={false}
            >
                <Text
                    fontSize={Math.min(width, depth) * 0.4} // Dynamic size relative to shed
                    color="white"
                    outlineWidth={0.05}
                    outlineColor="black"
                    anchorX="center"
                    anchorY="middle"
                >
                    {obj.type === 'kontor' ? 'KONTOR' : 'BYGGBOD'}
                </Text>
            </Billboard>
        </group>
    );
};
