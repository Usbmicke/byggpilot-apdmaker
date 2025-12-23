
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

interface DraggableObjectProps {
    obj: APDObject;
    objects?: APDObject[];
    isSelected: boolean;
    onSelect: (e: any) => void;
    onChange: (attrs: Partial<APDObject>, immediate: boolean) => void;
    onChange: (attrs: Partial<APDObject>, immediate: boolean) => void;
    isDrawing: boolean;
    scale?: number;
}

const SAFE_DIMENSION = 25;

const DraggableObject: React.FC<DraggableObjectProps> = ({ obj, objects, isSelected, onSelect, onChange, isDrawing, scale = 1 }) => {
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
        const width = obj.width || obj.item?.width || SAFE_DIMENSION;
        const height = obj.height || obj.item?.height || SAFE_DIMENSION;

        // Gate Snapping Logic (Snap to Fences)
        if (isGate(obj) && objects) {
            const centerX = bestX + width / 2;
            const centerY = bestY + height / 2;
            const snapThreshold = 25; // Balanced magnet force (was 60, too strong for small items)

            let minDistance = snapThreshold;
            let snapPos = null;
            let snapAngle = null;

            objects.forEach((other) => {
                // Check for 'fence' type or likely fence tools
                if ((isFence(other) || other.type === 'fence' || other.type === 'staket') && other.points && other.points.length >= 4) {
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
            // Hiss Logic: Snap to Building Walls
            if (obj.type === 'hiss') {
                const centerX = bestX + width / 2;
                const centerY = bestY + height / 2;
                const snapThreshold = 30; // Stronger magnet for hiss

                let minDistance = snapThreshold;
                let snapPos = null;
                let snapAngle = null;
                let matchedBuildingHeight = null;

                objects.forEach((other) => {
                    if (other.type === 'building' && other.points && other.points.length >= 4) {
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
                            t = Math.max(0, Math.min(1, t));

                            const projX = p1x + t * dx;
                            const projY = p1y + t * dy;
                            const dist = Math.sqrt((centerX - projX) ** 2 + (centerY - projY) ** 2);

                            if (dist < minDistance) {
                                minDistance = dist;

                                // Calculate Wall Angle
                                const angleRad = Math.atan2(dy, dx);
                                let wallAngle = (angleRad * 180 / Math.PI);

                                // Orient Hiss: Back should be against wall.
                                // Rotate 90 degrees relative to wall?
                                // Usually Hiss "front" is along X axis? need to check orientation.
                                // Let's try aligning rotation = wallAngle first, then offset 90 if needed.
                                // Assuming His "Back" is -Z or -Y local. 
                                // Let's set it Perpendicular (+90 deg) to wall
                                snapAngle = wallAngle + 90;

                                // Offset position: Place CENTER exactly height/2 away from wall along normal
                                // Normal vector: (-dy, dx) or (dy, -dx)
                                // Normalized normal
                                const len = Math.sqrt(lenSq);
                                const nx = -dy / len;
                                const ny = dx / len;

                                // Determine which side of wall we are on?
                                // Vector from wall to mouse
                                const v2kx = centerX - projX;
                                const v2ky = centerY - projY;
                                const dot = v2kx * nx + v2ky * ny;

                                // Push out along the normal on the side the mouse is
                                const pushDir = dot > 0 ? 1 : -1;

                                // Offset = half dimension of Hiss (conceptually 'height' in 2D is often depth)
                                const offsetDist = height / 2;

                                snapPos = {
                                    x: projX + (nx * pushDir * offsetDist) - width / 2,
                                    y: projY + (ny * pushDir * offsetDist) - height / 2
                                };

                                // Rotate to face OUT from wall (or IN?)
                                // If dot > 0 (outside), we want Back to wall.
                                // Face = Angle of Normal?
                                const normalAngle = Math.atan2(ny * pushDir, nx * pushDir) * 180 / Math.PI;
                                // Hiss model usually looks "Forward" -> set rotation to Normal Angle
                                // Adjust by -90 if model forward is X?
                                // Let's assume model Forward is -Z (standard ThreeJS).
                                // 2D rotation maps -Z to Up?
                                snapAngle = normalAngle + 90; // Trial and error adjustment for strict "Slaviskt" following of visual

                                matchedBuildingHeight = other.height3d; // Grab building height
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
                let snapX = null;
                let snapY = null;

                objects.forEach((other) => {
                    if (other.id === obj.id) return;
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
                    const stackTolerance = 25; // Pixels distance from center
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
                    const edgeTolerance = 15;

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

        // Hiss Smart Height Logic
        let finalHeight3d = obj.height3d;
        if (obj.type === 'hiss' && e.target.attrs.tempHeight3d) {
            finalHeight3d = e.target.attrs.tempHeight3d;
            // Clear temp
            e.target.attrs.tempHeight3d = undefined;
        }

        // Stacking Logic
        let newElevation = 0;
        let newFloorLabel = undefined; // Undefined means "remove existing label" if moved off

        if (objects && obj.type !== 'hiss') {
            // Find if we dropped ON TOP of another object (Stacking)
            // We check center point of dragged object
            const cx = x + width / 2;
            const cy = y + height / 2;

            for (const other of objects) {
                if (other.id === obj.id) continue;

                // Only stack on substantial objects (Buildings, Sheds, Containers)
                // We can check types or assume anything "large" is a base.
                const isBaseObject = other.type === 'building' || other.type.includes('bod') || other.type.includes('container') || other.type === 'kontor' || other.type === 'shed' || other.type === 'office';

                if (!isBaseObject) continue;

                const otherWidth = other.width || other.item?.width || SAFE_DIMENSION;
                const otherHeight = other.height || other.item?.height || SAFE_DIMENSION;

                if (cx > other.x && cx < other.x + otherWidth &&
                    cy > other.y && cy < other.y + otherHeight) {

                    // Stack on top!
                    const otherElevation = other.elevation || 0;


                    // FIX: Calculate true 3D height based on scale if height3d is not set
                    let stackHeight = other.height3d;

                    if (!stackHeight) {
                        if (other.type.includes('bod') || other.type.includes('kontor') || other.type.includes('shed') || other.type.includes('office')) {
                            // Logic from models.tsx SiteShedObject
                            const w = (other.width || other.item?.width || SAFE_DIMENSION) * scale;
                            const h = (other.height || other.item?.height || SAFE_DIMENSION) * scale;
                            const longLen = Math.max(w, h);

                            // Height logic: max(0.5, longLen * 0.35)
                            stackHeight = Math.max(0.5, longLen * 0.35);
                        } else if (other.type.includes('container')) {
                            // Logic from models.tsx ContainerObject
                            stackHeight = 2.6; // Standard
                        } else {
                            stackHeight = 3.0; // Default fallback
                        }
                    }

                    newElevation = otherElevation + stackHeight;

                    // Trigger prompt for Floor/Level with clearer instructions
                    const input = window.prompt("Ange våningsplan:\n\nPlan 0 = Marknivå\nPlan 1 = En våning upp\nPlan 2 = Två våningar upp\n\nSkriv t.ex. 'Plan 1'", obj.floorLabel || "Plan 1");

                    if (input !== null) {
                        newFloorLabel = input;
                    } else {
                        // Cancelled prompt -> Keep old one
                        newFloorLabel = obj.floorLabel;
                    }

                    // Break after finding the top-most (or first) valid base
                    break;
                }
            }
        }

        onChange({ x, y, rotation, elevation: newElevation, floorLabel: newFloorLabel, height3d: finalHeight3d }, true);
    };

    // NOTE: onTransformEnd is now handled by CanvasPanel's Transformer

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
        return (
            <Line
                {...commonProps}
                points={obj.points}
                stroke={obj.stroke || '#000000'}
                strokeWidth={obj.strokeWidth || 2}
                dash={obj.dash}
                tension={isPen(obj) ? 0.5 : 0}
                lineCap="round"
                lineJoin="round"
                fill={obj.fill}
                closed={obj.type === 'polygon' || obj.type === 'building' || obj.type === 'zone'} // Auto-close shapes for buildings
                opacity={obj.type === 'building' ? 0.8 : 1}
                perfectDrawEnabled={false} // Optimization and crash prevention
            />
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
        return <KonvaImage {...commonProps} image={image} width={width} height={height} />;
    }

    return <Rect {...commonProps} width={width} height={height} fill={obj.fill || '#a0aec0'} stroke={obj.stroke || '#4a5568'} strokeWidth={obj.strokeWidth || 2} perfectDrawEnabled={false} />;
};

export default React.memo(DraggableObject);
