import { APDObject } from '../types';

export interface CutRange {
    start: number;
    end: number;
}

export interface LineSegment {
    p1: { x: number, y: number };
    p2: { x: number, y: number };
}

/**
 * Calculates segments of a polyline that should be REMOVED (cut) based on intersecting gates.
 * Returns a list of segments that SHOULD be rendered (i.e. the parts that remain).
 * 
 * @param linePoints Array of [x, y, x, y...] coordinates for the polyline
 * @param blockers Array of objects (gates) that should cut the line
 * @param scale Current map scale (pixels per meter) used for identifying 3D dimensions of gates if needed
 * @param lineId Optional ID for debugging
 */
export const calculateVisualSegments = (
    linePoints: number[],
    blockers: APDObject[],
    scale: number
): LineSegment[] => {
    if (!linePoints || linePoints.length < 4) return [];

    const segments: LineSegment[] = [];

    // Process each segment of the polyline
    for (let i = 0; i < linePoints.length - 2; i += 2) {
        const p1 = { x: linePoints[i], y: linePoints[i + 1] };
        const p2 = { x: linePoints[i + 2], y: linePoints[i + 3] };

        // 1. Find all cuts for this specific segment
        const cuts: CutRange[] = [];
        const segmentLen = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

        if (segmentLen < 1) {
            // Keep tiny segments? Yes, but no need to cut them probably.
            segments.push({ p1, p2 });
            continue;
        }

        blockers.forEach(blocker => {
            // We need to determine if the blocker (Gate) intersects this segment.
            // Blocker geometry:
            // Gate is usually defined by (x, y) = Top-Left corner.
            // Width = width in px.
            // Rotation = degrees.
            // We model the Gate as a Line Segment (or thin OBB) for cutting purposes.
            // Since Gates snap to fences, we can assume the Gate is roughly collinear.

            // Get Blocker Center & Dimensions
            const bWidth = (blocker.width || blocker.item?.width || 50);
            const bHeight = 20; // Assume thin thickness for the cut check
            const bx = blocker.x;
            const by = blocker.y;

            // Corrected Logic: Project the GATE SEGMENT onto the FENCE SEGMENT
            // Gate is a line from (bx, by) to (bx + w, by) rotated by `angleRad`
            // But wait, DraggableObject rotates around center? Or TopLeft?
            // In typical Konva, it's TopLeft unless offset is used.
            // Let's assume TopLeft pivot (standard).
            const gx = blocker.x;
            const gy = blocker.y; // Top-left of gate

            // Calculate Gate Vector
            const angleRad = (blocker.rotation || 0) * (Math.PI / 180);
            const gateVecX = Math.cos(angleRad);
            const gateVecY = Math.sin(angleRad);

            // Gate Center (Approximate, used for projection)
            const paramMid = bWidth / 2;
            const centerGateX = gx + gateVecX * paramMid;
            const centerGateY = gy + gateVecY * paramMid;

            // Project Gate Center onto Fence Segment
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lenSq = dx * dx + dy * dy;

            // t = projection of vector (GateCenter - P1) onto (P2 - P1)
            const t = ((centerGateX - p1.x) * dx + (centerGateY - p1.y) * dy) / lenSq;

            // Check if center is "near" the segment (0 to 1)
            // Relaxed tolerance because gates might be slightly longer than segment?
            // Or if gate is AT a corner (t near 0 or 1).
            if (t >= -0.1 && t <= 1.1) {
                // Check distance from infinite line
                const closestX = p1.x + t * dx;
                const closestY = p1.y + t * dy;
                const distSq = (centerGateX - closestX) ** 2 + (centerGateY - closestY) ** 2;

                // Distance Threshold (25px = ~2.5 meters at low zoom, or less. 50px tolerance)
                if (distSq < 2500) {
                    // Valid Intersection!
                    // Convert t to pixels along segment
                    const centerPos = t * Math.sqrt(lenSq);

                    // Gap Width: Use Gate Width (with slight visual reduction to show posts?)
                    // Or full width. User said "Hålet måste matcha".
                    const gapHalf = (bWidth * 0.95) / 2;

                    const startPixels = centerPos - gapHalf;
                    const endPixels = centerPos + gapHalf;

                    cuts.push({ start: startPixels, end: endPixels });
                }
            }
        });

        // 2. Sort & Merge Cuts
        cuts.sort((a, b) => a.start - b.start);

        const merged: CutRange[] = [];
        if (cuts.length > 0) {
            let curr = cuts[0];
            for (let k = 1; k < cuts.length; k++) {
                if (cuts[k].start < curr.end) {
                    curr.end = Math.max(curr.end, cuts[k].end);
                } else {
                    merged.push(curr);
                    curr = cuts[k];
                }
            }
            merged.push(curr);
        }

        // 3. Generate Segments from Un-Cut parts
        let currentPos = 0; // Pixels from p1

        merged.forEach(cut => {
            // Segment before the cut
            if (cut.start > currentPos) {
                // Create segment from currentPos to cut.start
                const t1 = Math.max(0, Math.min(1, currentPos / segmentLen));
                const t2 = Math.max(0, Math.min(1, cut.start / segmentLen));

                if (t2 > t1) {
                    segments.push({
                        p1: {
                            x: p1.x + (p2.x - p1.x) * t1,
                            y: p1.y + (p2.y - p1.y) * t1
                        },
                        p2: {
                            x: p1.x + (p2.x - p1.x) * t2,
                            y: p1.y + (p2.y - p1.y) * t2
                        }
                    });
                }
            }
            currentPos = Math.max(currentPos, cut.end);
        });

        // Final segment after last cut
        if (currentPos < segmentLen) {
            const t1 = Math.max(0, Math.min(1, currentPos / segmentLen));
            segments.push({
                p1: {
                    x: p1.x + (p2.x - p1.x) * t1,
                    y: p1.y + (p2.y - p1.y) * t1
                },
                p2: p2
            });
        }
    }

    return segments;
};
