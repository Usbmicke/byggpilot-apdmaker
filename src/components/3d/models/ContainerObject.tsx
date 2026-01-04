import React from 'react';
import * as THREE from 'three';
import { APDObject } from '../../../types';

export const ContainerObject = ({ obj, scale }: { obj: APDObject, scale: number }) => {
    // Sync 3D dimensions with 2D footprint
    const width = (obj.width || 6) * scale;
    const depth = (obj.height || 2.4) * scale;
    // Determine Type & Color
    let color = '#76FF03'; // Default Green (10m3)
    let hasNoRoof = false; // By default, containers have roofs
    let isSideOpen = false; // Open side (long side)
    let onlyBackWall = false; // Only back wall (no sides, no front)
    let wallThickness = 0.1;
    let targetHeight = 2.4; // Base height

    // Workshop Flags
    const isSawShed = obj.type.includes('saw-shed') || obj.type === 'saw_shed';
    const isRebarStation = obj.type.includes('rebar-station') || obj.type === 'rebar_station';

    if (obj.type.includes('container-30')) {
        color = '#00E5FF'; // Cyan
        hasNoRoof = true; // Open Top
        targetHeight = 2.2;
    } else if (obj.type.includes('tipp')) {
        color = '#2962FF'; // Blue
        hasNoRoof = true; // Open Top
        targetHeight = 1.25; // Handled nicely above though? No, this is fallback for obj properties if code flow reaches here?
        // Wait, 'tipp' logic is handled in the EARLIER if-block that returns early.
        // So this code block is for NON-tipp containers.
        // But let's keep it safe.
    } else if (isSawShed) {
        color = '#795548'; // Wood/Brown
        hasNoRoof = true; // No Roof
        onlyBackWall = true; // Back Wall Only
        targetHeight = 2.4;
    } else if (isRebarStation) {
        color = '#607D8B'; // Steel/Grey
        hasNoRoof = true; // No Roof
        onlyBackWall = true; // Back Wall Only
        targetHeight = 2.4;
    } else {
        // Default (10m3)
        targetHeight = 2.0;
    }

    // Safety clamp: Don't let height exceed width*1.5 (avoid towers on small icons)
    const maxDimension = Math.max(width, depth);
    const height = Math.min(targetHeight, maxDimension * 2.0); // Allow up to 2x aspect ratio, but cap at targetHeight

    // --- Tippcontainer Specific Logic ---
    if (obj.type.includes('tipp')) {
        // More specific geometry for Dumpster/Sopcontainer

        // Adjust dimensions to be smaller/shorter as requested
        const tWidth = width * 0.95;
        const tDepth = depth * 0.9;
        const tHeight = 1.25; // Significant height reduction (was 1.6)

        const bottomScale = 0.7;

        // Colors
        const wallColor = '#2962FF'; // Standard Blue
        const ribColor = '#1565C0'; // Darker Blue
        const wallThick = 0.05;

        // Custom Lid Color for 'Closed'
        const isClosed = obj.type.includes('stangd');
        // If closed, maybe use a darker blue or black lid?
        const lidColor = '#0D47A1';

        // Note: moved shape logic to useMemo not used for non-extruded part
        const createSideWall = () => {
            const s = new THREE.Shape();
            s.moveTo(0, 0);
            s.lineTo(tDepth * bottomScale, 0);

            const slant = (tDepth * (1 - bottomScale)) / 2;

            s.moveTo(slant, 0);
            s.lineTo(tDepth - slant, 0);
            s.lineTo(tDepth, tHeight);
            s.lineTo(0, tHeight);
            s.lineTo(slant, 0);

            // Use thicker walls for visual solidity
            const geom = new THREE.ExtrudeGeometry(s, { depth: wallThick, bevelEnabled: false });
            return geom;
        };

        const sideGeom = createSideWall(); // Removed useMemo for simplicity in extraction

        return (
            <group position={[-tWidth / 2, 0, -tDepth / 2]}>
                {/* Left Side */}
                <mesh geometry={sideGeom} position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <meshStandardMaterial color={wallColor} />
                </mesh>
                {/* Right Side */}
                <mesh geometry={sideGeom} position={[tWidth, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <meshStandardMaterial color={wallColor} />
                </mesh>

                <group position={[tWidth / 2, 0, tDepth / 2]}>
                    {/* Bottom Plate */}
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <boxGeometry args={[tWidth, 0.1, tDepth * bottomScale]} />
                        <meshStandardMaterial color={wallColor} />
                    </mesh>

                    {/* Front/Back Walls (Slanted) */}
                    {(() => {
                        const slant = (tDepth * (1 - bottomScale)) / 2;
                        const hyp = Math.sqrt(slant * slant + tHeight * tHeight);
                        const angle = Math.atan2(slant, tHeight);
                        return (
                            <group>
                                {/* Front Wall */}
                                <mesh position={[0, tHeight / 2, tDepth / 2 - slant / 2]} rotation={[angle, 0, 0]}>
                                    <boxGeometry args={[tWidth, hyp, wallThick]} />
                                    <meshStandardMaterial color={wallColor} />
                                </mesh>
                                {/* Back Wall */}
                                <mesh position={[0, tHeight / 2, -tDepth / 2 + slant / 2]} rotation={[-angle, 0, 0]}>
                                    <boxGeometry args={[tWidth, hyp, wallThick]} />
                                    <meshStandardMaterial color={wallColor} />
                                </mesh>
                            </group>
                        )
                    })()}

                    {/* Ribs */}
                    {[0.2, 0.5, 0.8].map((pct, i) => (
                        <group key={i}>
                            <mesh position={[-tWidth / 2 - 0.05, tHeight / 2, (pct - 0.5) * tDepth]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.05, tHeight * 0.8, 0.1]} />
                                <meshStandardMaterial color={ribColor} />
                            </mesh>
                            <mesh position={[tWidth / 2 + 0.05, tHeight / 2, (pct - 0.5) * tDepth]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.05, tHeight * 0.8, 0.1]} />
                                <meshStandardMaterial color={ribColor} />
                            </mesh>
                        </group>
                    ))}

                    {/* Lids (Exclusively for 'stangd') */}
                    {isClosed && (
                        <group position={[0, tHeight, 0]}>
                            <mesh position={[-tWidth / 4, 0.05, 0]} rotation={[0, 0, 0.05]}>
                                <boxGeometry args={[tWidth / 2 + 0.1, 0.05, tDepth + 0.2]} />
                                <meshStandardMaterial color={lidColor} roughness={0.5} />
                            </mesh>
                            <mesh position={[tWidth / 4, 0.05, 0]} rotation={[0, 0, -0.05]}>
                                <boxGeometry args={[tWidth / 2 + 0.1, 0.05, tDepth + 0.2]} />
                                <meshStandardMaterial color={lidColor} roughness={0.5} />
                            </mesh>
                            {/* Hint of handle? */}
                            <mesh position={[-tWidth / 4, 0.1, 0]}><boxGeometry args={[0.1, 0.1, 0.4]} /><meshStandardMaterial color="#999" /></mesh>
                            <mesh position={[tWidth / 4, 0.1, 0]}><boxGeometry args={[0.1, 0.1, 0.4]} /><meshStandardMaterial color="#999" /></mesh>
                        </group>
                    )}
                </group>
            </group>
        );
    }

    // Geometry Construction (Standard Container - Fallback)
    return (
        <group>
            {/* Floor */}
            <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[width, 0.2, depth]} />
                <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
            </mesh>

            {!hasNoRoof && (
                // Closed Top (Roof)
                <mesh castShadow position={[0, height, 0]}>
                    <boxGeometry args={[width + 0.2, 0.1, depth + 0.2]} /> {/* Slight overhang for roof */}
                    <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                </mesh>
            )}

            {/* Walls (Front/Back) - Long sides */}
            {[1, -1].map(dir => {
                // If Open Side or Only Back Wall, skip Front Wall (dir === 1)
                if ((isSideOpen || onlyBackWall) && dir === 1) return null;

                return (
                    <group key={`wall-z-${dir}`} position={[0, height / 2, dir * (depth / 2 - wallThickness / 2)]}>
                        <mesh>
                            <boxGeometry args={[width, height, wallThickness]} />
                            <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                        </mesh>
                        {/* Ribs (only for containers, skip for sheds if desired, but ok to keep for style) */}
                        {!isSawShed && [...Array(Math.floor(width / 0.5))].map((_, i) => (
                            <mesh key={i} position={[-width / 2 + (i + 0.5) * 0.5, 0, dir * wallThickness]} >
                                <boxGeometry args={[0.2, height - 0.2, 0.05]} />
                                <meshStandardMaterial color={color} roughness={0.8} />
                            </mesh>
                        ))}
                    </group>
                );
            })}

            {/* Walls (Left/Right) - Short ends */}
            {[1, -1].map(dir => {
                // Skip side walls if onlyBackWall is active
                if (onlyBackWall) return null;

                return (
                    <group key={`wall-x-${dir}`} position={[dir * (width / 2 - wallThickness / 2), height / 2, 0]}>
                        <mesh>
                            <boxGeometry args={[wallThickness, height, depth - 2 * wallThickness]} />
                            <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
                        </mesh>
                        {/* Container door details (only on back end if closed) */}
                        {dir === -1 && !hasNoRoof && !isSideOpen && (
                            <mesh position={[-wallThickness, 0, 0]}>
                                <boxGeometry args={[0.05, height - 0.2, depth / 2]} />
                                <meshStandardMaterial color="#333" />
                            </mesh>
                        )}
                    </group>
                );
            })}

            {/* Rubble/Fill for Open Containers */}
            {
                hasNoRoof && (
                    <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[width - 0.5, depth - 0.5]} />
                        <meshStandardMaterial color="#444" roughness={1} />
                    </mesh>
                )
            }

            {/* WORKSHOP CONTENTS */}
            {
                isSawShed && (
                    <group position={[0, 0, 0]}>
                        {/* Saw Table */}
                        <mesh position={[0, 0.8, 0]} castShadow>
                            <boxGeometry args={[1.5, 0.1, 0.8]} />
                            <meshStandardMaterial color="#D7CCC8" />
                        </mesh>
                        {/* Table Legs */}
                        <mesh position={[-0.6, 0.4, 0.3]}> <boxGeometry args={[0.1, 0.8, 0.1]} /> <meshStandardMaterial color="#5D4037" /> </mesh>
                        <mesh position={[0.6, 0.4, 0.3]}> <boxGeometry args={[0.1, 0.8, 0.1]} /> <meshStandardMaterial color="#5D4037" /> </mesh>
                        <mesh position={[-0.6, 0.4, -0.3]}> <boxGeometry args={[0.1, 0.8, 0.1]} /> <meshStandardMaterial color="#5D4037" /> </mesh>
                        <mesh position={[0.6, 0.4, -0.3]}> <boxGeometry args={[0.1, 0.8, 0.1]} /> <meshStandardMaterial color="#5D4037" /> </mesh>

                        {/* The Saw (Blade) */}
                        <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
                            <meshStandardMaterial color="silver" metalness={0.8} roughness={0.2} />
                        </mesh>
                    </group>
                )
            }

            {
                isRebarStation && (
                    <group position={[0, 0, 0]}>
                        {/* Rebar Rack */}
                        {/* Horizontal bars */}
                        <mesh position={[0, 0.5, -0.5]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>
                        <mesh position={[0, 0.5, 0.5]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>

                        {/* Rebars (Orange/Rust) */}
                        {[...Array(5)].map((_, i) => (
                            <mesh key={i} position={[-0.8 + i * 0.4, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <cylinderGeometry args={[0.02, 0.02, 2.2, 8]} />
                                <meshStandardMaterial color="#E65100" />
                            </mesh>
                        ))}
                        {[...Array(5)].map((_, i) => (
                            <mesh key={`b-${i}`} position={[-0.8 + i * 0.4, 0.65, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
                                <cylinderGeometry args={[0.02, 0.02, 2.2, 8]} />
                                <meshStandardMaterial color="#E65100" />
                            </mesh>
                        ))}
                    </group>
                )
            }

        </group >
    );
}
