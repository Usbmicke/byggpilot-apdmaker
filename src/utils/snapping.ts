
import { APDObject } from '../types';
import { isFence } from '../types';

interface SnapResult {
    x: number;
    y: number;
    rotation?: number;
    snapped: boolean;
}

export const calculateFenceSnap = (
    x: number,
    y: number,
    width: number, // 2D Width (Width of gate)
    height: number, // 2D Height (Depth of gate)
    objects: APDObject[],
    snapThreshold: number = 25
): SnapResult | null => {

    // We assume x, y are Top-Left coordinates of the object (Gate)
    // Snapping is based on Center Point
    const centerProbeX = x + width / 2;
    const centerProbeY = y + height / 2;

    let minDistance = snapThreshold;
    let bestSnap: SnapResult | null = null;

    objects.forEach((other) => {
        // Check for fence
        if ((isFence(other) || other.type === 'fence' || other.type === 'staket') && other.points && other.points.length >= 4) {

            for (let i = 0; i < other.points.length - 2; i += 2) {
                // Absolute fence segment coordinates
                const rotRad = (other.rotation || 0) * Math.PI / 180;
                const cos = Math.cos(rotRad);
                const sin = Math.sin(rotRad);

                // Local points in Fence Space
                const p1LocalX = other.points[i];
                const p1LocalY = other.points[i + 1];
                const p2LocalX = other.points[i + 2];
                const p2LocalY = other.points[i + 3];

                // Transform to World Space
                const p1x = other.x + (p1LocalX * cos - p1LocalY * sin);
                const p1y = other.y + (p1LocalX * sin + p1LocalY * cos);
                const p2x = other.x + (p2LocalX * cos - p2LocalY * sin);
                const p2y = other.y + (p2LocalX * sin + p2LocalY * cos);

                // Project CenterProbe onto Line Segment (p1-p2)
                const dx = p2x - p1x;
                const dy = p2y - p1y;
                const lenSq = dx * dx + dy * dy;

                if (lenSq === 0) continue;

                let t = ((centerProbeX - p1x) * dx + (centerProbeY - p1y) * dy) / lenSq;
                t = Math.max(0, Math.min(1, t)); // Clamp to segment

                const projX = p1x + t * dx;
                const projY = p1y + t * dy;

                const dist = Math.sqrt((centerProbeX - projX) ** 2 + (centerProbeY - projY) ** 2);

                if (dist < minDistance) {
                    minDistance = dist;

                    // Calculate Angle
                    const angleRad = Math.atan2(dy, dx);
                    let deg = (angleRad * 180 / Math.PI);

                    // Determine Flip (Cross Product check)
                    const crossProduct = dx * (centerProbeY - p1y) - dy * (centerProbeX - p1x);
                    if (crossProduct < 0) {
                        deg += 180;
                    }

                    // Calculate Correct Top-Left Position
                    // The 'proj' point is where the CENTER should be.
                    // We must back-calculate the Top-Left (x,y) from this Center.
                    // 1. Start with offset Center -> TopLeft in UNROTATED Gate: (-w/2, -h/2).
                    // 2. Rotate this offset by 'deg'.
                    // 3. Add to 'proj'.

                    const finalRad = deg * Math.PI / 180;
                    const lx = -width / 2;
                    const ly = -height / 2;

                    const rx = lx * Math.cos(finalRad) - ly * Math.sin(finalRad);
                    const ry = lx * Math.sin(finalRad) + ly * Math.cos(finalRad);

                    bestSnap = {
                        x: projX + rx,
                        y: projY + ry,
                        rotation: deg,
                        snapped: true
                    };
                }
            }
        }
    });

    return bestSnap;
};
