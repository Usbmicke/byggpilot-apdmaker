import React from 'react';
import { APDObject } from '../../../types';

export const GateObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    const width = (obj.width || 5) * scale;
    const height = 2.0; // Match standard fence height
    const depth = (obj.height || 1.0) * scale; // 2D Height = 3D Depth
    const postSize = 0.3;

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
                    <group position={[0, 0, 0]}>
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
