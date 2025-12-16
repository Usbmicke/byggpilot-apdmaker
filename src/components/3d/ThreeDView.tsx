
import React, { Suspense, useMemo, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, Plane, useTexture, Billboard, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryCategory, isBuilding, isSchakt, isSymbol, isFence } from '../../types';
import { TransformControls } from 'three-stdlib';

const SCALE_FACTOR = 1 / 50;

// --- Helper: Centraliserad och Korrekt Koordinatöversättning ---
const get3DPosition = (obj: APDObject, bgWidth: number, bgHeight: number): [number, number, number] => {
    const worldX = ((obj.x + (obj.width ?? 0) / 2) - bgWidth / 2) * SCALE_FACTOR;
    const worldZ = ((obj.y + (obj.height ?? 0) / 2) - bgHeight / 2) * SCALE_FACTOR;
    return [worldX, 0, worldZ];
};

const get2DAttributesFrom3D = (obj3d: THREE.Object3D, sourceObj: APDObject, bgWidth: number, bgHeight: number): Partial<APDObject> => {
    const attrs: Partial<APDObject> = {};
    attrs.x = (obj3d.position.x / SCALE_FACTOR) + (bgWidth / 2) - (sourceObj.width / 2);
    attrs.y = (obj3d.position.z / SCALE_FACTOR) + (bgHeight / 2) - (sourceObj.height / 2);
    attrs.rotation = -THREE.MathUtils.radToDeg(obj3d.rotation.y);
    return attrs;
};

// --- Stabila 3D Komponenter ---

const Controls = ({ selectedId, onObjectChange, onSnapshotRequest, background }) => {
    const { camera, gl, scene } = useThree();
    const orbitRef = useRef<any>();
    const transformControls = useMemo(() => {
        const tc = new TransformControls(camera, gl.domElement);
        tc.addEventListener('dragging-changed', (event) => {
            if (orbitRef.current) orbitRef.current.enabled = !event.value;
            if (event.value) onSnapshotRequest();
        });
        tc.addEventListener('objectChange', () => {
            const obj3d = tc.object;
            if (obj3d && obj3d.userData.sourceObj) {
                const sourceObj = obj3d.userData.sourceObj as APDObject;
                let newAttrs: Partial<APDObject> = {};
                if (isBuilding(sourceObj)) {
                    newAttrs.height3d = obj3d.scale.y;
                } else {
                    newAttrs = get2DAttributesFrom3D(obj3d, sourceObj, background.width, background.height);
                }
                onObjectChange(sourceObj.id, newAttrs);
            }
        });
        scene.add(tc);
        return tc;
    }, [camera, gl.domElement, scene, onObjectChange, onSnapshotRequest, background]);

    useEffect(() => {
        const selectedObject = selectedId ? scene.getObjectByName(selectedId) : null;
        if (selectedObject) {
            transformControls.attach(selectedObject);
            const isScalable = isBuilding(selectedObject.userData.sourceObj);
            transformControls.setMode(isScalable ? 'scale' : 'translate');
        } else {
            transformControls.detach();
        }
    }, [selectedId, scene, transformControls]);

    return <OrbitControls ref={orbitRef} makeDefault target={[0,0,0]} enableDamping dampingFactor={0.1} minDistance={10} maxDistance={400} maxPolarAngle={Math.PI / 2.2} />;
};

const ThreeDObject = React.memo(({ obj, item, onSelect, background }) => {
    if (!background) return null;
    const position = get3DPosition(obj, background.width, background.height);
    const rotationY = -THREE.MathUtils.degToRad(obj.rotation || 0);

    if (isSymbol(obj.type) && item?.iconUrl) {
        const poleHeight = 2.5;
        const symbolSize = 4.0;
        return (
            <group name={obj.id} position={position} userData={{ sourceObj: obj }} onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}>
                <mesh castShadow position={[0, poleHeight / 2, 0]}><cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} /><meshStandardMaterial color="#555" /></mesh>
                <Billboard position={[0, poleHeight + symbolSize / 2, 0]}>
                    <Plane args={[symbolSize, symbolSize]}><meshStandardMaterial map={useTexture(item.iconUrl)} transparent side={THREE.DoubleSide} alphaTest={0.5} /></Plane>
                </Billboard>
            </group>
        );
    }

    if (isBuilding(obj) && obj.points && obj.points.length >= 4) {
        const { shape, positionOffset } = useMemo(() => {
            const shape = new THREE.Shape();
            const initialX = ((obj.points[0]) - background.width / 2) * SCALE_FACTOR;
            const initialZ = ((obj.points[1]) - background.height / 2) * SCALE_FACTOR;
            shape.moveTo(0,0);
            for (let i = 2; i < obj.points.length; i += 2) {
                const pointX = ((obj.points[i]) - background.width / 2) * SCALE_FACTOR;
                const pointZ = ((obj.points[i+1]) - background.height / 2) * SCALE_FACTOR;
                shape.lineTo(pointX - initialX, pointZ - initialZ);
            }
            shape.closePath();
            return { shape, positionOffset: [initialX, 0, initialZ] as [number,number,number]};
        }, [obj.points, background.width, background.height]);

        return (
            <mesh name={obj.id} userData={{ sourceObj: obj }} castShadow receiveShadow
                onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}
                position={positionOffset} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, obj.height3d || 1]}>
                <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: false }]} />
                <meshStandardMaterial color={obj.item.fill || "#C2B280"} />
            </mesh>
        );
    }
    
    if (isFence(obj)) {
        const geometry = useMemo(() => {
            if (!obj.points || obj.points.length < 4) return null;
            const fenceHeight = 2.0;
            const vertices = [];
            for (let i = 0; i < obj.points.length - 2; i += 2) {
                const x1 = (obj.points[i] - background.width / 2) * SCALE_FACTOR;
                const z1 = (obj.points[i+1] - background.height / 2) * SCALE_FACTOR;
                const x2 = (obj.points[i+2] - background.width / 2) * SCALE_FACTOR;
                const z2 = (obj.points[i+3] - background.height / 2) * SCALE_FACTOR;
                vertices.push(x1, 0, z1,   x2, 0, z2,   x1, fenceHeight, z1);
                vertices.push(x2, 0, z2,   x2, fenceHeight, z2,   x1, fenceHeight, z1);
            }
            const bufferGeometry = new THREE.BufferGeometry();
            bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            bufferGeometry.computeVertexNormals();
            return bufferGeometry;
        }, [obj.points, background.width, background.height]);

        if (!geometry) return null;
        return <mesh geometry={geometry} name={obj.id} userData={{ sourceObj: obj }} onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}><meshStandardMaterial color={obj.item.stroke || '#A9A9A9'} side={THREE.DoubleSide} /></mesh>;
    }

    const width = (obj.width || 0) * SCALE_FACTOR;
    const depth = (obj.height || 0) * SCALE_FACTOR;
    const height = (obj.height3d || (isSchakt(obj) ? 0.1 : 2.5));
    const color = isSchakt(obj) ? (obj.item.fill || '#a1662f') : (item?.name.toLowerCase().includes('container') ? '#0077be' : '#8b5a2b');

    return (
        <mesh name={obj.id} userData={{ sourceObj: obj }} position={[position[0], height/2 - (isSchakt(obj) ? 0.05: 0), position[2]]} rotation={[0, rotationY, 0]} castShadow onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} transparent={isSchakt(obj)} opacity={isSchakt(obj) ? 0.7 : 1.0} />
        </mesh>
    );
});

const BackgroundPlane = React.memo(({ background }: { background: any }) => {
    if (!background) return null;
    const texture = useTexture(background.url);
    const planeWidth = background.width * SCALE_FACTOR;
    const planeHeight = background.height * SCALE_FACTOR;
    return <Plane args={[planeWidth, planeHeight]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><meshStandardMaterial map={texture} /></Plane>;
});

// --- Huvudkomponenter för Scenen ---
const SceneContent = (props: Omit<ThreeDViewProps, 'setIsLocked'>) => {
    const { objects, background, libraryCategories, selectedId, onSelect, onObjectChange, onSnapshotRequest, isLocked } = props;
    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);

    const handleSelect = useCallback((id: string | null) => {
        if (isLocked) return;
        onSelect(id);
    }, [isLocked, onSelect]);

    // Dynamisk Kamerapositionering
    useEffect(() => {
        const { camera } = useThree();
        if (background) {
            const worldWidth = background.width * SCALE_FACTOR;
            const worldHeight = background.height * SCALE_FACTOR;
            const distance = Math.max(worldWidth, worldHeight) * 1.2;
            camera.position.set(0, distance, distance * 0.5);
            camera.lookAt(0, 0, 0);
        }
    }, [background, useThree]);

    return (
        <>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[100, 100, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <Suspense fallback={null}>
                <BackgroundPlane background={background} />
                {objects.map(obj => (
                    <ThreeDObject key={obj.id} obj={obj} item={libraryItems.get(obj.type)} onSelect={handleSelect} background={background} />
                ))}
            </Suspense>
            {!isLocked && <Controls selectedId={selectedId} onObjectChange={onObjectChange} onSnapshotRequest={onSnapshotRequest} background={background} />}
            <Grid args={[400, 400]} position={[0, -0.02, 0]} infiniteGrid fadeDistance={300} fadeStrength={5} />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport axisColors={['#ff4040', '#40ff40', '#4040ff']} labelColor="white" />
            </GizmoHelper>
        </>
    );
};

const CaptureController = forwardRef((props, ref) => {
    const { gl, scene, camera } = useThree();
    useImperativeHandle(ref, () => ({ capture: () => {
        try {
            gl.render(scene, camera);
            return { url: gl.domElement.toDataURL('image/png'), width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
        } catch (e) { console.error("Capture failed:", e); return null; }
    }}));
    return null;
});

export interface ThreeDViewProps {
    objects: APDObject[];
    background: { url: string; width: number; height: number; } | null;
    libraryCategories: LibraryCategory[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onObjectChange: (id:string, attrs: Partial<APDObject>) => void;
    onSnapshotRequest: () => void;
    isLocked: boolean;
    setIsLocked: (locked: boolean) => void;
}

export interface ThreeDViewHandles {
    capture: () => { url: string; width: number; height: number; } | null;
}

const ThreeDView = forwardRef<ThreeDViewHandles, ThreeDViewProps>((props, ref) => {
    const captureRef = useRef<any>();
    const sceneRef = useRef<THREE.Scene>();

    useImperativeHandle(ref, () => ({ capture: () => captureRef.current?.capture() }));
     
    useEffect(() => { const scene = sceneRef.current; return () => { if (scene) cleanupScene(scene); }; }, []);

    const handleDeselect = () => { if (!props.isLocked) props.onSelect(null); };

    return (
        <div className="w-full h-full relative bg-slate-900" onClick={handleDeselect}>
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={(e) => { e.stopPropagation(); props.setIsLocked(!props.isLocked); }}
                    className={`backdrop-blur-sm font-bold p-2 rounded-lg shadow-lg transition-all border-2 border-white/20 ${props.isLocked ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                    title={props.isLocked ? "Lås upp 3D-vyn" : "Lås 3D-vyn (inaktiverar val och justering)"}>
                    {props.isLocked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                    )}
                </button>
            </div>
            <Canvas shadows camera={{ fov: 50 }} onCreated={({ scene }) => sceneRef.current = scene} gl={{ preserveDrawingBuffer: true, antialias: true }} style={{ touchAction: 'none' }} dpr={[1, 1.5]}>
                <SceneContent {...props} selectedId={props.isLocked ? null : props.selectedId} />
                <CaptureController ref={captureRef} />
            </Canvas>
        </div>
    );
});

export default ThreeDView;
