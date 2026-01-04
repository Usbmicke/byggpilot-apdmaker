import React, { useEffect } from 'react';
import { useTexture, Plane as MemoizedPlane, Text } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject } from '../../../types';

// MemoizedPlane is actually just Plane from drei, imported as such in original file. 
// But let's just use Plane directly. React-three-fiber handles re-renders well.
// If needed we can React.memo it.

export const WCObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    // WC is now a sign with a post.
    const poleHeight = 2.5;
    const symbolSize = 0.8;

    const iconUrl = obj.item?.iconUrl || '/assets/ikoner/wc.svg';
    const texture = useTexture(iconUrl);

    useEffect(() => () => { if (texture) texture.dispose() }, [texture]);

    return (
        <group>
            {/* Pole */}
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Sign Plate */}
            <group position={[0, poleHeight, 0]}>
                <mesh rotation={[0, 0, 0]}>
                    <boxGeometry args={[symbolSize, symbolSize, 0.05]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>

                <group position={[0, 0, 0.03]}>
                    {/* Plane component from drei */}
                    <mesh>
                        <planeGeometry args={[symbolSize - 0.1, symbolSize - 0.1]} />
                        <meshStandardMaterial
                            map={texture}
                            transparent
                            side={THREE.DoubleSide}
                            alphaTest={0.5}
                        />
                    </mesh>
                </group>

                {/* Floor Label */}
                {obj.floorLabel && (
                    <group position={[0, symbolSize / 2 + 0.3, 0]}>
                        <mesh position={[0, 0, 0]}>
                            <planeGeometry args={[1.2, 0.4]} />
                            <meshStandardMaterial color="#000000" transparent opacity={0.8} />
                        </mesh>
                        <Text
                            position={[0, 0, 0.01]}
                            fontSize={0.25}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {obj.floorLabel}
                        </Text>
                    </group>
                )}
            </group>
        </group>
    );
};
