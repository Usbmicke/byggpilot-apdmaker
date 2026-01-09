import React from 'react';
import { Cylinder } from '@react-three/drei';

export const HighVisPoleRing = ({ radius = 1.0 }: { radius?: number }) => {
    return (
        <group>
            {/* High Visibility Orange Ring at Base */}
            {/* Using Cylinder (tube) or Torus? Torus is smoother for rings. */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <torusGeometry args={[radius, 0.15, 16, 32]} />
                <meshStandardMaterial 
                    color="#fb923c" // Orange-400 (Light Orange)
                    emissive="#f97316" // Orange-500 (Glow)
                    emissiveIntensity={0.5}
                    roughness={0.4}
                />
            </mesh>
            
            {/* Optional: Inner semi-transparent base plate for extra ground presence */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <circleGeometry args={[radius, 32]} />
                <meshBasicMaterial color="#fb923c" transparent opacity={0.2} />
            </mesh>
        </group>
    );
};
