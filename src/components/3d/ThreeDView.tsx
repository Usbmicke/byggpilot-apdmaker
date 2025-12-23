
import React, { Suspense, useMemo, useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Plane, GizmoHelper, GizmoViewport, useTexture, TransformControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useDrop } from 'react-dnd';
import { APDObject, LibraryCategory, LibraryItem, isBuilding, isSchakt, isSymbol, isFence, isCrane, isGate, isWalkway, isConstructionTraffic, isPen, isLine, isZone } from '../../types';

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
    WCObject,
    LineObject
} from './models';


const SelectionOverlay = ({ selectedId, objects, onChange }: { selectedId: string | null, objects: APDObject[], onChange: (id: string, attrs: Partial<APDObject>) => void }) => {
    if (!selectedId) return null;

    const selectedObject = objects.find(o => o.id === selectedId);
    if (!selectedObject) return null;

    const isBuildingObj = isBuilding(selectedObject);
    // Allow Hiss, Bod, Kontor to also use this panel
    const isHeightAdjustable = isBuildingObj || selectedObject.type === 'hiss' || selectedObject.type.includes('bod') || selectedObject.type.includes('kontor') || selectedObject.type.includes('container') || selectedObject.type.includes('shed');

    if (!isHeightAdjustable) return null;

    const currentHeight = selectedObject.height3d || (selectedObject.type === 'hiss' ? 15 : 2.9);

    // Dynamic Title
    const title = selectedObject.type === 'hiss' ? 'Hiss' : (isBuildingObj ? 'Byggnad' : 'Sektion');

    const updateHeight = (delta: number) => {
        const newHeight = Math.max(1, currentHeight + delta);
        onChange(selectedObject.id, { height3d: newHeight });
    };

    return (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-2xl border border-gray-200 w-72 animate-in fade-in slide-in-from-right-4 duration-300 z-50 font-sans pointer-events-auto">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></div>
                    <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                </div>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">ID: {selectedObject.id.slice(0, 4)}</span>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Höjdjustering
                    </label>
                    <div className="flex items-center space-x-2 mb-2">
                        <button
                            onClick={() => updateHeight(-1)}
                            className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xl transition-all active:scale-95 shadow-sm border border-gray-200 hover:border-gray-300"
                            title="Minska höjd"
                        >
                            -
                        </button>
                        <div className="flex-1 h-12 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-3xl font-extrabold text-gray-800 tracking-tight">
                                {Number(currentHeight).toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-400 font-medium ml-1 mt-2">m</span>
                        </div>
                        <button
                            onClick={() => updateHeight(1)}
                            className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xl transition-all active:scale-95 shadow-lg shadow-zinc-900/20"
                            title="Öka höjd"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="pt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between text-xs text-gray-400 mb-1 font-medium">
                        <span>1m</span>
                        <span>Dragläge</span>
                        <span>50m</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        step="0.5"
                        value={currentHeight}
                        onChange={(e) => onChange(selectedObject.id, { height3d: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
                    />
                </div>
            </div>
        </div>
    );
};

const ThreeDObject = ({ obj, item, background, onSelect, isSelected, onChange, scale, objects }: { obj: APDObject, item: LibraryItem | undefined, background: any, onSelect: (id: string | null) => void, isSelected: boolean, onChange: (id: string, attrs: Partial<APDObject>) => void, scale: number, objects: APDObject[] }) => {
    // Helper to determine if object should snap/rotate around its Center or its Top-Left/Origin.
    // Point-based objects (Buildings, Fences, Lines) usually have specific point data relative to an origin, so we keep them as-is.
    // Fixed-size objects (Cranes, Sheds, Containers, Gates) should pivot around their center for correct rotation.
    const shouldPivotCenter = (obj: APDObject) => {
        const type = obj.type;
        // Exclude everything that has 'points' property effectively OR explicit Top-Left origin models
        if (isFence(obj) || isLine(obj) || isPen(obj) || isWalkway(obj) || isConstructionTraffic(obj) || isBuilding(obj) || isZone(obj) || isSchakt(obj) || isGate(obj)) {
            return false;
        }
        return true;
    };

    const isCenterPivot = shouldPivotCenter(obj);
    const widthOffset = isCenterPivot ? (obj.width || 0) / 2 : 0;
    const heightOffset = isCenterPivot ? (obj.height || 0) / 2 : 0;

    // DEFINITIVE FIX: The group for EVERY object is positioned at the object's (x, y) origin.
    // For Center-Pivot objects, we shift the 3D position by half-width/height so the 3D model (which is centered at 0,0) aligns with the 2D Center.
    const positionX = (obj.x + widthOffset - background.width / 2) * scale;
    // FIX: Z-axis is positive downwards (matches 2D Y-axis direction).
    const positionZ = (obj.y + heightOffset - background.height / 2) * scale;
    // Use elevation for Y, default to 0 if not present. Elevation is in meters (likely), coordinate system might be different.
    const positionY = (obj.elevation || 0); // Elevation (Y-up)
    // FIX: Negate rotation because 2D (CW) != 3D (CCW Y-Axis)
    const rotationY = -THREE.MathUtils.degToRad(obj.rotation || 0);

    const groupRef = useRef<THREE.Group>(null);

    const renderSpecificObject = () => {
        // Pass isSelected to PolygonObject for blue frame
        if (isBuilding(obj)) return <PolygonObject obj={obj} scale={scale} isSelected={isSelected} />;
        // ... (rest same) ...
        if (obj.type.startsWith('zone_') || isSchakt(obj)) return <GroundMarkingObject obj={obj} item={item} scale={scale} />;
        if (isFence(obj)) return <FenceObject obj={obj} scale={scale} objects={objects} />; // Pass objects for gate cutting
        if (isWalkway(obj) || isConstructionTraffic(obj)) return <PathObject obj={obj} item={item} scale={scale} />;
        if (isPen(obj) || isLine(obj)) return <LineObject obj={obj} item={item} scale={scale} />;

        // Standard, non-point-based objects.
        if (isCrane(obj)) return <CraneObject obj={obj} scale={scale} />;

        // Corrected type checks for 'Etablering' items
        if (obj.type === 'bygg-bod' || obj.type === 'kontor' || obj.type === 'shed' || obj.type === 'office') {
            return <SiteShedObject obj={obj} scale={scale} />;
        }
        if (obj.type === 'wc') return <WCObject obj={obj} scale={scale} />;
        if (obj.type === 'hiss') return <HissObject obj={obj} scale={scale} />;

        if (obj.type.includes('tipp')) return <TippContainerObject obj={obj} scale={scale} />;
        if (obj.type.includes('container')) return <ContainerObject obj={obj} scale={scale} />;
        if (obj.type === 'saw_shed' || obj.type === 'rebar_station' || obj.type === 'saw-shed' || obj.type === 'rebar-station') return <ContainerObject obj={obj} scale={scale} />;
        if (obj.type === 'light_mast' || obj.type === 'belysningsmast') return <LightingMastObject />;
        if (isGate(obj)) return <GateObject obj={obj} scale={scale} />;

        // Fallback for symbols or other icons
        if (isSymbol(obj.type) && item?.iconUrl) return <SignObject item={item} obj={obj} />; // Pass obj for floorLabel

        // Default fallback for unmatched items that have an icon (render as sign/billboard)
        if (item?.iconUrl) return <SignObject item={item} obj={obj} />;

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
                {/* 3D Handles removed in favor of 2D Overlay */}
            </group>
            {isSelected && (
                <>
                    {/* Main Positioning Controls - LOCKED Y-AXIS to prevent "flying" */}
                    <TransformControls
                        object={groupRef as React.MutableRefObject<THREE.Object3D>}
                        mode="translate"
                        showY={false} // Disable Y-axis movement!
                        onObjectChange={(e) => {
                            if (groupRef.current) {
                                // Calculate new 2D positions from 3D transform
                                const newX3D = groupRef.current.position.x;
                                const newZ3D = groupRef.current.position.z;

                                const finalX = (newX3D / scale) + background.width / 2;
                                // FIX: Inverse of Z calculation above
                                const finalY = (newZ3D / scale) + background.height / 2;

                                // FORCE Y to original elevation to prevent drift if bug
                                groupRef.current.position.y = positionY;

                                onChange(obj.id, { x: finalX, y: finalY });
                            }
                        }}
                    />
                </>
            )}
        </>
    );
};

const BackgroundPlane = React.memo(({ background, scale }: { background: any, scale: number }) => {
    const texture = useTexture(background.url) as THREE.Texture;
    const planeWidth = background.width * scale;
    const planeHeight = background.height * scale;

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
    const { objects, background, libraryCategories, onSelect, selectedId, onObjectChange, scale } = props;
    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);

    return (
        <>
            <CameraManager background={background} scale={scale} />
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[100, 200, 100]} intensity={1.5} castShadow />

            <group>
                <Suspense fallback={null}>
                    {background && <BackgroundPlane background={background} scale={scale} />}
                    {objects.map(obj => (
                        <ThreeDObject
                            key={obj.id}
                            obj={obj}
                            item={libraryItems.get(obj.type)}
                            background={background}
                            onSelect={onSelect}
                            isSelected={obj.id === selectedId}
                            onChange={onObjectChange}
                            scale={scale}
                            objects={objects}
                        />
                    ))}
                </Suspense>
            </group>

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
            const originalPixelRatio = gl.getPixelRatio();
            try {
                // Temporarily increase resolution for high-quality export
                gl.setPixelRatio(3);
                gl.render(scene, camera);
                const data = {
                    url: gl.domElement.toDataURL('image/png', 1.0),
                    width: gl.domElement.width, // Captured width (will be 3x css width)
                    height: gl.domElement.height
                };
                return data;
            } catch (e) {
                console.error("Capture failed:", e);
                return null;
            } finally {
                // Always restore original pixel ratio
                gl.setPixelRatio(originalPixelRatio);
            }
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
    scale: number;
}

export interface ThreeDViewHandles {
    capture: () => { url: string; width: number; height: number; } | null;
}

// Raycast Helper Component
const RaycastHelper = forwardRef((_, ref) => {
    const { camera, gl, scene } = useThree();
    useImperativeHandle(ref, () => ({
        handleDrop: (clientX: number, clientY: number) => {
            const rect = gl.domElement.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((clientY - rect.top) / rect.height) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

            // 1. Check for intersections with Buildings first (for stacking)
            // Filter scene children to find meshes that are "Buildings" or "Sheds"
            // We can look for objects with userData.sourceObj
            const candidates: THREE.Object3D[] = [];
            scene.traverse((child) => {
                if (child.userData?.sourceObj) {
                    // It's one of our APD Objects
                    // We only want to land on "Solid" things (Buildings, Sheds, Containers)
                    // We need to find the actual MESH inside the Group
                    child.traverse((subChild) => {
                        if ((subChild as THREE.Mesh).isMesh) {
                            candidates.push(subChild);
                        }
                    });
                }
            });

            // Intersect candidates
            const intersects = raycaster.intersectObjects(candidates, false);

            if (intersects.length > 0) {
                // We hit an object!
                // Sort by distance (default)
                const hit = intersects[0];
                // Return point.y as the new elevation
                // We must subtract the ground level? No, y is absolute height.
                // But our positionY logic is 'elevation'.
                // If we hit a roof at y=3. 
                // We want the new object to have elevation=3.
                return hit.point;
            }

            // 2. Fallback: Intersect Ground Plane
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const target = new THREE.Vector3();

            if (raycaster.ray.intersectPlane(plane, target)) {
                // Ground hit, elevation 0
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
                    const finalX = (worldPos.x / props.scale) + props.background.width / 2;
                    // FIX: Inverse Z calculation for dropping
                    const finalY = (worldPos.z / props.scale) + props.background.height / 2;

                    // NEW: Capture Elevation (Y-axis in 3D)
                    const elevation = worldPos.y;

                    // Offset for new object height? 
                    // ideally we'd know the height of the new object, but for now we just place it AT the hit point.
                    // If we hit a roof at y=3, elevation=3. The object (origin at bottom) will sit on roof.

                    props.onAddObject(item, { x: finalX, y: finalY, elevation: elevation, rotation: 0 });
                }
            }
        },
        collect: (monitor) => ({ isOver: monitor.isOver() })
    }), [props.background, props.onAddObject]);

    return (
        <div ref={drop} className={`w-full h-full relative bg-zinc-950 ${isOver ? 'ring-4 ring-zinc-500' : ''}`}>
            <Canvas
                shadows
                gl={{ preserveDrawingBuffer: true, antialias: true }}
                style={{ touchAction: 'none' }}
                dpr={[1, 1.5]}
                onPointerMissed={() => props.onSelect(null)}
            >
                <RaycastHelper ref={internalRef} />
                <SceneContent {...props} />
                <CaptureController ref={captureRef} />
            </Canvas>

            {/* 2D Selection Overlay */}
            <SelectionOverlay selectedId={props.selectedId} objects={props.objects} onChange={props.onObjectChange} />
        </div>
    );
});

export default ThreeDView;
