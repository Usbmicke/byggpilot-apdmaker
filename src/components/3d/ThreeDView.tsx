
import React, { Suspense, useMemo, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, Plane, useTexture, Billboard, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryCategory, LibraryItem, isBuilding, isSchakt, isSymbol, isFence } from '../../types';
import { TransformControls } from 'three-stdlib';
import { SCALE_FACTOR } from '../../utils/coordinateUtils';

// --- Coordinate Transformations ---
const toWorld = (x: number, y: number, bgWidth: number, bgHeight: number): [number, number, number] => {
    const worldX = (x - bgWidth / 2) * SCALE_FACTOR;
    const worldZ = (y - bgHeight / 2) * SCALE_FACTOR;
    return [worldX, 0, worldZ];
};

// --- ATTENTION: CRITICAL UPDATE LOGIC FOR UNIFIED PIVOT ---
const get2DAttributesFrom3D = (obj3d: THREE.Object3D, bgWidth: number, bgHeight: number, initial3DPos: THREE.Vector3): Partial<APDObject> => {
    const sourceObj = obj3d.userData.sourceObj as APDObject;
    const isPolygon = isBuilding(sourceObj) || isFence(sourceObj);

    const newX = (obj3d.position.x / SCALE_FACTOR) + (bgWidth / 2);
    const newY = (obj3d.position.z / SCALE_FACTOR) + (bgHeight / 2);
    const rotation = -THREE.MathUtils.radToDeg(obj3d.rotation.y);

    if (isPolygon) {
        const deltaX = newX - sourceObj.x;
        const deltaY = newY - sourceObj.y;
        const newPoints = sourceObj.points.map((p, i) => i % 2 === 0 ? p + deltaX : p + deltaY);
        return { points: newPoints, rotation, x: newX, y: newY };
    }

    return { x: newX, y: newY, rotation };
};

// --- Controls ---
const Controls = ({ selectedId, onObjectChange, onSnapshotRequest, background }) => {
    const { camera, gl, scene } = useThree();
    const orbitRef = useRef<any>();
    const initial3DPos = useRef(new THREE.Vector3());

    const transformControls = useMemo(() => {
        const tc = new TransformControls(camera, gl.domElement);

        tc.addEventListener('dragging-changed', (event) => {
            if (orbitRef.current) orbitRef.current.enabled = !event.value;
            if (event.value) { 
                onSnapshotRequest();
                if (tc.object) {
                    initial3DPos.current.copy(tc.object.position);
                }
            }
        });

        tc.addEventListener('objectChange', () => {
            const obj3d = tc.object;
            if (obj3d && obj3d.userData.sourceObj) {
                const newAttrs = get2DAttributesFrom3D(obj3d, background.width, background.height, initial3DPos.current);
                onObjectChange(obj3d.userData.sourceObj.id, newAttrs);
            }
        });

        scene.add(tc);
        return tc;
    }, [camera, gl.domElement, scene, onObjectChange, onSnapshotRequest, background]);

    useEffect(() => {
        const selectedObject = selectedId ? scene.getObjectByName(selectedId) : null;
        if (selectedObject) { 
            transformControls.attach(selectedObject);
        } else {
            transformControls.detach();
        }
    }, [selectedId, scene, transformControls]);

    useEffect(() => () => transformControls.dispose(), [transformControls]);

    return <OrbitControls ref={orbitRef} makeDefault target={[0, 0, 0]} />;
};


// --- Geometry Components ---
const BoxObject = ({ obj, item }: { obj: APDObject, item?: LibraryItem }) => {
    const width = (obj.width || 1) * SCALE_FACTOR;
    const depth = (obj.height || 1) * SCALE_FACTOR;
    const height = obj.height3d || (isSchakt(obj) ? 0.1 : 2.5);
    const color = isSchakt(obj) ? (obj.item.fill || '#a1662f') : (item?.name.toLowerCase().includes('container') ? '#0077be' : '#8b5a2b');
    return (
        <mesh castShadow position={[width / 2, height / 2 - (isSchakt(obj) ? 0.05 : 0), depth / 2]}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} transparent={isSchakt(obj)} opacity={isSchakt(obj) ? 0.7 : 1.0} />
        </mesh>
    );
};

const SymbolObject = ({ item }: { item: LibraryItem }) => {
    const poleHeight = 2.5;
    const symbolSize = 2.0; 
    return (
        <group>
            <mesh castShadow position={[0, poleHeight / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            <Billboard position={[0, poleHeight + symbolSize / 2, 0]}>
                <Plane args={[symbolSize, symbolSize]}><meshStandardMaterial map={useTexture(item.iconUrl!)} transparent side={THREE.DoubleSide} alphaTest={0.5} /></Plane>
            </Billboard>
        </group>
    );
};

const PolygonObject = ({ obj }: { obj: APDObject }) => {
    const geometry = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return null;

        const shapePoints = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            shapePoints.push(new THREE.Vector2(
                obj.points[i] * SCALE_FACTOR,
                -obj.points[i+1] * SCALE_FACTOR // CRITICAL FIX: Invert Y-axis to prevent mirroring
            ));
        }

        if (isFence(obj)) {
            const fenceHeight = 2.0;
            const vertices = [];
            for (let i = 0; i < shapePoints.length - 1; i++) {
                const p1 = shapePoints[i];
                const p2 = shapePoints[i+1];
                const v1 = [p1.x, 0, -p1.y];
                const v2 = [p2.x, 0, -p2.y];
                vertices.push(...v1, ...v2, v1[0], fenceHeight, v1[2]);
                vertices.push(...v2, v2[0], fenceHeight, v2[2], v1[0], fenceHeight, v1[2]);
            }
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geom.computeVertexNormals();
            return geom;
        }
        
        const shape = new THREE.Shape(shapePoints);
        const extrudeSettings = { depth: obj.height3d || 2.5, bevelEnabled: false };
        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        return geom;

    }, [obj]);

    if (!geometry) return null;

    const isBuildingType = isBuilding(obj);

    return (
        <mesh geometry={geometry} castShadow receiveShadow rotation={isBuildingType ? [-Math.PI / 2, 0, 0] : [0,0,0]}>
            <meshStandardMaterial color={isBuildingType ? (obj.item.fill || '#C2B280') : (obj.item.stroke || '#A9A9A9')} side={THREE.DoubleSide} />
        </mesh>
    );
};


// --- The Main Object Wrapper ---
const ThreeDObject = ({ obj, item, background, onSelect }) => {
    const position = toWorld(obj.x, obj.y, background.width, background.height);
    const rotationY = -THREE.MathUtils.degToRad(obj.rotation || 0);

    return (
        <group name={obj.id} userData={{sourceObj: obj}} position={position} rotation={[0, rotationY, 0]} onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}>
            {isBuilding(obj) || isFence(obj) ? <PolygonObject obj={obj} /> :
             isSymbol(obj.type) && item?.iconUrl ? <SymbolObject item={item} /> :
             <BoxObject obj={obj} item={item} />}
        </group>
    );
};


// --- Scene & Boilerplate ---
const BackgroundPlane = React.memo(({ background }) => {
    const texture = useTexture(background.url);
    const planeWidth = background.width * SCALE_FACTOR;
    const planeHeight = background.height * SCALE_FACTOR;
    useEffect(() => () => texture.dispose(), [texture]);
    return <Plane args={[planeWidth, planeHeight]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><meshStandardMaterial map={texture} /></Plane>;
});

const SceneContent = (props: Omit<ThreeDViewProps, 'setIsLocked'>) => {
    const { objects, background, libraryCategories, selectedId, onSelect, onObjectChange, onSnapshotRequest, isLocked } = props;
    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);
    const { camera } = useThree();

    const handleSelect = useCallback((id: string | null) => {
        if (isLocked) return;
        onSelect(id);
    }, [isLocked, onSelect]);

    useEffect(() => {
        if (background) {
            const worldWidth = background.width * SCALE_FACTOR;
            const worldHeight = background.height * SCALE_FACTOR;
            const distance = Math.max(worldWidth, worldHeight) * 1.5;
            camera.position.set(0, distance, distance * 0.5);
            camera.lookAt(0, 0, 0);
        }
    }, [background, camera]);

    return (
        <>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[100, 100, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <Suspense fallback={null}>
                {background && <BackgroundPlane background={background} />}
                {objects.map(obj => (
                    <ThreeDObject key={obj.id} obj={obj} item={libraryItems.get(obj.type)} background={background} onSelect={handleSelect} />
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
    onObjectChange: (id: string, attrs: Partial<APDObject>) => void;
    onSnapshotRequest: () => void;
    isLocked: boolean;
    setIsLocked: (locked: boolean) => void;
}

export interface ThreeDViewHandles {
    capture: () => { url: string; width: number; height: number; } | null;
}

const ThreeDView = forwardRef<ThreeDViewHandles, ThreeDViewProps>((props, ref) => {
    const captureRef = useRef<any>();
    const handleDeselect = () => { if (!props.isLocked) props.onSelect(null); };

    useImperativeHandle(ref, () => ({ capture: () => captureRef.current?.capture() }));

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
            <Canvas shadows camera={{ fov: 50 }} gl={{ preserveDrawingBuffer: true, antialias: true }} style={{ touchAction: 'none' }} dpr={[1, 1.5]}>
                <SceneContent {...props} selectedId={props.isLocked ? null : props.selectedId} />
                <CaptureController ref={captureRef} />
            </Canvas>
        </div>
    );
});

export default ThreeDView;
