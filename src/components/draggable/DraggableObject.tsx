
import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Line, Rect, Group, Arc } from 'react-konva';
import useImage from 'use-image';
import {
    APDObject,
    isLineTool,
    isCrane,
    isPen,
    isGate,
    isFence
} from '../../types/index';
import CraneObject from '../canvas/CraneObject';
import { calculateStacking } from '../../utils/stacking';
import { calculateVisualSegments } from '../../utils/geometry';

interface DraggableObjectProps {
    obj: APDObject;
    objects?: APDObject[];
    isSelected: boolean;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>, immediate: boolean) => void;
    onDelete?: () => void;
    isDrawing: boolean;
    scale?: number;
}

const SAFE_DIMENSION = 25;

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, objects, isSelected, onSelect, onChange, onDelete, isDrawing, scale = 1 }) => {
    const shapeRef = useRef<any>();

    const width = obj.width || obj.item?.width || SAFE_DIMENSION;
    const height = obj.height || obj.item?.height || SAFE_DIMENSION;

    const imageUrl = obj.item?.iconUrl || '';
    const [image, imageStatus] = useImage(imageUrl, 'anonymous');

    const handleDragMove = (e: any) => {
        if (isDrawing) return;

        const target = e.target;
        let bestX = target.x();
        let bestY = target.y();

        // Calculate REAL dimensions for snapping logic
        let effectiveWidth = obj.width || obj.item?.width || SAFE_DIMENSION;
        let effectiveHeight = obj.height || obj.item?.height || SAFE_DIMENSION;

        // If Line/Fence, calculate bounding box from points
        if ((isLineTool(obj.type) || obj.type === 'fence' || obj.type === 'staket') && obj.points) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < obj.points.length; i += 2) {
                if (obj.points[i] < minX) minX = obj.points[i];
                if (obj.points[i] > maxX) maxX = obj.points[i];
                if (obj.points[i + 1] < minY) minY = obj.points[i + 1];
                if (obj.points[i + 1] > maxY) maxY = obj.points[i + 1];
            }
            if (minX !== Infinity) {
                effectiveWidth = maxX - minX;
                effectiveHeight = maxY - minY;
                // Note: This bounding box is relative to the object origin. 
                // Snapping logic below assumes width/height extends from (x,y).
                // For Lines, (x,y) is origin, but content might be offset (minX, minY).
                // This complicates Edge Snapping for Lines.
                // Ideally, we DISABLE Edge Snapping for Lines unless we account for minX/minY offset.
            }
        }

        // For simplicity: Use updated effective dimensions, but strictly disable edge snapping for Lines to avoid jumping.
        const width = effectiveWidth;
        const height = effectiveHeight;

        // Gate Snapping Logic (Snap to Fences)
        if (isGate(obj) && objects) {
            const centerX = bestX + width / 2;
            const centerY = bestY + height / 2;
            const snapThreshold = 25; // Balanced magnet force (was 60, too strong for small items)

            let minDistance = snapThreshold;
            let snapPos: { x: number, y: number } | null = null;
            let snapAngle = null;

            objects.forEach((other) => {
                // Check for 'fence' type or likely fence tools
                if ((isFence(other) || other.type === 'fence') && other.points && other.points.length >= 4) {
                    for (let i = 0; i < other.points.length - 2; i += 2) {
                        // Absolute coordinates of fence segment
                        // Absolute coordinates of fence segment, accounting for rotation
                        const rotRad = (other.rotation || 0) * Math.PI / 180;
                        const cos = Math.cos(rotRad);
                        const sin = Math.sin(rotRad);

                        const p1LocalX = other.points[i];
                        const p1LocalY = other.points[i + 1];
                        const p2LocalX = other.points[i + 2];
                        const p2LocalY = other.points[i + 3];

                        const p1x = other.x + (p1LocalX * cos - p1LocalY * sin);
                        const p1y = other.y + (p1LocalX * sin + p1LocalY * cos);
                        const p2x = other.x + (p2LocalX * cos - p2LocalY * sin);
                        const p2y = other.y + (p2LocalX * sin + p2LocalY * cos);

                        // Calculate distance from mouse/center to line segment
                        const dx = p2x - p1x;
                        const dy = p2y - p1y;
                        const lenSq = dx * dx + dy * dy;
                        let t = ((centerX - p1x) * dx + (centerY - p1y) * dy) / lenSq;

                        // Clamp t to segment [0, 1]
                        t = Math.max(0, Math.min(1, t));

                        const projX = p1x + t * dx;
                        const projY = p1y + t * dy;

                        const dist = Math.sqrt((centerX - projX) ** 2 + (centerY - projY) ** 2);

                        if (dist < minDistance) {
                            minDistance = dist;

                            // Calculate angle first
                            const angleRad = Math.atan2(dy, dx);
                            let deg = (angleRad * 180 / Math.PI);

                            // Determine flip
                            const crossProduct = dx * (centerY - p1y) - dy * (centerX - p1x);
                            if (crossProduct < 0) {
                                deg += 180;
                            }
                            snapAngle = deg;

                            // Calculate Correct Top-Left Position based on Rotation
                            // Center matches Proj.
                            // Vector Center -> TopLeft (in UNROTATED space) is (-w/2, -h/2).
                            // Rotate this vector by 'deg'.
                            const rad = deg * Math.PI / 180;
                            // Local offset from Center to TopLeft
                            const lx = -width / 2;
                            const ly = -height / 2;

                            // Rotate vector (lx, ly)
                            const rx = lx * Math.cos(rad) - ly * Math.sin(rad);
                            const ry = lx * Math.sin(rad) + ly * Math.cos(rad);

                            // Final Pos = Proj + RotatedOffset
                            // Note: Proj is where we want the Center to be.
                            // So x = ProjX + rx
                            snapPos = { x: projX + rx, y: projY + ry };
                        }
                    }
                }
            });

            if (snapPos) {
                bestX = snapPos.x;
                bestY = snapPos.y;
                if (snapAngle !== null) {
                    target.rotation(snapAngle);
                }
            }
        }

        // Standard Snapping Logic (Optional/Disabled or kept minimal)
        // ... (standard snapping removed to avoid "bouncy" feel)

        target.x(bestX);
        target.y(bestY);
        // Gate Snapping Logic (Snap to Fences)
        // ... (existing gate snapping code)

        // Stacking "Magnet" Logic (Snap to Building/Shed Centers/Corners)
        if (!isGate(obj) && objects) {
            // Hiss & Skylt Logic: Snap to Building Walls
            // QA FIX: Enable snapping for 'hiss' (elevator) and 'skylt' (sign)
            if (obj.type === 'hiss' || obj.type === 'skylt' || (obj.item?.name?.toLowerCase() || '').includes('skylt')) {
                const centerX = bestX + width / 2;
                const centerY = bestY + height / 2;
                const snapThreshold = 15.0; // Increased to 15m for easier grabbing

                let minDistance = snapThreshold;
                let snapPos: { x: number, y: number } | null = null;
                let snapAngle = null;
                let matchedBuildingHeight = null;

                objects.forEach((other) => {
                    // Snap to 'building' or 'bod' (sheds)
                    if ((other.type === 'building' || other.type.includes('bod')) && other.points && other.points.length >= 4) {
                        
                        // Calculate Centroid of the building (in world coords)
                        let polyCx = 0;
                        let polyCy = 0;
                        const numPoints = other.points.length / 2;
                        for(let k=0; k < other.points.length; k+=2) {
                             polyCx += other.points[k];
                             polyCy += other.points[k+1];
                        }
                        polyCx = other.x + (polyCx / numPoints);
                        polyCy = other.y + (polyCy / numPoints);

                        // Iterate building segments
                        for (let i = 0; i < other.points.length - 2; i += 2) {
                            const p1x = other.x + other.points[i];
                            const p1y = other.y + other.points[i + 1];
                            const p2x = other.x + other.points[i + 2];
                            const p2y = other.y + other.points[i + 3];

                            // Check distance to segment
                            const dx = p2x - p1x;
                            const dy = p2y - p1y;
                            const lenSq = dx * dx + dy * dy;
                            let t = ((centerX - p1x) * dx + (centerY - p1y) * dy) / lenSq;
                            
                            // Clamp t to segment (0..1)
                            t = Math.max(0, Math.min(1, t));

                            const projX = p1x + t * dx;
                            const projY = p1y + t * dy;
                            
                            // Distance from mouse center to the point on the line
                            const dist = Math.sqrt((centerX - projX) ** 2 + (centerY - projY) ** 2);

                            if (dist < minDistance) {
                                minDistance = dist;

                                // Normal vector (raw)
                                const len = Math.sqrt(lenSq);
                                let nx = -dy / len;
                                let ny = dx / len;

                                // Segment Center (World)
                                const segMidX = p1x + dx * 0.5;
                                const segMidY = p1y + dy * 0.5;

                                // Vector from Centroid to Segment (Outward direction approximation)
                                const vecOutX = segMidX - polyCx;
                                const vecOutY = segMidY - polyCy;

                                // Ensure Normal points OUTWARD relative to polygon centroid
                                if (nx * vecOutX + ny * vecOutY < 0) {
                                    nx = -nx;
                                    ny = -ny;
                                }

                                // Offset = half dimension of Hiss
                                const offsetDist = height / 2;

                                // ALWAYS snap to OUTSIDE: strict projection + outward normal * offset
                                snapPos = {
                                    x: projX + (nx * offsetDist) - width / 2,
                                    y: projY + (ny * offsetDist) - height / 2
                                };
                                
                                // Face OUTWARD (Away from wall)
                                const normalAngle = Math.atan2(ny, nx) * 180 / Math.PI;
                                snapAngle = normalAngle - 90; 

                                matchedBuildingHeight = other.height3d;
                            }
                        }
                    }
                });

                if (snapPos) {
                    bestX = snapPos.x;
                    bestY = snapPos.y;
                    if (snapAngle !== null) target.rotation(snapAngle);

                    // Store the height to apply on DragEnd (dirty hack: store in target temporary or just access in handleDragEnd?)
                    // handleDragEnd reads from target.
                    // We can't easily pass 'matchedBuildingHeight' to handleDragEnd via konva node props unless we attach it.
                    // Instead, let's just do valid snap here.
                    target.attrs.tempHeight3d = matchedBuildingHeight; // Attach to node temporarily
                }
            } else {
                // Improved Snapping Logic: Edge Snapping + Stacking
                let closestDist = Infinity;
                let snapX: number | null = null;
                let snapY: number | null = null;

                objects.forEach((other) => {
                    if (other.id === obj.id) return;

                    // DISABLE Edge Snapping for Line/Fence/Pen objects being dragged
                    // Their bounding box is complex and usually user doesn't want to snap the whole fence to a shed side.
                    if (isLineTool(obj.type)) return;

                    // DISABLE Snapping for "Fristående" Items (Rebar, Saw)
                    if (obj.type === 'rebar-station' || obj.type === 'saw-shed') return;

                    const isBase = other.type === 'building' || other.type.includes('bod') || other.type.includes('container') || other.type === 'kontor' || other.type === 'shed' || other.type === 'office';
                    if (!isBase) return;

                    const otherWidth = other.width || other.item?.width || SAFE_DIMENSION;
                    const otherHeight = other.height || other.item?.height || SAFE_DIMENSION;

                    const myCX = bestX + width / 2;
                    const myCY = bestY + height / 2;
                    const otherCX = other.x + otherWidth / 2;
                    const otherCY = other.y + otherHeight / 2;

                    // 1. Stack Snap (Inner Magnet) - "Fastna ovanpå"
                    // Only if we are fairly close to center (e.g. 25% overlap depth)
                    const stackTolerance = 10.0; // Restored to 10m for sticky stacking
                    const distToCenter = Math.sqrt((myCX - otherCX) ** 2 + (myCY - otherCY) ** 2);

                    if (distToCenter < stackTolerance) {
                        // Strong snap to center
                        if (distToCenter < closestDist) {
                            closestDist = distToCenter;
                            snapX = other.x;
                            snapY = other.y;
                        }
                        return; // Found a stack snap, check next object but this is likely winner for this object
                    }

                    // 2. Edge Snap (Outer Magnet) - "Sugas fast vid sidan"
                    // If not stacking, check edges.
                    const edgeTolerance = 5.0; // Restored to 5m for sticky edges

                    const myLeft = bestX;
                    const myRight = bestX + width;
                    const myTop = bestY;
                    const myBottom = bestY + height;

                    const otherLeft = other.x;
                    const otherRight = other.x + otherWidth;
                    const otherTop = other.y;
                    const otherBottom = other.y + otherHeight;

                    // Potential Snap positions
                    let tempX = bestX;
                    let tempY = bestY;
                    let snappedX = false;
                    let snappedY = false;

                    // X-Axis Snapping (Side-by-Side)
                    // Snap My Right to Other Left
                    if (Math.abs(myRight - otherLeft) < edgeTolerance) {
                        tempX = otherLeft - width;
                        snappedX = true;
                    }
                    // Snap My Left to Other Right
                    else if (Math.abs(myLeft - otherRight) < edgeTolerance) {
                        tempX = otherRight;
                        snappedX = true;
                    }
                    // Align Lefts (Flush)
                    else if (Math.abs(myLeft - otherLeft) < edgeTolerance) {
                        tempX = otherLeft;
                        snappedX = true;
                    }
                    // Align Rights (Flush)
                    else if (Math.abs(myRight - otherRight) < edgeTolerance) {
                        tempX = otherRight - width;
                        snappedX = true;
                    }


                    // Y-Axis Snapping (Top/Bottom)
                    // Snap My Bottom to Other Top
                    if (Math.abs(myBottom - otherTop) < edgeTolerance) {
                        tempY = otherTop - height;
                        snappedY = true;
                    }
                    // Snap My Top to Other Bottom
                    else if (Math.abs(myTop - otherBottom) < edgeTolerance) {
                        tempY = otherBottom;
                        snappedY = true;
                    }
                    // Align Tops (Flush)
                    else if (Math.abs(myTop - otherTop) < edgeTolerance) {
                        tempY = otherTop;
                        snappedY = true;
                    }
                    // Align Bottoms (Flush)
                    else if (Math.abs(myBottom - otherBottom) < edgeTolerance) {
                        tempY = otherBottom - height;
                        snappedY = true;
                    }

                    // If we found an edge snap, prioritize it over "no snap"
                    // But Stack snap (above) beats all if active.
                    if (snappedX || snappedY) {
                        // Use the snapped coords.
                        // If only one axis snapped, keep original mouse on other axis?
                        // Yes, allow sliding along the edge.

                        // BUT we want to support "Sliding along edge" which usually means secondary axis snaps to alignment too.
                        // E.g. Side-by-side -> Align Tops or Centers.
                        // Wait, I included "Flush" checks above.
                        // So if I drag along the side, "Align Tops" check should catch it.

                        // We need to compare this snap's quality (distance moved) against closestDist?
                        // Distance moved = dist(oldX, tempX) + dist(oldY, tempY).
                        const d = Math.sqrt((bestX - tempX) ** 2 + (bestY - tempY) ** 2);
                        if (d < 50) { // Only snap if movement is reasonable (within magnet range)
                            // Logic: We don't have a single "closestDist" for Edge vs Edge.
                            // Simple greedy: Just take the first valid edge snap? 
                            // Or the one closest to mouse?
                            // Let's overwite bestX/bestY immediately if we haven't found a Stack snap yet.
                            if (snapX === null) {
                                // Apply to the temporary variables used outside?
                                // We need to accumulate?
                                // No, let's just use a local winner.
                                // Just setting snapX/snapY here handles it.
                                snapX = snappedX ? tempX : null;
                                snapY = snappedY ? tempY : null;
                            }
                        }
                    }
                });

                if (snapX !== null) bestX = snapX;
                if (snapY !== null) bestY = snapY;
            }
        }

        target.x(bestX);
        target.y(bestY);
    };

    // handleDblClick and handleContextMenu removed as per user request (Height adjust only in 3D)

    const handleDragEnd = (e: any) => {
        const x = e.target.x();
        const y = e.target.y();
        const rotation = e.target.rotation(); // Capture new rotation

        // Hiss & Skylt Smart Height Logic
        let finalHeight3d = obj.height3d;
        if ((obj.type === 'hiss' || obj.type === 'skylt' || (obj.item?.name?.toLowerCase() || '').includes('skylt')) && e.target.attrs.tempHeight3d) {
            finalHeight3d = e.target.attrs.tempHeight3d;
            // For Signs, we might want to be at the TOP of the building + pole height?
            // Currently tempHeight3d is the building height.
            // SignObject in 3D uses position Y.
            // If we set 'height3d' on the object, we need to ensure ThreeDView/models.tsx uses it.
            // Actually, `ThreeDObject` handles `elevation`.
            // Let's assume `tempHeight3d` is intended to be the ELEVATION (Z-height).

            // Clean up
            e.target.attrs.tempHeight3d = undefined;
        }

        // Stacking Logic
        let newElevation = 0;
        let newFloorLabel = undefined; // Undefined means "remove existing label" if moved off

        if (objects && obj.type !== 'hiss') {
            // New Robust Logic - Use Shared Utility
            // This ensures logic matches "Drop" behavior exactly
            const dropWidth = width;
            const dropHeight = height;

            newElevation = calculateStacking(
                x,
                y,
                dropWidth,
                dropHeight,
                objects.filter(o => o.id !== obj.id) // Exclude self
            );

            // Re-implement the Prompt for Floor Label if we are stacking high up
            if (newElevation > 0.5 && (!obj.floorLabel || obj.floorLabel === '')) {
                const input = window.prompt("Ange våningsplan:\n\nPlan 0 = Marknivå\nPlan 1 = En våning upp\nPlan 2 = Två våningar upp\n\nSkriv t.ex. 'Plan 1'", "Plan 1");
                if (input !== null) {
                    newFloorLabel = input;
                }
            } else if (newElevation < 0.1 && obj.floorLabel) {
                // If moved to ground, maybe clear label? optional.
                // Let's keep it to avoid annoyance.
            }
        }

        // --- TRASH CAN DELETE CHECK ---
        // Check if dropped near the top of the viewport (Trash Area)
        // We use the raw event client coordinates
        // Assuming Trash Can is at Top Center, within top 100px.
        const stage = e.target.getStage();
        if (stage) {
            const pointer = stage.getPointerPosition();
            // Pointer is relative to stage container? No, usually relative to stage top-left.
            // But if stage is scrolled/panned?
            // Safer: Use window coordinates if available or assume fixed stage.
            // Let's rely on standard logic: If drag ends near top of VISIBLE screen.
            // Since we don't have easy access to DOM overlay refs here, we'll use a heuristic.
            // A better way: check `e.evt.clientY` (DOM event Y).
            // Trash area: Top 100px.
            const clientY = e.evt?.clientY;
            if (clientY !== undefined && clientY < 100) {
                // Trigger Delete
                if (onDelete && window.confirm("Ta bort objekt?")) {
                    onDelete();
                    return; // Skip update
                }
            }
        }

        onChange({ x, y, rotation, elevation: newElevation, floorLabel: newFloorLabel, height3d: finalHeight3d }, true);
    };

    // NOTE: onTransformEnd is now handled by CanvasPanel's Transformer

    // Visuals: Selection Frame Props
    const selectionFrameProps = {
        x: -2,
        y: -2,
        width: width + 4,
        height: height + 4,
        stroke: "#2196f3",
        strokeWidth: 2,
        dash: [5, 5],
        listening: false
    };

    const commonProps = {
        id: obj.id,
        name: obj.id,
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        draggable: !isDrawing, // Draggability is managed by the parent based on selection
        listening: !isDrawing,
        onClick: onSelect,
        onTap: onSelect,
        onDragMove: handleDragMove,
        onDragEnd: handleDragEnd,
        // onTransformEnd is removed
        ref: shapeRef,
        visible: obj.visible !== false,
    };

    // Wrap in a Group to ensure clean node hierarchy for Transformer
    if (isCrane(obj)) {
        return (
            <Group
                {...commonProps}
                draggable={!isDrawing} // Ensure group is draggable
            >
                {/* Pass obj but NOT commonProps to inner to avoid ID conflict on double-attach? 
                    Actually, if we put ID on wrapper, inner shouldn't have ID.
                    CraneObject applies props to ITS group.
                    So we have Group(id) -> CraneObject -> Group(id).
                    Double ID!
                */}
                <CraneObject obj={obj} drawingScale={scale} />
            </Group>
        );
    }

    if (isLineTool(obj.type)) {
        if (!obj.points || obj.points.length < 2) return null;

        // Calculate Bounding Box of points
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < obj.points.length; i += 2) {
            const px = obj.points[i];
            const py = obj.points[i + 1];
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
        }

        const bWidth = maxX - minX;
        const bHeight = maxY - minY;

        const lineSelectionProps = {
            x: minX - 5,
            y: minY - 5,
            width: bWidth + 10,
            height: bHeight + 10,
            stroke: "#2196f3", // Blue
            strokeWidth: 2,
            dash: [5, 5],
            listening: false
        };

        // Determine segments (with cuts for Gates)
        // Similar to 3D, transform Gates to local space
        let visualSegments = null;
        if (obj.type === 'fence' || obj.type === 'staket') {
            const gates = objects ? objects.filter(o => isGate(o)) : [];
            const localGates = gates.map(g => ({
                ...g,
                x: g.x - obj.x,
                y: g.y - obj.y
            }));

            visualSegments = calculateVisualSegments(obj.points, localGates, scale || 1);
        }

        return (
            <Group {...commonProps}>
                {isSelected && <Rect {...lineSelectionProps} />}

                {/* Visual Segments (Fences with Gaps) */}
                {visualSegments ? (
                    visualSegments.map((seg, idx) => (
                        <React.Fragment key={idx}>
                             {/* Backing Line for Contrast */}
                            <Line
                                points={[seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y]}
                                stroke="#ffffff"
                                strokeWidth={(obj.strokeWidth || 2) * 1.5}
                                dash={obj.dash} // Same dash to match gaps? Or solid to fill gaps? 
                                // Ideally solid backing fills the dash gaps, making it look like a solid white line with green dashes on top?
                                // User wanted "poppar ut". 
                                // If we use solid backing, the gaps become white.
                                // If we use same dash, the gaps are transparent.
                                // Let's try Solid Backing first as it maximizes visibility on dark maps.
                                // Actually, if it's solid backing, it looks like a white tube with green stripes. 
                                // Let's stick to matching dash for now, but slightly wider.
                                // Wait, if I use solid backing, the "gaps" in the fence will show white. That's good for visibility.
                                tension={0}
                                lineCap="round"
                                lineJoin="round"
                                opacity={0.7}
                                perfectDrawEnabled={false}
                                listening={false} 
                            />
                            <Line
                                points={[seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y]}
                                stroke={obj.stroke || '#000000'}
                                strokeWidth={obj.strokeWidth || 2}
                                dash={obj.dash}
                                tension={0} // Fences are straight
                                lineCap="round"
                                lineJoin="round"
                                fill={obj.fill}
                                opacity={1}
                                perfectDrawEnabled={false}
                                hitStrokeWidth={20}
                            />
                        </React.Fragment>
                    ))
                ) : (
                    // Default Continuous Line (Paths, Pens, or no-gap Fences)
                    <React.Fragment>
                        {/* Backing Line for Contrast (Walkway & Traffic) */}
                        {(obj.type === 'walkway' || obj.type === 'construction-traffic') && (
                            <Line
                                points={obj.points}
                                stroke="#ffffff"
                                strokeWidth={(obj.strokeWidth || 2) * 1.5}
                                dash={obj.dash}
                                tension={isPen(obj) ? 0.5 : 0}
                                lineCap="round"
                                lineJoin="round"
                                closed={false} // Walkways/Traffic are never closed polygons in this context
                                opacity={0.7}
                                perfectDrawEnabled={false}
                                listening={false}
                            />
                        )}
                        <Line
                            points={obj.points}
                            stroke={obj.stroke || '#000000'}
                            strokeWidth={obj.strokeWidth || 2}
                            dash={obj.dash}
                            tension={isPen(obj) ? 0.5 : 0}
                            lineCap="round"
                            lineJoin="round"
                            fill={obj.fill}
                            closed={obj.type === 'building'} // Only building is closed in isLineTool set
                            opacity={obj.type === 'building' ? 0.8 : 1}
                            perfectDrawEnabled={false}
                            hitStrokeWidth={20}
                        />
                    </React.Fragment>
                )}
            </Group>
        );
    }

    if (width <= 0 || height <= 0) return null;

    // Optimized rendering: Ensure Node Type consistency to prevent Transformer crashes
    // FIX: Add safety check for obj.item
    const isImageValid = imageStatus === 'loaded' && obj.item?.iconUrl && image && image.width > 0 && image.height > 0;

    if (isGate(obj)) {
        // Wrap in Group to add transparent Hit Area for better clickability on small gates
        // Minimum visual height of 20px (converted to map units)
        const currentScale = scale || 1;
        const minHitHeight = 20 / currentScale; // 20 pixels converted to meters/units
        const hitHeight = Math.max(height, minHitHeight);
        const hitOffsetY = (hitHeight - height) / 2;

        return (
            <Group {...commonProps}>
                {isSelected && <Rect {...selectionFrameProps} />}
                {isImageValid ? (
                    <KonvaImage image={image} width={width} height={height} />
                ) : (
                    <Rect width={width} height={height} fill={obj.fill || '#a0aec0'} stroke={obj.stroke || '#4a5568'} strokeWidth={obj.strokeWidth || 2} />
                )}
                {/* Invisible Hit Area */}
                <Rect
                    x={0}
                    y={-hitOffsetY}
                    width={width}
                    height={hitHeight}
                    fill="transparent"
                    listening={true}
                />
            </Group>
        );
    }

    if (isImageValid) {
        return (
            <Group {...commonProps}>
                {isSelected && <Rect {...selectionFrameProps} />}
                <KonvaImage image={image} width={width} height={height} />
            </Group>
        );
    }

    return (
        <Group {...commonProps}>
            {isSelected && <Rect {...selectionFrameProps} />}
            <Rect width={width} height={height} fill={obj.fill || '#a0aec0'} stroke={obj.stroke || '#4a5568'} strokeWidth={obj.strokeWidth || 2} perfectDrawEnabled={false} />
        </Group>
    );
};

export default React.memo(DraggableObject);
