import React, { useEffect } from 'react';
import { useTexture, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryItem } from '../../../types';

export const SignObject = ({ item, obj }: { item: LibraryItem, obj?: APDObject }) => {
    const poleHeight = 3.0; // Taller pole
    const symbolSize = 0.8; // Smaller symbol (was 1.5)

    // QA FIX: Safety check for iconUrl to prevent crash
    const url = item?.iconUrl || '/assets/ikoner/skylt_varning.svg';
    // We assume a default exists, or we handle null.
    // useTexture needs a valid url. valid url string at least.

    // If no URL at all, we can't render the texture part.
    // However, hooks cannot be conditional.
    // Best practice: Pass a valid default transparent pixel or similar if missing, 
    // OR ensure the component is not rendered by parent if missing.
    // Parent `ThreeDView` has fallbacks but `SignObject` is called for symbols.

    const texture = useTexture(url);
    useEffect(() => () => { if (texture) texture.dispose() }, [texture]);

    // Use obj floorLabel if available (passed from parent wrapper)
    const floorLabel = obj?.floorLabel;

    return (
        <group>
            {/* Pole */}
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Pole */}
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Sign Holder (Top) - WRAPPED IN BILLBOARD */}
            <Billboard position={[0, poleHeight, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
                <group>
                    {/* The Ring/Frame */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[symbolSize / 1.4, 0.08, 16, 32]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
                    </mesh>

                    {/* Backing Plate (White circle behind icon for contrast) */}
                    <mesh rotation={[0, 0, 0]}>
                        <circleGeometry args={[symbolSize / 1.4 - 0.02, 32]} />
                        <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
                    </mesh>

                    {/* The Icon */}
                    <mesh position={[0, 0, 0.02]}>
                        <planeGeometry args={[symbolSize, symbolSize]} />
                        <meshStandardMaterial
                            map={texture}
                            transparent
                            side={THREE.DoubleSide}
                            alphaTest={0.5}
                        />
                    </mesh>

                    {/* Floor Label */}
                    {floorLabel && (
                        <group position={[0, symbolSize / 2 + 0.4, 0]}>
                            <mesh position={[0, 0, 0]}>
                                <planeGeometry args={[1.5, 0.45]} />
                                <meshStandardMaterial color="#1E293B" transparent opacity={0.9} />
                            </mesh>
                            <Text
                                position={[0, 0, 0.01]}
                                fontSize={0.25}
                                fontWeight="bold"
                                color="#F8FAFC"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {floorLabel}
                            </Text>
                        </group>
                    )}
                </group>
            </Billboard>
        </group>
    );
};
