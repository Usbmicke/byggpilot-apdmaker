
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
    // Position is handled by parent group. We just render the billboard at an offset.

    return (
        <Plane
            name={obj.id}
            args={[5, 5]} // Larger billboard
            position={[0, 7.5, 0]} // Local height offset
            onClick={onSelect}
            rotation={[0, -THREE.MathUtils.degToRad(obj.rotation || 0), 0]}
        >
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
        // Floating Symbol with Line to Ground
        const yHeight = 15; // Height in 3D units (meters?)
        const symbolPos: [number, number, number] = [(obj.x - bgWidth / 2) * SCALE_FACTOR, yHeight * 0.5, (obj.y - bgHeight / 2) * SCALE_FACTOR]; // Billboard at top

        return (
            <group>
                {/* The Vertical Line / Pole */}
                <mesh position={[symbolPos[0], yHeight * 0.25, symbolPos[2]]}>
                    <cylinderGeometry args={[0.05, 0.05, yHeight * 0.5, 8]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* The Floating Billboard */}
                <ThreeDSymbol obj={obj} background={background} iconUrl={item.iconUrl} onSelect={onSelect} />
            </group>
        );
    }

    if (isBuilding(obj) && obj.points && obj.points.length >= 6) {
        // Extruded Building from Polygon Points
        const shape = new THREE.Shape();
        const startX = (obj.points[0] - bgWidth / 2) * SCALE_FACTOR;
        const startY = (obj.points[1] - bgHeight / 2) * SCALE_FACTOR;
        shape.moveTo(startX, startY);

        for (let i = 2; i < obj.points.length; i += 2) {
            const x = (obj.points[i] - bgWidth / 2) * SCALE_FACTOR;
            const y = (obj.points[i + 1] - bgHeight / 2) * SCALE_FACTOR;
            shape.lineTo(x, y);
        }
        shape.closePath(); // Ensure it's closed

        const extrudeSettings = {
            depth: (obj.height || 150) * SCALE_FACTOR, // Default height ~3m if 150? Adjust scale.
            bevelEnabled: false,
        };

        // Rotation -90 deg X to lay flat, then points are X,Y (which become X,Z in 3D space usually, but here Shape is 2D X,Y)
        // Wait, standard ExtrudeGeometry extrudes along Z. 
        // We want flat shape on XZ plane, extruded UP (Y).
        // Rotate mesh -90 (Math.PI/2) around X.

        return (
            <mesh name={obj.id} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow onClick={onSelect}>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial color={obj.item.fill || '#cbd5e1'} />
            </mesh>
        );
    }

    // Fallback for "Bod" if not generic symbol? The user requested Bods to be 3D models. 
    // For now, if it's a "Bod" from library, it acts as a symbol but we might want a box?
    // Let's use the generic box for Bod if it lacks points (i.e. dragged from library, not drawn).
    if (item?.name.toLowerCase().includes('bod') || item?.name.toLowerCase().includes('container')) {
        position[1] = 1.5;
        const width = (obj.width || 0) * SCALE_FACTOR;
        const height = (obj.height || 0) * SCALE_FACTOR;
        // TODO: Real GLTF models later.
        return <mesh name={obj.id} position={position} rotation={[0, rotationY, 0]} castShadow onClick={onSelect}><boxGeometry args={[width, 3, height]} /><meshStandardMaterial color={item.title?.includes('Container') ? '#1e40af' : '#d1d5db'} /></mesh>;
    }


    if ((isLine(obj) || isPen(obj)) && obj.points && obj.points.length >= 4) {
        // ... (Existing Line Logic)
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
const Scene = ({ objects, background, libraryCategories, selectedId, onSelect, onObjectChange, onSnapshotRequest, isLocked }) => {
    const { scene } = useThree();
    const transformRef = useRef<any>(null);
    const orbitControlsRef = useRef<any>(null);
    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);

    const selectedThreeObject = useMemo(() => {
        if (selectedId) return scene.getObjectByName(selectedId);
        return null;
    }, [selectedId, scene, objects]);

    useEffect(() => {
        if (transformRef.current && orbitControlsRef.current) {
            const controls = transformRef.current;
            const callback = (event: any) => {
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.enabled = !event.value && !isLocked;
                }
            };
            controls.addEventListener('dragging-changed', callback);
            return () => controls.removeEventListener('dragging-changed', callback);
        }
    }, [isLocked]);

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
            <OrbitControls ref={orbitControlsRef} makeDefault enableDamping dampingFactor={0.1} minDistance={10} maxDistance={200} enabled={!isLocked} />
        </>
    );
}


// --- Main 3D View Component ---
interface ThreeDViewProps {
    objects: APDObject[];
    background: any;
    libraryCategories: LibraryCategory[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onObjectChange: (id: string, attrs: Partial<APDObject>) => void;
    onSnapshotRequest: () => void;
    isLocked: boolean;
    setIsLocked: (locked: boolean) => void;
}

const ThreeDView: React.FC<ThreeDViewProps> = ({ objects, background, libraryCategories, selectedId, onSelect, onObjectChange, onSnapshotRequest, isLocked, setIsLocked }) => {
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
        <div className="w-full h-full relative bg-slate-900">
            {/* Lock Button (3D) */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={() => setIsLocked(!isLocked)}
                    className={`backdrop-blur-sm font-bold p-2 rounded-lg shadow-lg transition-all border-2 border-white/20 ${isLocked ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                    title={isLocked ? "3D-vyn är låst" : "Lås 3D-vyn"}
                >
                    {isLocked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                    )}
                </button>
            </div>

            <Canvas shadows camera={{ position: [0, 60, 80], fov: 60 }} style={{ pointerEvents: 'all' }} onCreated={({ scene }) => sceneRef.current = scene}>
                <Scene
                    objects={objects}
                    background={background}
                    libraryCategories={libraryCategories}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onObjectChange={onObjectChange}
                    onSnapshotRequest={onSnapshotRequest}
                    isLocked={isLocked}
                />
            </Canvas>
        </div>
    );
};

export default ThreeDView;

