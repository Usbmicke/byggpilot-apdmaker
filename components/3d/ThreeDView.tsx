
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { APDObject, LibraryItem, isBuilding, isSchakt, isZone, isLine, LibraryCategory } from '../../types';

interface ThreeDViewProps {
    objects: APDObject[];
    background: { url: string; width: number; height: number; };
    libraryCategories: LibraryCategory[]; // <-- NY PROP
}

// ... (alla create-funktioner och helpers förblir desamma) ...

const ThreeDView: React.FC<ThreeDViewProps> = ({ objects, background, libraryCategories }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef({ /* ... state ... */ } as any).current;
    const planeSize = 100;

    // Bearbeta biblioteket till en platt lista
    const libraryItems = useMemo(() => 
        libraryCategories.flatMap(category => category.items), 
        [libraryCategories]
    );

    useEffect(() => {
        if (!mountRef.current || stateRef.renderer) return;
        const currentMount = mountRef.current;

        // ... (all setup-kod för scen, kamera, renderer, ljus, markplan, kontroller) ...
        // Denna kod behöver inte ändras, den använder `objects`-propen som redan skickas in

        const animate = () => {
            requestAnimationFrame(animate);
            stateRef.orbitControls.update();
            stateRef.renderer.render(stateRef.scene, stateRef.camera);
        };
        animate();

        // ... (resten av setup-koden, inkl. event listeners) ...

    }, [background]); // Kör setup när bakgrunden laddas

    // useEffect för att synka `objects`-prop till 3D-scenen
    useEffect(() => {
        if (!stateRef.scene) return;
        
        // Rensa gamla objekt (förutom grund-element som plan och ljus)
        stateRef.scene.children.forEach(child => {
            if (child.userData.isObject) {
                stateRef.scene.remove(child);
            }
        });

        // Skapa 3D-objekt från 2D-objekt
        objects.forEach(obj => {
            const item = libraryItems.find(i => i.type === obj.item.type);
            if (!item) return;

            let threeObject: THREE.Object3D | null = null;

            // SKAPA 3D-OBJEKT BASERAT PÅ TYP (exempel)
            if (isBuilding(obj.type) || item.name.toLowerCase().includes('bod')) {
                threeObject = new THREE.Mesh(
                    new THREE.BoxGeometry(5, 3, 2.5), 
                    new THREE.MeshStandardMaterial({ color: '#d1d5db' })
                );
                threeObject.position.set(obj.x / 50, 1.25, obj.y / 50);
            } else if (isLine(obj.type)) {
                // Logik för att skapa linjer/staket
            } else {
                // Logik för andra objekt
            }

            if (threeObject) {
                threeObject.userData.isObject = true; // Markera för enkel rensning
                threeObject.userData.id = obj.id;
                stateRef.scene.add(threeObject);
            }
        });

    }, [objects, libraryItems, stateRef.scene]);


    return <div ref={mountRef} className="w-full h-full absolute top-0 left-0"></div>;
};

export default ThreeDView;
