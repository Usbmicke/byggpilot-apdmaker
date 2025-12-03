
import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { APDObject, LibraryCategory, isBuilding, isLine, isSchakt } from '../../types';

// Props-definition för komponenten
interface ThreeDViewProps {
    objects: APDObject[];
    background: { url: string; width: number; height: number; } | null;
    libraryCategories: LibraryCategory[];
}

// Konvertera 2D-koordinater och dimensioner till 3D-skala
const SCALE_FACTOR = 1 / 50;

const ThreeDView: React.FC<ThreeDViewProps> = ({ objects, background, libraryCategories }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const threeJsRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        controls: OrbitControls,
        plane: THREE.Mesh,
        objectMap: Map<string, THREE.Object3D>
    } | null>(null);

    const libraryItems = useMemo(() => 
        libraryCategories.flatMap(category => category.items), 
        [libraryCategories]
    );

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount || threeJsRef.current) return; // Kör bara en gång

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111827);
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(0, 50, 50);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.shadowMap.enabled = true;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 50, 20);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const planeGeometry = new THREE.PlaneGeometry(1, 1);
        const planeMaterial = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        scene.add(plane);

        currentMount.appendChild(renderer.domElement);

        threeJsRef.current = { scene, camera, renderer, controls, plane, objectMap: new Map() };

        const handleResize = () => {
            if (!threeJsRef.current || !mountRef.current) return;
            const { camera, renderer } = threeJsRef.current;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    useEffect(() => {
        if (!threeJsRef.current || !background) return;
        const { plane } = threeJsRef.current;

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(background.url, (texture) => {
            const aspectRatio = background.width / background.height;
            const planeWidth = 100;
            const planeHeight = planeWidth / aspectRatio;
            plane.scale.set(planeWidth, planeHeight, 1);

            (plane.material as THREE.MeshStandardMaterial).map = texture;
            (plane.material as THREE.MeshStandardMaterial).needsUpdate = true;
        });
    }, [background]);

    useEffect(() => {
        if (!threeJsRef.current) return;
        const { scene, objectMap } = threeJsRef.current;
        const bgWidth = background?.width ?? 0;
        const bgHeight = background?.height ?? 0;

        const currentObjectIds = new Set(objects.map(obj => obj.id));

        for (const [id, threeObject] of objectMap.entries()) {
            if (!currentObjectIds.has(id)) {
                scene.remove(threeObject);
                objectMap.delete(id);
            }
        }

        objects.forEach(obj => {
            const item = libraryItems.find(i => i.type === obj.item.type);
            if (!item) return;

            // Ta bort befintligt objekt för att återskapa det - enklaste sättet att hantera alla ändringar
            if (objectMap.has(obj.id)) {
                scene.remove(objectMap.get(obj.id)!);
            }

            let newThreeObject: THREE.Object3D | null = null;

            if (isBuilding(obj) || item.name.toLowerCase().includes('bod')) {
                const material = new THREE.MeshStandardMaterial({ color: '#d1d5db' });
                const geometry = new THREE.BoxGeometry(5, 3, 2.5);
                newThreeObject = new THREE.Mesh(geometry, material);
                newThreeObject.castShadow = true;
                newThreeObject.position.set((obj.x - bgWidth / 2) * SCALE_FACTOR, 1.5, (obj.y - bgHeight / 2) * SCALE_FACTOR);
            } else if (isLine(obj) && obj.points && obj.points.length >= 4) {
                const vectors: THREE.Vector3[] = [];
                for (let i = 0; i < obj.points.length; i += 2) {
                    vectors.push(new THREE.Vector3((obj.points[i] - bgWidth / 2) * SCALE_FACTOR, 0.1, (obj.points[i + 1] - bgHeight / 2) * SCALE_FACTOR));
                }
                const curve = new THREE.CatmullRomCurve3(vectors);
                const geometry = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
                const material = new THREE.MeshStandardMaterial({ color: obj.stroke || '#ffffff' });
                newThreeObject = new THREE.Mesh(geometry, material);
                newThreeObject.castShadow = true;
            } else if (isSchakt(obj)) {
                const material = new THREE.MeshStandardMaterial({ color: obj.fill || '#a1662f', transparent: true, opacity: 0.5 });
                const width = (obj.width || 0) * SCALE_FACTOR;
                const height = (obj.height || 0) * SCALE_FACTOR;
                const geometry = new THREE.BoxGeometry(width, 0.1, height);
                newThreeObject = new THREE.Mesh(geometry, material);
                newThreeObject.position.set((obj.x - bgWidth / 2) * SCALE_FACTOR, 0.05, (obj.y - bgHeight / 2) * SCALE_FACTOR);
            }

            if (newThreeObject) {
                newThreeObject.userData.id = obj.id;
                if (!isLine(obj)) { // Linjers rotation hanteras inte på samma sätt
                    newThreeObject.rotation.y = -THREE.MathUtils.degToRad(obj.rotation || 0);
                }
                scene.add(newThreeObject);
                objectMap.set(obj.id, newThreeObject);
            }
        });

    }, [objects, background, libraryItems]);

    return <div ref={mountRef} className="w-full h-full absolute top-0 left-0" />;
};

export default ThreeDView;
