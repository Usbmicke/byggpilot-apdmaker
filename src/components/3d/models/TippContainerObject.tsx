import React, { useMemo } from 'react';
import * as THREE from 'three';
import { APDObject } from '../../../types';

export const TippContainerObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    // RAGNSELLS STYLE DUMPSTER (Tippcontainer)
    // Dimensions
    const length = 4.0;
    const width = 2.0;
    const heightBack = 1.8;
    const heightFront = 1.0;
    const wallThickness = 0.1;
    const ribThickness = 0.08;

    const isOpen = !obj.type.includes('stangd');
    const primaryColor = isOpen ? '#2962FF' : '#1565C0'; // Ragn-Sells Blue
    const ribColor = '#1E88E5'; // Slightly lighter for contrast

    return (
        <group>
             {/* Center the object */}
            <group position={[0, 0, 0]}> 
                
                {/* 1. FLOOR */}
                <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                    <boxGeometry args={[length, 0.1, width]} />
                    <meshStandardMaterial color={primaryColor} roughness={0.7} />
                </mesh>

                {/* 2. SIDE WALLS (Tapered/Trapezoidal) */}
                {/* Left Wall */}
                <SideWall 
                    length={length} 
                    hFront={heightFront} 
                    hBack={heightBack} 
                    thickness={wallThickness} 
                    position={[0, 0, width/2 - wallThickness/2]} 
                    color={primaryColor}
                />
                {/* Right Wall */}
                <SideWall 
                    length={length} 
                    hFront={heightFront} 
                    hBack={heightBack} 
                    thickness={wallThickness} 
                    position={[0, 0, -width/2 + wallThickness/2]} 
                    color={primaryColor}
                />

                {/* 3. FRONT & BACK WALLS */}
                {/* Frong (Lower) */}
                <mesh position={[length/2 - wallThickness/2, heightFront/2 + 0.05, 0]} castShadow receiveShadow>
                     <boxGeometry args={[wallThickness, heightFront, width - wallThickness*2]} />
                     <meshStandardMaterial color={primaryColor} roughness={0.7} />
                </mesh>
                {/* Back (Higher) */}
                <mesh position={[-length/2 + wallThickness/2, heightBack/2 + 0.05, 0]} castShadow receiveShadow>
                     <boxGeometry args={[wallThickness, heightBack, width - wallThickness*2]} />
                     <meshStandardMaterial color={primaryColor} roughness={0.7} />
                </mesh>

                {/* 4. STRUCTURAL RIBS (The "Ragnsells" look) */}
                {/* Vertical Ribs along sides */}
                {[-1.5, 0, 1.5].map((xOffset, i) => (
                     <group key={i}>
                        {/* Side Left Rib */}
                        <mesh position={[xOffset, (heightBack+heightFront)/4, width/2 + ribThickness/2]} >
                            <boxGeometry args={[0.2, (heightBack+heightFront)/2, ribThickness]} />
                            <meshStandardMaterial color={ribColor} />
                        </mesh>
                         {/* Side Right Rib */}
                         <mesh position={[xOffset, (heightBack+heightFront)/4, -width/2 - ribThickness/2]} >
                            <boxGeometry args={[0.2, (heightBack+heightFront)/2, ribThickness]} />
                            <meshStandardMaterial color={ribColor} />
                        </mesh>
                     </group>
                ))}

                {/* 5. LID (If Closed) or TRASH (If Open) */}
                {!isOpen ? (
                    // CLOSED LID - Sloped
                    <group position={[0, (heightBack + heightFront) / 2 + 0.2, 0]} rotation={[0, 0, 0.19]}>
                         <mesh castShadow>
                            <boxGeometry args={[length + 0.2, 0.1, width + 0.2]} />
                            <meshStandardMaterial color="#0D47A1" roughness={0.5} metalness={0.2} />
                         </mesh>
                    </group>
                ) : (
                    // OPEN - Maybe some visual "trash" pile inside?
                    // Keep it simple for now, just empty void.
                    null
                )}

            </group>
        </group>
    );
};

// Helper for trapezoidal side walls
const SideWall = ({ length, hFront, hBack, thickness, position, color }: any) => {
    // Create a trapezoid shape
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-length/2, 0); 
        s.lineTo(length/2, 0);
        s.lineTo(length/2, hFront);
        s.lineTo(-length/2, hBack);
        s.lineTo(-length/2, 0);
        return s;
    }, [length, hFront, hBack]);

    return (
        <mesh position={[position[0], position[1], position[2]]} rotation={[0, 0, 0]} castShadow receiveShadow>
            <extrudeGeometry args={[shape, { depth: thickness, bevelEnabled: false }]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
    );
};

