
import React, { Suspense, useMemo, useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, Plane, useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryCategory, isBuilding, isLine, isSchakt, isPen, isSymbol } from '../../types';

const SCALE_FACTOR = 1 / 50;

// --- Helper: Scene Cleanup --- 
// KORRIGERING: Centraliserad funktion för att rensa minne
const cleanupScene = (scene: THREE.Scene) => {
    scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (object.material.map) object.material.map.dispose();
                    object.material.dispose();
                }
            }
        }
    });
};


// --- 3D Components ---

const ThreeDSymbol = ({ obj, background, iconUrl, onSelect }: { obj: APDObject, background: any, iconUrl: string, onSelect: (e?: any) => void }) => {
    const texture = useTexture(iconUrl);
    const bgWidth = background?.width ?? 0;
    const bgHeight = background?.height ?? 0;
    const position: [number, number, number] = [(obj.x - bgWidth / 2) * SCALE_FACTOR, 1.0, (obj.y - bgHeight / 2) * SCALE_FACTOR];

    return (
        <Plane name={obj.id} args={[2, 2]} position={position} onClick={onSelect} rotation={[0, -THREE.MathUtils.degToRad(obj.rotation || 0), 0]}>
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
        </Plane>
    );
};

const ThreeDObject = React.memo(({ obj, background, item, onSelect }: { obj: APDObject, background: any, item: any, onSelect: (e?: any) => void }) => {
    const bgWidth = background?.width ?? 0;
    const bgHeight = background?.height ?? 0;
    const position: [number, number, number] = [(obj.x - bgWidth / 2) * SCALE_FACTOR, 0, (obj.y - bgHeight / 2) * SCALE_FACTOR];
    const rotationY = -THREE.MathUtils.degToRad(obj.rotation || 0);

    if (isSymbol(obj) && item?.iconUrl) {
        return <ThreeDSymbol obj={obj} background={background} iconUrl={item.iconUrl} onSelect={onSelect} />;
    }

    if (isBuilding(obj) || item?.name.toLowerCase().includes('bod')) {
        position[1] = 1.5;
        const width = (obj.width || 0) * SCALE_FACTOR;
        const height = (obj.height || 0) * SCALE_FACTOR;
        return <mesh name={obj.id} position={position} rotation={[0, rotationY, 0]} castShadow onClick={onSelect}><boxGeometry args={[width, 3, height]} /><meshStandardMaterial color="#d1d5db" /></mesh>;
    }

    if ((isLine(obj) || isPen(obj)) && obj.points && obj.points.length >= 4) {
        const vectors = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            vectors.push(new THREE.Vector3((obj.points[i] - bgWidth / 2) * SCALE_FACTOR, 0.1, (obj.points[i + 1] - bgHeight / 2) * SCALE_FACTOR));
        }
        if (vectors.length < 2) return null;
        
        const curve = isPen(obj) ? new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5) : new THREE.CatmullRomCurve3(vectors, false);
        const tubeRadius = obj.item.type === 'STAKET' ? 0.2 : 0.1;
        
        return <mesh name={obj.id} castShadow onClick={onSelect} userData={{ isLine: true }}><tubeGeometry args={[curve, 64, tubeRadius, 8, false]} /><meshStandardMaterial color={obj.item.stroke || '#ffffff'} /></mesh>;
    }

    if (isSchakt(obj)) {
        position[1] = 0.05;
        const width = (obj.width || 0) * SCALE_FACTOR;
        const height = (obj.height || 0) * SCALE_FACTOR;
        return <mesh name={obj.id} position={position} rotation={[0, rotationY, 0]} onClick={onSelect}><boxGeometry args={[width, 0.1, height]} /><meshStandardMaterial color={obj.item.fill || '#a1662f'} transparent opacity={0.7} /></mesh>;
    }

    return null;
});

const BackgroundPlane = React.memo(({ background }: { background: { url: string; width: number; height: number; } | null }) => {
    if (!background) return null;
    const texture = useTexture(background.url);
    const aspect = background.width / background.height;
    return <Plane args={[200, 200 / aspect]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><meshStandardMaterial map={texture} /></Plane>;
});

// --- Scene Component ---
const Scene = ({ objects, background, libraryCategories, selectedId, onSelect, onObjectChange, onSnapshotRequest }) => {
    const { scene } = useThree();
    const transformRef = useRef<any>(null);
    const orbitControlsRef = useRef<any>(null);
    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);

    const selectedThreeObject = useMemo(() => {
        if (selectedId) return scene.getObjectByName(selectedId);
        return null;
    }, [selectedId, scene, objects]);

    useEffect(() => {
        if (transformRef.current) {
            const controls = transformRef.current;
            const callback = (event: any) => orbitControlsRef.current.enabled = !event.value;
            controls.addEventListener('dragging-changed', callback);
            return () => controls.removeEventListener('dragging-changed', callback);
        }
    });

    const handleObjectChange = useCallback(() => {
        const obj = transformRef.current?.object;
        if (!obj || !selectedId) return;
        const bgWidth = background?.width ?? 0;
        const bgHeight = background?.height ?? 0;
        const newAttrs: Partial<APDObject> = {
            x: (obj.position.x / SCALE_FACTOR) + (bgWidth / 2),
            y: (obj.position.z / SCALE_FACTOR) + (bgHeight / 2),
            rotation: -THREE.MathUtils.radToDeg(obj.rotation.y),
        };
        onObjectChange(selectedId, newAttrs);
    }, [selectedId, onObjectChange, background]);

    // KORRIGERING: Effektivisera snapshot-hanteringen.
    const handleDraggingChanged = useCallback((event: any) => {
        if (event.value) onSnapshotRequest();
    }, [onSnapshotRequest]);

    return (
        <>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[100, 100, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            
            <Suspense fallback={null}>
                <BackgroundPlane background={background} />
                {objects.map(obj => (
                    <ThreeDObject
                        key={obj.id}
                        obj={obj}
                        background={background}
                        item={libraryItems.get(obj.type)}
                        onSelect={(e?: any) => {
                            e?.stopPropagation();
                            onSelect(obj.id);
                        }}
                    />
                ))}
            </Suspense>

            {selectedThreeObject && (
                 <TransformControls
                    ref={transformRef}
                    object={selectedThreeObject}
                    onMouseUp={handleObjectChange}
                    onDraggingChanged={handleDraggingChanged}
                    // KORRIGERING: Mode baserat på ifall objektet är en linje.
                    mode={selectedThreeObject.userData.isLine ? 'translate' : 'transform'}
                />
            )}

            <Grid args={[200, 200]} infiniteGrid fadeDistance={200} fadeStrength={5} />
            <OrbitControls ref={orbitControlsRef} makeDefault enableDamping dampingFactor={0.1} minDistance={10} maxDistance={200} />
        </>
    );
}

// --- Main 3D View Component ---
const ThreeDView = ({ objects, background, libraryCategories, selectedId, onSelect, onObjectChange, onSnapshotRequest }: 
    { objects: APDObject[]; background: any; libraryCategories: LibraryCategory[]; selectedId: string | null; onSelect: (id: string | null) => void; onObjectChange: (id: string, attrs: Partial<APDObject>) => void; onSnapshotRequest: () => void; }) => {

    const sceneRef = useRef<THREE.Scene | null>(null);
    
    // KORRIGERING: Inför en effekt som rensar scenen vid avmontering.
    useEffect(() => {
        return () => {
            if (sceneRef.current) {
                cleanupScene(sceneRef.current);
            }
        };
    }, []);

    return (
        <div className="w-full h-full absolute top-0 left-0 z-10" onPointerDown={() => onSelect(null)}>
            <Canvas shadows camera={{ position: [0, 60, 80], fov: 60 }} style={{ pointerEvents: 'all' }} onCreated={({ scene }) => sceneRef.current = scene}>
                <Scene 
                    objects={objects}
                    background={background}
                    libraryCategories={libraryCategories}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onObjectChange={onObjectChange}
                    onSnapshotRequest={onSnapshotRequest}
                />
            </Canvas>
        </div>
    );
};

export default ThreeDView;

