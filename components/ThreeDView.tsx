
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Billboard, Html, Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { APDObject, isSchakt, isFence, isWalkway, isCrane, SchaktAPDObject } from '../types/index';

const GROUND_SIZE_DEFAULT = 2000;

interface ThreeDViewProps {
    objects: APDObject[];
    background: { url: string; width: number; height: number; } | null;
    updateObject: (id: string, attrs: Partial<APDObject>) => void;
}

interface ErrorBoundaryProps {
    children?: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("3D View Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
             return this.props.fallback || (
                <div className="flex items-center justify-center h-full w-full bg-slate-900 text-slate-300 flex-col gap-4">
                    <h3 className="text-xl font-bold">Ett fel inträffade i 3D-vyn</h3>
                    <p className="text-sm">Kunde inte rendera 3D-miljön. Prova att ladda om.</p>
                    <button onClick={() => this.setState({ hasError: false })} className="bg-blue-600 px-4 py-2 rounded text-white">Försök igen</button>
                </div>
             );
        }
        return this.props.children;
    }
}

function useTextureSafe(url: string | undefined) {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    useEffect(() => {
        if (!url) return;
        const loader = new THREE.TextureLoader();
        loader.load(url, (tex) => {
            tex.anisotropy = 16;
            tex.colorSpace = THREE.SRGBColorSpace;
            setTexture(tex);
        }, undefined, (err) => console.warn(`Failed to load texture: ${url}`, err));
    }, [url]);
    return texture;
}

const SafeTexturePlane: React.FC<{ url: string; width: number; height: number }> = ({ url, width, height }) => {
    const texture = useTextureSafe(url);
    return (
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[width, height]} />
            {texture ? <meshBasicMaterial map={texture} toneMapped={false} /> : <meshStandardMaterial color="#334155" />}
        </mesh>
    );
}

const SafeIconBillboard: React.FC<{ obj: APDObject; offset: { x: number; y: number } }> = ({ obj, offset }) => {
    const url = (obj as any).iconUrl;
    const texture = useTextureSafe(url);
    const size = isCrane(obj) ? 100 : 40; 
    const yPos = isCrane(obj) ? 50 : 25;
    if (!url) return null;

    return (
        <Billboard position={[obj.x - offset.x, yPos, obj.y - offset.y]}>
            <mesh>
                <planeGeometry args={[size, size]} />
                {texture ? <meshBasicMaterial map={texture} transparent alphaTest={0.5} side={THREE.DoubleSide} toneMapped={false} /> : <meshBasicMaterial color="#fbbf24" />}
            </mesh>
            <mesh position={[0, -yPos/2, 0]}>
                 <cylinderGeometry args={[0.5, 0.5, yPos, 4]} />
                 <meshStandardMaterial color="#333" />
            </mesh>
        </Billboard>
    );
}

const GroundPlane: React.FC<{ background: { url: string; width: number; height: number; } | null }> = ({ background }) => {
    const width = background?.width || GROUND_SIZE_DEFAULT;
    const height = background?.height || GROUND_SIZE_DEFAULT;

    if (!background || !background.url) {
         return (
            <group>
                <Grid infiniteGrid fadeDistance={2000} sectionColor="#4f4f4f" cellColor="#333" />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                    <planeGeometry args={[width, height]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            </group>
        );
    }
    return <SafeTexturePlane url={background.url} width={width} height={height} />;
};

const Building: React.FC<{ obj: SchaktAPDObject; offset: { x: number; y: number }; onUpdate: (id: string, attrs: Partial<APDObject>) => void; }> = ({ obj, offset, onUpdate }) => {
    const [hovered, setHover] = useState(false);
    const [selected, setSelected] = useState(false);
    
    const width = obj.width;
    const depth = obj.height; 
    const height = obj.height3d || 50; 
    const color = obj.color3d || '#94a3b8';
    const rotationRad = -(obj.rotation * Math.PI / 180);
    const x = obj.x - offset.x;
    const z = obj.y - offset.y;

    return (
        <group position={[x, height / 2, z]} rotation={[0, rotationRad, 0]}>
            <mesh onClick={(e) => { e.stopPropagation(); setSelected(!selected); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={hovered ? '#60a5fa' : color} transparent opacity={isSchakt(obj) ? 0.9 : 1} />
            </mesh>
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
                <lineBasicMaterial color="white" opacity={0.3} transparent />
            </lineSegments>
            {selected && (
                <Html position={[0, height/2 + 20, 0]} center className="pointer-events-none" zIndexRange={[100, 0]}>
                     <div className="bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-600 pointer-events-auto flex flex-col gap-2 min-w-[150px]">
                        <label className="text-xs text-slate-400 font-bold uppercase">Höjd: {Math.round(height)}m</label>
                        <input type="range" min="10" max="500" value={height} onChange={(e) => onUpdate(obj.id, { height3d: parseInt(e.target.value) })} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        <label className="text-xs text-slate-400 font-bold uppercase">Färg</label>
                        <div className="flex gap-1 flex-wrap">
                            {['#94a3b8', '#fca5a5', '#fde047', '#86efac', '#93c5fd', '#c084fc', '#ffffff', '#333333'].map(c => (
                                <div key={c} onClick={() => onUpdate(obj.id, { color3d: c })} className={`w-6 h-6 rounded-full cursor-pointer border-2 ${color === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                     </div>
                </Html>
            )}
        </group>
    );
};

const Fence3D: React.FC<{ points: number[]; offset: { x: number; y: number }; color: string; height: number; transparent?: boolean; }> = ({ points, offset, color, height, transparent }) => {
    const segments = useMemo(() => {
        const segs = [];
        for (let i = 0; i < points.length - 2; i += 2) {
            segs.push({
                start: { x: points[i] - offset.x, y: points[i+1] - offset.y },
                end: { x: points[i+2] - offset.x, y: points[i+3] - offset.y }
            });
        }
        return segs;
    }, [points, offset]);

    return (
        <group>
            {segments.map((seg, idx) => {
                const dx = seg.end.x - seg.start.x;
                const dy = seg.end.y - seg.start.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                const angle = Math.atan2(dy, dx);
                const midX = (seg.start.x + seg.end.x) / 2;
                const midY = (seg.start.y + seg.end.y) / 2;

                return (
                    <mesh key={idx} position={[midX, height/2, midY]} rotation={[0, -angle, 0]}>
                        <boxGeometry args={[len, height, 2]} />
                        <meshStandardMaterial color={color} opacity={transparent ? 0.4 : 1} transparent={!!transparent} side={THREE.DoubleSide} />
                    </mesh>
                );
            })}
        </group>
    );
}

const CameraController = ({ resetSignal }: { resetSignal: number }) => {
    const controlsRef = useRef<any>();
    const { camera } = useThree();
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.reset();
            camera.position.set(0, 800, 800);
        }
    }, [resetSignal, camera]);

    return <OrbitControls ref={controlsRef} makeDefault minDistance={50} maxDistance={8000} maxPolarAngle={Math.PI / 2 - 0.05} />;
}

const ThreeDView: React.FC<ThreeDViewProps> = ({ objects, background, updateObject }) => {
    const [resetSignal, setResetSignal] = useState(0);
    
    const offset = useMemo(() => ({
        x: background ? background.width / 2 : 0,
        y: background ? background.height / 2 : 0
    }), [background]);

    return (
        <ErrorBoundary>
            <div className="flex-1 relative h-full bg-slate-900 w-full">
                <div className="absolute top-4 left-4 z-10 bg-slate-800/80 p-3 rounded-xl backdrop-blur-sm border border-slate-600 text-slate-300 shadow-xl">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        3D Kontroll
                    </h3>
                    <p className="text-xs mb-3 text-slate-400">Vänsterklick: Rotera, Högerklick: Panorera</p>
                    <button onClick={() => setResetSignal(s => s + 1)} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-3 rounded shadow transition-colors text-xs">
                        Återställ Kamera
                    </button>
                </div>

                <Canvas shadows camera={{ position: [0, 800, 800], fov: 45 }} gl={{ preserveDrawingBuffer: true, antialias: true }} dpr={[1, 2]}>
                    <color attach="background" args={['#1e293b']} />
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[500, 1000, 500]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                    <directionalLight position={[-500, 500, -500]} intensity={0.6} />
                    <Stars radius={3000} depth={100} count={5000} factor={6} saturation={0} fade speed={1} />

                    <group position={[0, 0, 0]}>
                        <GroundPlane background={background} />
                        {objects && objects.map(obj => {
                            if (isSchakt(obj)) {
                                return <Building key={obj.id} obj={obj} offset={offset} onUpdate={updateObject} />;
                            }
                            if (isFence(obj)) {
                                return <Fence3D key={obj.id} points={obj.points} offset={offset} color="#d946ef" height={30} />;
                            }
                            if (isWalkway(obj)) {
                                return <Fence3D key={obj.id} points={obj.points} offset={offset} color="#22d3ee" height={3} />;
                            }
                            if ((obj as any).iconUrl) {
                                return <SafeIconBillboard key={obj.id} obj={obj} offset={offset} />;
                            }
                            return null;
                        })}
                    </group>

                    <CameraController resetSignal={resetSignal} />
                </Canvas>
            </div>
        </ErrorBoundary>
    );
};

export default ThreeDView;
