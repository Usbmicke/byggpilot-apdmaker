import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraManagerProps {
    background: { width: number; height: number; } | null;
    scale: number;
}

const CameraManager: React.FC<CameraManagerProps> = ({ background, scale }) => {
    const { camera, controls } = useThree();
    const didSetup = useRef(false);

    useEffect(() => {
        if (background && controls && !didSetup.current) {
            didSetup.current = true;

            const bgWidth = background.width * scale;
            const bgHeight = background.height * scale;

            // Calculate the center of the background
            const center = new THREE.Vector3(0, 0, 0);

            // Calculate the required distance to fit the background in the view
            const pCamera = camera as THREE.PerspectiveCamera;
            if (!pCamera.isPerspectiveCamera) return;

            const fov = pCamera.fov * (Math.PI / 180);
            const fovh = 2 * Math.atan(Math.tan(fov / 2) * pCamera.aspect);
            const dx = bgWidth / 2 / Math.tan(fovh / 2);
            const dy = bgHeight / 2 / Math.tan(fov / 2);
            const distance = Math.max(dx, dy) * 1.2; // Add 20% padding

            // Set the initial camera position
            const position = new THREE.Vector3(0, distance, distance * 0.5);
            camera.position.copy(position);
            camera.lookAt(center);

            if (controls) {
                (controls as any).target.copy(center);
                (controls as any).update();
            }
        }
    }, [background, camera, controls]);

    return null;
};

export default CameraManager;
