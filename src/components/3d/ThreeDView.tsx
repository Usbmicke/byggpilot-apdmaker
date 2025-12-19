
import React, { Suspense, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, Plane, GizmoHelper, GizmoViewport, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryCategory, LibraryItem, isBuilding, isSchakt, isSymbol, isFence, isCrane, isGate } from '../../types';
import { SCALE_FACTOR } from '../../utils/coordinateUtils';
import CameraManager from './CameraManager';
import {
    CraneObject,
    SiteShedObject,
    ContainerObject,
    LightingMastObject,
    FenceObject,
    GateObject,
    SignObject,
    GenericWorkshopObject,
    GroundMarkingObject,
    PolygonObject
} from './models';


const ThreeDObject = ({ obj, item, background, onSelect }) => {
    // DEFINITIVE FIX: The group for EVERY object is positioned at the object's (x, y) origin.
    const positionX = (obj.x - background.width / 2) * SCALE_FACTOR;
    const positionZ = -(obj.y - background.height / 2) * SCALE_FACTOR;
    const rotationY = -THREE.MathUtils.degToRad(obj.rotation || 0);

    const renderSpecificObject = () => {
        // The child component is now responsible for drawing itself relative to the group's origin.
        // No special positioning logic is needed here.
        if (isBuilding(obj)) return <PolygonObject obj={obj} />;
        if (obj.type.startsWith('zone_') || isSchakt(obj)) return <GroundMarkingObject obj={obj} />;
        if (isFence(obj)) return <FenceObject obj={obj} />;

        // Standard, non-point-based objects.
        if (isCrane(obj)) return <CraneObject obj={obj} />;
        if (obj.type === 'shed' || obj.type === 'office') return <SiteShedObject obj={obj} />;
        if (obj.type.includes('container')) return <ContainerObject obj={obj} />;
        if (obj.type === 'saw_shed' || obj.type === 'rebar_station') return <GenericWorkshopObject obj={obj} />;
        if (obj.type === 'light_mast') return <LightingMastObject />;
        if (isGate(obj)) return <GateObject obj={obj} />;
        if (isSymbol(obj.type) && item?.iconUrl) return <SignObject item={item} />;
        return null;
    };

    return (
        <group 
            name={obj.id} 
            userData={{ sourceObj: obj }} 
            position={[positionX, 0, positionZ]} 
            rotation={[0, rotationY, 0]} 
            onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}
        >
            {renderSpecificObject()}
        </group>
    );
};

const BackgroundPlane = React.memo(({ background }) => {
    const texture = useTexture(background.url);
    const planeWidth = background.width * SCALE_FACTOR;
    const planeHeight = background.height * SCALE_FACTOR;
    useEffect(() => () => texture.dispose(), [texture]);

    return (
        <Plane args={[planeWidth, planeHeight]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial map={texture} />
        </Plane>
    );
});

const SceneContent = (props: Omit<ThreeDViewProps, 'setIsLocked'>) => {
    const { objects, background, libraryCategories, onSelect } = props;
    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);

    return (
        <>
            <CameraManager background={background} />
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[100, 100, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <Suspense fallback={null}>
                {background && <BackgroundPlane background={background} />}
                {objects.map(obj => (
                    <ThreeDObject key={obj.id} obj={obj} item={libraryItems.get(obj.type)} background={background} onSelect={onSelect} />
                ))}
            </Suspense>
            <OrbitControls makeDefault />
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
        <div className="w-full h-full relative bg-slate-900" onClick={() => props.onSelect(null)}>
            <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }} style={{ touchAction: 'none' }} dpr={[1, 1.5]}>
                <SceneContent {...props} />
                <CaptureController ref={captureRef} />
            </Canvas>
        </div>
    );
});

export default ThreeDView;
