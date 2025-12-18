
import React, { Suspense, useMemo, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, Plane, GizmoHelper, GizmoViewport, useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryCategory, LibraryItem, isBuilding, isSchakt, isSymbol, isFence, isCrane, isGate } from '../../types';
import { SCALE_FACTOR } from '../../utils/coordinateUtils';
import {
    CraneObject,
    SiteShedObject,
    ContainerObject,
    LightingMastObject,
    FenceObject,
    GateObject,
    SignObject,
    GenericWorkshopObject,
    GroundMarkingObject
} from './models';

const toWorld = (x: number, y: number, bgWidth: number, bgHeight: number): [number, number, number] => {
    const worldX = (x - bgWidth / 2) * SCALE_FACTOR;
    const worldZ = (y - bgHeight / 2) * SCALE_FACTOR;
    return [worldX, 0, worldZ];
};

const get2DAttributesFrom3D = (obj3d: THREE.Object3D, bgWidth: number, bgHeight: number): Partial<APDObject> => {
    const sourceObj = obj3d.userData.sourceObj as APDObject;
    const newX = (obj3d.position.x / SCALE_FACTOR) + (bgWidth / 2);
    const newY = (obj3d.position.z / SCALE_FACTOR) + (bgHeight / 2);
    const rotation = -THREE.MathUtils.radToDeg(obj3d.rotation.y);
    let extra: Partial<APDObject> = {};

    if (isBuilding(sourceObj)) {
        const currentHeight = obj3d.scale.y * (sourceObj.height3d || 2.5);
        extra.height3d = Math.max(0.5, currentHeight);
    }

    return { x: newX, y: newY, rotation, ...extra };
};

const Controls = ({ selectedId, objects, onObjectChange, background }) => {
    const { scene } = useThree();
    const orbitRef = useRef<any>();
    const transformRef = useRef<any>();

    useEffect(() => {
        const selectedObject = selectedId ? scene.getObjectByName(selectedId) : null;
        const sourceApdObj = objects.find(o => o.id === selectedId);
        const tc = transformRef.current;

        if (tc) {
            if (selectedObject && sourceApdObj) {
                tc.attach(selectedObject);
                const isScalable = isBuilding(sourceApdObj);
                tc.setMode(isScalable ? 'scale' : 'translate');
                tc.showX = !isScalable;
                tc.showZ = !isScalable;
                tc.showY = isScalable;
            } else {
                tc.detach();
            }
        }
    }, [selectedId, scene, objects]);

    const handleObjectChange = useCallback(() => {
        const tc = transformRef.current;
        if (!tc || !tc.object) return;
        const obj3d = tc.object;

        if (obj3d && obj3d.userData.sourceObj) {
            const newAttrs = get2DAttributesFrom3D(obj3d, background.width, background.height);
            onObjectChange(obj3d.userData.sourceObj.id, newAttrs);
            if (isBuilding(obj3d.userData.sourceObj)) {
                // IMPORTANT: Reset scale after applying it to the 2D attribute.
                // The 3D scale is derived from the 2D height3d property, not by scaling the mesh directly.
                obj3d.scale.y = 1;
            }
        }
    }, [background, onObjectChange]);

    return (
        <>
            <TransformControls
                ref={transformRef}
                onObjectChange={handleObjectChange} // Fired on mouse up
                onDraggingChanged={dragging => {
                    if (orbitRef.current) {
                        orbitRef.current.enabled = !dragging;
                    }
                }}
            />
            <OrbitControls ref={orbitRef} makeDefault target={[0, 0, 0]} />
        </>
    );
};

const PolygonObject = ({ obj }: { obj: APDObject }) => {
    const geometry = useMemo(() => {
        if (!obj.points || obj.points.length < 4) return null;
        const shapePoints = obj.points.map((p, i) => i % 2 === 0 ? new THREE.Vector2(obj.points[i] * SCALE_FACTOR, -obj.points[i+1] * SCALE_FACTOR) : null).filter(Boolean) as THREE.Vector2[];
        const shape = new THREE.Shape(shapePoints);
        // The extrusion depth is now directly controlled by height3d
        const extrudeSettings = { depth: obj.height3d || 2.5, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [obj.points, obj.height3d]);

    return (
        <mesh geometry={geometry} castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={obj.item.fill || '#C2B280'} side={THREE.DoubleSide} />
        </mesh>
    );
};


// --- The Main Object Wrapper (ROUTER) ---
const ThreeDObject = ({ obj, item, background, onSelect }) => {
    const position = toWorld(obj.x, obj.y, background.width, background.height);
    const rotationY = -THREE.MathUtils.degToRad(obj.rotation || 0);

    const renderSpecificObject = () => {
        if (obj.type.startsWith('zone_') || isSchakt(obj)) return <GroundMarkingObject obj={obj} />;
        if (isBuilding(obj)) return <PolygonObject obj={obj} />;
        if (isCrane(obj)) return <CraneObject obj={obj} />;
        if (obj.type === 'shed' || obj.type === 'office') return <SiteShedObject obj={obj} />;
        if (obj.type.includes('container')) return <ContainerObject obj={obj} />;
        if (obj.type === 'saw_shed' || obj.type === 'rebar_station') return <GenericWorkshopObject obj={obj} />;
        if (obj.type === 'light_mast') return <LightingMastObject />;
        if (isFence(obj)) return <FenceObject obj={obj} />;
        if (isGate(obj)) return <GateObject obj={obj} />;
        if (isSymbol(obj.type) && item?.iconUrl) return <SignObject item={item} />;
        return null;
    };

    return (
        <group name={obj.id} userData={{sourceObj: obj}} position={position} rotation={[0, rotationY, 0]} onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}>
            {renderSpecificObject()}
        </group>
    );
};


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

    return (
        <>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[100, 100, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <Suspense fallback={null}>
                {background && <BackgroundPlane background={background} />}
                {objects.map(obj => (
                    <ThreeDObject key={obj.id} obj={obj} item={libraryItems.get(obj.type)} background={background} onSelect={onSelect} />
                ))}
            </Suspense>
            {!isLocked && <Controls selectedId={selectedId} objects={objects} onObjectChange={onObjectChange} background={background} />}
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
        try { gl.render(scene, camera); return { url: gl.domElement.toDataURL('image/png'), width: gl.drawingBufferWidth, height: gl.drawingBufferHeight }; } catch (e) { console.error("Capture failed:", e); return null; }
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
    return (
        <div className="w-full h-full relative bg-slate-900" onClick={() => { if (!props.isLocked) props.onSelect(null); }}>
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={(e) => { e.stopPropagation(); props.setIsLocked(!props.isLocked); }}
                    className={`backdrop-blur-sm font-bold p-2 rounded-lg shadow-lg transition-all border-2 border-white/20 ${props.isLocked ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                    {props.isLocked ? 'LOCKED' : 'UNLOCKED'}
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
