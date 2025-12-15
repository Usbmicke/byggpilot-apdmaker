
import React, { Suspense, useMemo, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, Plane, useTexture, TransformControls, Billboard, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryCategory, isBuilding, isLine, isSchakt, isPen, isSymbol } from '../../types';

const SCALE_FACTOR = 1 / 50;

// --- Helper: Scene Cleanup ---
const cleanupScene = (scene: THREE.Scene) => {
    scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
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

const BillboardSymbol = ({ obj, iconUrl, onSelect }: { obj: APDObject, iconUrl: string, onSelect: (e?: any) => void }) => {
    const texture = useTexture(iconUrl);
    const poleHeight = 2.5;
    const symbolSize = 1.5;

    return (
        <group position={[(obj.x - (obj.width/2)) * SCALE_FACTOR, 0, (obj.y - (obj.height/2)) * SCALE_FACTOR]}>
            <mesh castShadow>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            <Billboard position={[0, poleHeight + symbolSize / 2, 0]}>
                <Plane args={[symbolSize, symbolSize]} name={obj.id} onClick={onSelect}>
                    <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
                </Plane>
            </Billboard>
        </group>
    );
};

const ThreeDObject = React.memo(({ obj, background, item, onSelect }: { obj: APDObject, background: any, item: any, onSelect: (e?: any) => void }) => {
    const bgWidth = background?.width ?? 0;
    const bgHeight = background?.height ?? 0;
    const position: [number, number, number] = [(obj.x - bgWidth / 2) * SCALE_FACTOR, 0, (obj.y - bgHeight / 2) * SCALE_FACTOR];
    const rotationY = -THREE.MathUtils.degToRad(obj.rotation || 0);

    if (isSymbol(obj.type) && item?.iconUrl) {
        return <BillboardSymbol obj={obj} iconUrl={item.iconUrl} onSelect={onSelect} />;
    }

    if (isBuilding(obj) && obj.points && obj.points.length >= 4) {
        const shape = new THREE.Shape();
        const startX = (obj.points[0] - bgWidth / 2) * SCALE_FACTOR;
        const startY = (obj.points[1] - bgHeight / 2) * SCALE_FACTOR;
        shape.moveTo(startX, startY);
        for (let i = 2; i < obj.points.length; i += 2) {
            const x = (obj.points[i] - bgWidth / 2) * SCALE_FACTOR;
            const y = (obj.points[i+1] - bgHeight / 2) * SCALE_FACTOR;
            shape.lineTo(x, y);
        }
        shape.closePath();

        const extrudeSettings = {
            depth: (obj.height3d || 10) * SCALE_FACTOR,
            bevelEnabled: false,
        };

        return (
            <mesh name={obj.id} castShadow receiveShadow onClick={onSelect} rotation={[-Math.PI / 2, 0, 0]}>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial color="#C2B280" />
            </mesh>
        );
    }
    
    if (item?.name.toLowerCase().includes('bod') || item?.name.toLowerCase().includes('container')) {
        const width = (obj.width || 0) * SCALE_FACTOR;
        const height = (obj.height || 0) * SCALE_FACTOR;
        const boxHeight = 2.5;
        position[1] = boxHeight / 2;
        const color = item?.name.toLowerCase().includes('container') ? '#0077be' : '#8b5a2b';

        return (
            <mesh name={obj.id} position={position} rotation={[0, rotationY, 0]} castShadow onClick={onSelect}>
                <boxGeometry args={[width, boxHeight, height]} />
                <meshStandardMaterial color={color} />
            </mesh>
        );
    }

    if ((isLine(obj) || isPen(obj)) && obj.points && obj.points.length >= 4) {
        const vectors = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            vectors.push(new THREE.Vector3((obj.points[i] - bgWidth / 2) * SCALE_FACTOR, 0.1, (obj.points[i + 1] - bgHeight / 2) * SCALE_FACTOR));
        }
        if (vectors.length < 2) return null;

        const curve = new THREE.CatmullRomCurve3(vectors, false, isPen(obj) ? 'catmullrom' : undefined, 0.5);
        const tubeRadius = obj.type === 'fence' ? 0.05 : 0.03;
        const color = obj.type === 'fence' ? '#808080' : (obj.item.stroke || '#ffffff');

        return (
            <mesh name={obj.id} castShadow onClick={onSelect} userData={{ isLine: true }}>
                <tubeGeometry args={[curve, 64, tubeRadius, 8, false]} />
                <meshStandardMaterial color={color} />
            </mesh>
        );
    }

    if (isSchakt(obj)) {
        position[1] = 0.05;
        const width = (obj.width || 0) * SCALE_FACTOR;
        const height = (obj.height || 0) * SCALE_FACTOR;
        return (
            <mesh name={obj.id} position={position} rotation={[0, rotationY, 0]} onClick={onSelect}>
                <boxGeometry args={[width, 0.1, height]} />
                <meshStandardMaterial color={obj.item.fill || '#a1662f'} transparent opacity={0.6} />
            </mesh>
        );
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
        
        const newAttrs: Partial<APDObject> = {};
        const bgWidth = background?.width ?? 0;
        const bgHeight = background?.height ?? 0;

        newAttrs.x = (obj.position.x / SCALE_FACTOR) + (bgWidth / 2);
        newAttrs.y = (obj.position.z / SCALE_FACTOR) + (bgHeight / 2);
        newAttrs.rotation = -THREE.MathUtils.radToDeg(obj.rotation.y);
        
        if (isBuilding(obj.userData?.sourceObj)) {
            newAttrs.height3d = obj.scale.y * (obj.userData?.sourceObj.height3d || 10);
        }

        onObjectChange(selectedId, newAttrs);

    }, [selectedId, onObjectChange, background]);

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
                    mode={selectedThreeObject.userData.isLine ? 'translate' : 'transform'}
                />
            )}

            <Grid args={[200, 200]} infiniteGrid fadeDistance={200} fadeStrength={5} />
            
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport axisColors={['#ff4040', '#40ff40', '#4040ff']} labelColor="white" />
            </GizmoHelper>
            
            <OrbitControls ref={orbitControlsRef} makeDefault enableDamping dampingFactor={0.1} minDistance={10} maxDistance={400} enabled={!isLocked} maxPolarAngle={Math.PI / 2.1} />
        </>
    );
}

// --- Main 3D View Component ---
export interface ThreeDViewProps {
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

export interface ThreeDViewHandles {
    capture: () => { url: string; width: number; height: number; };
}

const CaptureController = forwardRef((props, ref) => {
    const { gl } = useThree();
    useImperativeHandle(ref, () => ({
        capture: () => {
            const dataURL = gl.domElement.toDataURL('image/png');
            return {
                url: dataURL,
                width: gl.drawingBufferWidth,
                height: gl.drawingBufferHeight,
            };
        }
    }));
    return null;
});

const ThreeDView = forwardRef<ThreeDViewHandles, ThreeDViewProps>(({ objects, background, libraryCategories, selectedId, onSelect, onObjectChange, onSnapshotRequest, isLocked, setIsLocked }, ref) => {
    const sceneRef = useRef<THREE.Scene | null>(null);
    const captureRef = useRef<{ capture: () => { url: string; width: number; height: number; } }>();

     useImperativeHandle(ref, () => ({
        capture: () => captureRef.current.capture()
    }));

    useEffect(() => {
        return () => {
            if (sceneRef.current) {
                cleanupScene(sceneRef.current);
            }
        };
    }, []);

    return (
        <div className="w-full h-full relative bg-slate-900">
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

            <Canvas 
                shadows 
                camera={{ position: [0, 60, 80], fov: 60 }} 
                style={{ pointerEvents: 'all' }} 
                onCreated={({ scene }) => sceneRef.current = scene}
                gl={{ preserveDrawingBuffer: true }}
            >
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
                <CaptureController ref={captureRef} />
            </Canvas>
        </div>
    );
});

export default ThreeDView;
