
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { APDObject, isCrane } from '../../types';

interface InstancedIconBillboardsProps {
    objects: APDObject[];
    offset: { x: number; y: number };
}

const InstancedIconBillboards: React.FC<InstancedIconBillboardsProps> = ({ objects, offset }) => {
    const { scene } = useThree();
    const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
    const instancedMeshes = useRef<{[key: string]: THREE.InstancedMesh}>({});

    const groupedObjects = useMemo(() => {
        const groups: { [key: string]: APDObject[] } = {};
        objects.forEach(obj => {
            const iconUrl = (obj as any).iconUrl;
            if (iconUrl) {
                if (!groups[iconUrl]) {
                    groups[iconUrl] = [];
                }
                groups[iconUrl].push(obj);
            }
        });
        return groups;
    }, [objects]);

    useEffect(() => {
        Object.keys(groupedObjects).forEach(iconUrl => {
            const group = groupedObjects[iconUrl];
            const count = group.length;
            const mesh = instancedMeshes.current[iconUrl];

            if (mesh && mesh.count !== count) {
                scene.remove(mesh);
                delete instancedMeshes.current[iconUrl];
            }

            if (!instancedMeshes.current[iconUrl]) {
                textureLoader.load(iconUrl, (texture) => {
                    texture.anisotropy = 16;
                    texture.colorSpace = THREE.SRGBColorSpace;

                    const size = isCrane(group[0]) ? 100 : 40;
                    const geometry = new THREE.PlaneGeometry(size, size);
                    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false });
                    const newMesh = new THREE.InstancedMesh(geometry, material, count);
                    newMesh.name = iconUrl; 
                    scene.add(newMesh);
                    instancedMeshes.current[iconUrl] = newMesh;
                });
            }
        });

        // Clean up old meshes
        Object.keys(instancedMeshes.current).forEach(iconUrl => {
            if (!groupedObjects[iconUrl]) {
                scene.remove(instancedMeshes.current[iconUrl]);
                delete instancedMeshes.current[iconUrl];
            }
        });

    }, [groupedObjects, scene, textureLoader]);

    useEffect(() => {
        const dummy = new THREE.Object3D();
        Object.keys(instancedMeshes.current).forEach(iconUrl => {
            const mesh = instancedMeshes.current[iconUrl];
            const group = groupedObjects[iconUrl];
            if (mesh && group) {
                group.forEach((obj, i) => {
                    const yPos = isCrane(obj) ? 50 : 25;
                    dummy.position.set(obj.x - offset.x, yPos, obj.y - offset.y);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);
                });
                mesh.instanceMatrix.needsUpdate = true;
            }
        });
    }, [groupedObjects, offset, instancedMeshes]);

    return null; 
};

export default InstancedIconBillboards;
