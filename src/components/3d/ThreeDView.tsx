
import React, { Suspense, useMemo, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, Plane, useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryCategory, isBuilding, isLine, isSchakt } from '../../types';

const SCALE_FACTOR = 1 / 50;

// Renderar bakgrundsritningen
const BackgroundPlane = ({ background }: { background: { url: string; width: number; height: number; } | null }) => {
    if (!background) return null;
    const texture = useTexture(background.url);
    const aspect = background.width / background.height;
    return (
        <Plane args={[100, 100 / aspect]} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial map={texture} />
        </Plane>
    );
};

// Renderar ett interaktivt 3D-objekt
const ThreeDObject = React.memo(({ obj, background, item, onSelect }: { obj: APDObject, background: any, item: any, onSelect: () => void }) => {
    const bgWidth = background?.width ?? 0;
    const bgHeight = background?.height ?? 0;
    const position: [number, number, number] = [(obj.x - bgWidth / 2) * SCALE_FACTOR, 0, (obj.y - bgHeight / 2) * SCALE_FACTOR];

    const handleClick = (e: any) => {
        e.stopPropagation(); // Förhindra att klicket går vidare till canvas (vilket skulle avmarkera)
        onSelect();
    };

    if (isBuilding(obj) || item?.name.toLowerCase().includes('bod')) {
        position[1] = 1.5;
        return <mesh position={position} rotation={[0, -THREE.MathUtils.degToRad(obj.rotation || 0), 0]} castShadow onClick={handleClick}><boxGeometry args={[5, 3, 2.5]} /><meshStandardMaterial color="#d1d5db" /></mesh>;
    }

    if (isLine(obj) && obj.points && obj.points.length >= 4) {
        const vectors = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            vectors.push(new THREE.Vector3((obj.points[i] - bgWidth / 2) * SCALE_FACTOR, 0.1, (obj.points[i + 1] - bgHeight / 2) * SCALE_FACTOR));
        }
        const curve = new THREE.CatmullRomCurve3(vectors, false);
        return <mesh castShadow onClick={handleClick}><tubeGeometry args={[curve, 64, 0.2, 8, false]} /><meshStandardMaterial color={obj.stroke || '#ffffff'} /></mesh>;
    }

    if (isSchakt(obj)) {
        position[1] = 0.05;
        return <mesh position={position} rotation={[0, -THREE.MathUtils.degToRad(obj.rotation || 0), 0]} onClick={handleClick}><boxGeometry args={[(obj.width || 0) * SCALE_FACTOR, 0.1, (obj.height || 0) * SCALE_FACTOR]} /><meshStandardMaterial color={obj.fill || '#a1662f'} transparent opacity={0.7} /></mesh>;
    }

    return null;
});

// Huvudkomponent med full interaktivitet
const ThreeDView = ({ objects, background, libraryCategories, onObjectChange }: { objects: APDObject[]; background: any; libraryCategories: LibraryCategory[], onObjectChange: (change: Partial<APDObject>) => void; }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const objectRefs = useRef(new Map<string, THREE.Object3D>());

    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);
    const selectedObject = useMemo(() => objects.find(obj => obj.id === selectedId), [objects, selectedId]);
    const transformRef = useRef<any>(null);

    const handleObjectChange = useCallback(() => {
        if (!transformRef.current || !selectedObject) return;
        const obj = objectRefs.current.get(selectedObject.id);
        if (!obj) return;
        
        const { x, y, z } = obj.position;
        const rotation = -THREE.MathUtils.radToDeg(obj.rotation.y);
        const bgWidth = background?.width ?? 0;
        const bgHeight = background?.height ?? 0;
        
        onObjectChange({ 
            id: selectedObject.id,
            x: (x / SCALE_FACTOR) + (bgWidth / 2),
            y: (z / SCALE_FACTOR) + (bgHeight / 2),
            rotation,
            // Skalning kan läggas till här vid behov
        });
    }, [selectedObject, onObjectChange, background]);

    return (
        <div className="w-full h-full absolute top-0 left-0">
            <Canvas shadows camera={{ position: [0, 60, 80], fov: 60 }} onClick={() => setSelectedId(null)}>
                <Sky sunPosition={[100, 20, 100]} />
                <ambientLight intensity={1.2} />
                <directionalLight position={[100, 100, 50]} intensity={2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                
                <Suspense fallback={null}>
                    <BackgroundPlane background={background} />
                    {objects.map(obj => (
                        <ThreeDObject
                            key={obj.id}
                            obj={obj}
                            background={background}
                            item={libraryItems.get(obj.item.type)}
                            onSelect={() => setSelectedId(obj.id)}
                        />
                    ))}
                </Suspense>

                {selectedId && selectedObject && (
                     <TransformControls
                        ref={transformRef}
                        object={objectRefs.current.get(selectedId)}
                        onMouseUp={handleObjectChange}
                        onObjectChange={handleObjectChange} // För kontinuerlig uppdatering
                    />
                )}

                <Grid args={[100, 100]} infiniteGrid fadeDistance={150} />
                <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
            </Canvas>
        </div>
    );
};

export default ThreeDView;
