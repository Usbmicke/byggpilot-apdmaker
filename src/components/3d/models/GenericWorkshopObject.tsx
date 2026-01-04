import React from 'react';
import { APDObject } from '../../../types';

export const GenericWorkshopObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    const width = (obj.width || 4) * scale;
    const depth = (obj.height || 4) * scale;
    const height = 3.5;
    const color = obj.type === 'saw_shed' ? '#A1662F' : '#6B7280';
    return (
        <group>
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[0, height, 0]}>
                <boxGeometry args={[width, 0.2, depth * 1.2]} />
                <meshStandardMaterial color="#555" />
            </mesh>
        </group>
    );
}
