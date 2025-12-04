
import React, { Suspense, useMemo, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, Plane, useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, LibraryCategory, isBuilding, isLine, isSchakt } from '../../types';

const SCALE_FACTOR = 1 / 50;

// Memoized komponent för ett enskilt 3D-objekt
const ThreeDObject = React.memo(({ obj, background, item, onSelect, objectRef }: { obj: APDObject, background: any, item: any, onSelect: () => void, objectRef: React.Ref<THREE.Object3D> }) => {
    const bgWidth = background?.width ?? 0;
    const bgHeight = background?.height ?? 0;
    const position: [number, number, number] = [(obj.x - bgWidth / 2) * SCALE_FACTOR, 0, (obj.y - bgHeight / 2) * SCALE_FACTOR];
    
    const handleClick = (e: any) => {
        e.stopPropagation(); // Stoppar klicket från att nå canvas och avmarkera direkt
        onSelect();
    };

    const rotationY = -THREE.MathUtils.degToRad(obj.rotation || 0);

    if (isBuilding(obj) || item?.name.toLowerCase().includes('bod')) {
        position[1] = 1.5; // Höjd för byggnader
        return <mesh ref={objectRef} position={position} rotation={[0, rotationY, 0]} castShadow onClick={handleClick}><boxGeometry args={[5, 3, 2.5]} /><meshStandardMaterial color="#d1d5db" /></mesh>;
    }

    if (isLine(obj) && obj.points && obj.points.length >= 4) {
        const vectors = obj.points.map((p, i) => i % 2 === 0 ? new THREE.Vector3((obj.points[i] - bgWidth / 2) * SCALE_FACTOR, 0.1, (obj.points[i + 1] - bgHeight / 2) * SCALE_FACTOR) : null).filter(v => v) as THREE.Vector3[];
        if (vectors.length < 2) return null;
        const curve = new THREE.CatmullRomCurve3(vectors, false);
        return <mesh ref={objectRef} castShadow onClick={handleClick}><tubeGeometry args={[curve, 64, 0.2, 8, false]} /><meshStandardMaterial color={obj.stroke || '#ffffff'} /></mesh>;
    }

    if (isSchakt(obj)) {
        position[1] = 0.05;
        const width = (obj.width || 0) * SCALE_FACTOR;
        const height = (obj.height || 0) * SCALE_FACTOR;
        return <mesh ref={objectRef} position={position} rotation={[0, rotationY, 0]} onClick={handleClick}><boxGeometry args={[width, 0.1, height]} /><meshStandardMaterial color={obj.fill || '#a1662f'} transparent opacity={0.7} /></mesh>;
    }

    return null;
});

// Huvudkomponent för 3D-vyn med fullständig interaktivitet
const ThreeDView = ({ objects, background, libraryCategories, selectedId, onSelect, onObjectChange, onSnapshot }: 
    { objects: APDObject[]; background: any; libraryCategories: LibraryCategory[]; selectedId: string | null; onSelect: (id: string | null) => void; onObjectChange: (id: string, attrs: Partial<APDObject>) => void; onSnapshot: () => void; }) => {
    
    const objectRefs = useRef(new Map<string, THREE.Object3D>());
    const transformRef = useRef<any>(null);

    const libraryItems = useMemo(() => new Map(libraryCategories.flatMap(cat => cat.items).map(item => [item.type, item])), [libraryCategories]);
    const selectedObject = useMemo(() => objects.find(obj => obj.id === selectedId), [objects, selectedId]);

    // Hanterar förändringar från TransformControls
    const handleTransform = useCallback(() => {
        if (!transformRef.current || !selectedId) return;
        const obj = transformRef.current.object as THREE.Object3D;
        if (!obj) return;

        const bgWidth = background?.width ?? 0;
        const bgHeight = background?.height ?? 0;

        const newAttrs: Partial<APDObject> = {
            x: (obj.position.x / SCALE_FACTOR) + (bgWidth / 2),
            y: (obj.position.z / SCALE_FACTOR) + (bgHeight / 2),
            rotation: -THREE.MathUtils.radToDeg(obj.rotation.y),
        };
        
        onObjectChange(selectedId, newAttrs);

    }, [selectedId, onObjectChange, background, SCALE_FACTOR]);

    return (
        <div className="w-full h-full absolute top-0 left-0">
            <Canvas shadows camera={{ position: [0, 60, 80], fov: 60 }} onClick={() => onSelect(null)}>
                {/* Miljö & Belysning */}
                <Sky sunPosition={[100, 20, 100]} />
                <ambientLight intensity={1.5} />
                <directionalLight position={[100, 100, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                
                <Suspense fallback={null}>
                    <BackgroundPlane background={background} />
                    {/* Mappar och renderar alla objekt */}
                    {objects.map(obj => (
                        <ThreeDObject
                            key={obj.id}
                            obj={obj}
                            background={background}
                            item={libraryItems.get(obj.item.type)}
                            onSelect={() => onSelect(obj.id)}
                            objectRef={el => { if (el) objectRefs.current.set(obj.id, el); }}
                        />
                    ))}
                </Suspense>

                {/* Visar TransformControls för det valda objektet */}
                {selectedId && objectRefs.current.has(selectedId) && (
                     <TransformControls
                        ref={transformRef}
                        object={objectRefs.current.get(selectedId)}
                        onMouseDown={onSnapshot} // Skapa en "snapshot" för ångra-funktionen när man börjar dra
                        onObjectChange={handleTransform} // Uppdatera kontinuerligt vid ändring
                        mode={selectedObject && isLine(selectedObject) ? 'scale' : 'translate'} // Byt läge för linjer
                    />
                )}

                <Grid args={[100, 100]} infiniteGrid fadeDistance={150} />
                <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
            </Canvas>
        </div>
    );
};

export default ThreeDView;
