
import React, { Suspense, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Plane, GizmoHelper, GizmoViewport, useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useDrop } from 'react-dnd';
import { APDObject, LibraryCategory, LibraryItem, isBuilding, isSchakt, isSymbol, isFence, isCrane, isGate, isWalkway, isConstructionTraffic } from '../../types';
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
    PolygonObject,
    PathObject,
    HissObject,
    TippContainerObject,
    WCObject
} from './models';


const ThreeDObject = ({ obj, item, background, onSelect, isSelected, onChange }: { obj: APDObject, item: LibraryItem | undefined, background: any, onSelect: (id: string | null) => void, isSelected: boolean, onChange: (id: string, attrs: Partial<APDObject>) => void }) => {
    // DEFINITIVE FIX: The group for EVERY object is positioned at the object's (x, y) origin.
    const positionX = (obj.x - background.width / 2) * SCALE_FACTOR;
    const positionZ = (obj.y - background.height / 2) * SCALE_FACTOR;
    // Use elevation for Y, default to 0 if not present. Elevation is in meters (likely), coordinate system might be different.
    // If elevation is from the 2D logic (which seemed to use "stackHeight" of e.g. 2.6), and SCALE_FACTOR converts to 3D units.
    // We should assume elevation is already in "world units" or needs SCALING?
    // In DraggableObject we added "2.6" which is likely Meters.
    // In ThreeDView, SCALE_FACTOR is what?
    // Let's assume standard 1 unit = 1 meter in ThreeJS if configured so. 
    // Checking SCALE_FACTOR in the file... it's imported.
    // Let's look at existing code: `localX = (obj.points[i]) * SCALE_FACTOR`.
    // It seems 2D coords are pixels, converted to 3D meters via SCALE_FACTOR.
    // BUT elevation calculated in DraggableObject was `2.6` (meters).
    // So if 2.6 is meters, we probably use it directly for Y (since Y is up).
    // Let's try direct usage first.
    const positionY = (obj.elevation || 0);
    const rotationY = THREE.MathUtils.degToRad(obj.rotation || 0);

    const groupRef = useRef<THREE.Group>(null);

    const renderSpecificObject = () => {
        if (isBuilding(obj)) return <PolygonObject obj={obj} />;
        if (obj.type.startsWith('zone_') || isSchakt(obj)) return <GroundMarkingObject obj={obj} />;
        if (isFence(obj)) return <FenceObject obj={obj} />;
        if (isWalkway(obj) || isConstructionTraffic(obj)) return <PathObject obj={obj} />;

        // Standard, non-point-based objects.
        if (isCrane(obj)) return <CraneObject obj={obj} />;

        // Corrected type checks for 'Etablering' items
        if (obj.type === 'bygg-bod' || obj.type === 'kontor' || obj.type === 'shed' || obj.type === 'office') {
            return <SiteShedObject obj={obj} />;
        }
        if (obj.type === 'wc') return <WCObject obj={obj} />;
        if (obj.type === 'hiss') return <HissObject obj={obj} />;

        if (obj.type.includes('tipp')) return <TippContainerObject obj={obj} />;
        if (obj.type.includes('container')) return <ContainerObject obj={obj} />;
        if (obj.type === 'saw_shed' || obj.type === 'rebar_station') return <GenericWorkshopObject obj={obj} />;
        if (obj.type === 'light_mast' || obj.type === 'belysningsmast') return <LightingMastObject />;
        if (isGate(obj)) return <GateObject obj={obj} />;

        // Fallback for symbols or other icons
        if (isSymbol(obj.type) && item?.iconUrl) return <SignObject item={item} />;

        // Default fallback for unmatched items that have an icon (render as sign/billboard)
        if (item?.iconUrl) return <SignObject item={item} />;

        return null;
    };

    return (
        <>
            <group
                ref={groupRef}
                name={obj.id}
                userData={{ sourceObj: obj }}
                position={[positionX, positionY, positionZ]}
                rotation={[0, rotationY, 0]}
                onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}
            >
                {renderSpecificObject()}
            </group>
            {isSelected && (
                <TransformControls
                    object={groupRef as React.MutableRefObject<THREE.Object3D>}
                    mode="translate"
                    onObjectChange={(e) => {
                        if (groupRef.current) {
                            // Calculate new 2D positions from 3D transform
                            const newX3D = groupRef.current.position.x;
                            const newZ3D = groupRef.current.position.z;

                            const finalX = (newX3D / SCALE_FACTOR) + background.width / 2;
                            const finalY = -(newZ3D / SCALE_FACTOR) + background.height / 2;

                            onChange(obj.id, { x: finalX, y: finalY });
                        }
                    }}
                />
            )}
        </>
    );
};

const BackgroundPlane = React.memo(({ background }: { background: any }) => {
    const texture = useTexture(background.url) as THREE.Texture;
    const planeWidth = background.width * SCALE_FACTOR;
    const planeHeight = background.height * SCALE_FACTOR;

    useEffect(() => {
        return () => { if (texture && 'dispose' in texture) texture.dispose(); }
    }, [texture]);


    return (
        <Plane args={[planeWidth, planeHeight]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial map={texture} />
        </Plane>
    );
});

const SceneContent = (props: Omit<ThreeDViewProps, 'setIsLocked' | 'onAddObject'>) => {
    const { objects, background, libraryCategories, onSelect, selectedId, onObjectChange } = props;
    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);

    return (
        <>
            <CameraManager background={background} />
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[100, 100, 50]} intensity={2.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
            <Suspense fallback={null}>
                {background && <BackgroundPlane background={background} />}
                {objects.map(obj => (
                    <ThreeDObject
                        key={obj.id}
                        obj={obj}
                        item={libraryItems.get(obj.type)}
                        background={background}
                        onSelect={onSelect}
                        isSelected={obj.id === selectedId}
                        onChange={onObjectChange}
                    />
                ))}
            </Suspense>
            <OrbitControls makeDefault enabled={!selectedId} />

            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport axisColors={['#ff4040', '#40ff40', '#4040ff']} labelColor="white" />
            </GizmoHelper>
        </>
    );
};

const CaptureController = forwardRef((props, ref) => {
    const { gl, scene, camera } = useThree();
    useImperativeHandle(ref, () => ({
        capture: () => {
            try { gl.render(scene, camera); return { url: gl.domElement.toDataURL('image/png'), width: gl.domElement.width, height: gl.domElement.height }; } catch (e) { console.error("Capture failed:", e); return null; }
        }
    }));
    return null;
});

export interface ThreeDViewProps {
    objects: APDObject[];
    background: { url: string; width: number; height: number; } | null;
    libraryCategories: LibraryCategory[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onObjectChange: (id: string, attrs: Partial<APDObject>) => void;
    onAddObject: (item: LibraryItem, position: { x: number, y: number }) => void;
    onSnapshotRequest: () => void;
    isLocked: boolean;
    setIsLocked: (locked: boolean) => void;
}

export interface ThreeDViewHandles {
    capture: () => { url: string; width: number; height: number; } | null;
}

// Raycast Helper Component
const RaycastHelper = forwardRef((_, ref) => {
    const { camera, gl } = useThree();
    useImperativeHandle(ref, () => ({
        handleDrop: (clientX: number, clientY: number) => {
            const rect = gl.domElement.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((clientY - rect.top) / rect.height) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const target = new THREE.Vector3();

            if (raycaster.ray.intersectPlane(plane, target)) {
                return target;
            }
            return null;
        }
    }));
    return null;
});

const ThreeDView = forwardRef<ThreeDViewHandles, ThreeDViewProps>((props, ref) => {
    const captureRef = useRef<any>();
    const internalRef = useRef<{ handleDrop: (x: number, y: number) => THREE.Vector3 | null }>(null);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'LIBRARY_ITEM',
        drop: (item: LibraryItem, monitor) => {
            const offset = monitor.getClientOffset();
            if (offset && internalRef.current && props.background) {
                const worldPos = internalRef.current.handleDrop(offset.x, offset.y);
                if (worldPos) {
                    const finalX = (worldPos.x / SCALE_FACTOR) + props.background.width / 2;
                    const finalY = -(worldPos.z / SCALE_FACTOR) + props.background.height / 2;
                    props.onAddObject(item, { x: finalX, y: finalY });
                }
            }
        },
        collect: (monitor) => ({ isOver: monitor.isOver() })
    }), [props.background, props.onAddObject]);

    return (
        <div ref={drop} className={`w-full h-full relative bg-slate-900 ${isOver ? 'ring-4 ring-blue-500' : ''}`} onClick={() => props.onSelect(null)}>
            <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }} style={{ touchAction: 'none' }} dpr={[1, 1.5]}>
                <RaycastHelper ref={internalRef} />
                <SceneContent {...props} />
                <CaptureController ref={captureRef} />
            </Canvas>
        </div>
    );
});

export default ThreeDView;
