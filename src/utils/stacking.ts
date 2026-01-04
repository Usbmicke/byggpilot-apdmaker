
import { APDObject } from '../types';

/**
 * Calculates the appropriate elevation (Z-height) for a new object based on existing objects at the location.
 * Uses a simple 2D bounding box intersection test.
 */
export const calculateStacking = (
    x: number,
    y: number,
    width: number,
    height: number,
    objects: APDObject[]
): number => {
    let maxElevation = 0;

    // Define the new object's footprint
    const newLeft = x;
    const newRight = x + width;
    const newTop = y;
    const newBottom = y + height;

    objects.forEach(obj => {
        // Skip purely 2D markings that shouldn't cause stacking (like Zones, Lines, Paths)
        if (isGroundObject(obj)) return;

        // Existing object dimensions
        // We need to resolve width/height if not explicit (e.g. some objects rely on defaults)
        // For simplicity, we assume obj.width/height or reasonable library defaults are populated.
        // If an object is rotated, this simple AABB check is an approximation, but usually sufficient for "stacking on top".

        const objW = obj.width || 1;
        const objH = obj.height || 1;

        const objLeft = obj.x;
        const objRight = obj.x + objW;
        const objTop = obj.y;
        const objBottom = obj.y + objH;

        // Check AABB Intersection
        const intersects = !(
            newRight < objLeft ||
            newLeft > objRight ||
            newBottom < objTop ||
            newTop > objBottom
        );

        if (intersects) {
            // Calculate top of this object
            const objBase = obj.elevation || 0;
            const objHeight = getObjectHeight3D(obj);
            const objTopZ = objBase + objHeight;

            if (objTopZ > maxElevation) {
                maxElevation = objTopZ;
            }
        }
    });

    return maxElevation;
};

// Helper: Determine 3D height of an object for stacking purposes
const getObjectHeight3D = (obj: APDObject): number => {
    // If it has an explicit 3D height (e.g. adjusted shed), use it
    if (obj.height3d) return obj.height3d;

    // Library Defaults (approximate to match models.tsx)
    const type = obj.type.toLowerCase();

    if (type.includes('container')) return 2.6; // Std container
    if (type.includes('bod') || type.includes('shed') || type.includes('kontor')) return 2.9; // Standard shed
    if (type === 'wc') return 2.5;
    if (type.includes('mock')) return 1.0;

    // Default for unknown "box" objects
    return 0; // Don't stack on flat things like zones if they got here
};

const isGroundObject = (obj: APDObject): boolean => {
    const type = obj.type.toLowerCase();
    return (
        type.startsWith('zone') ||
        type === 'schakt' ||
        type === 'walkway' ||
        type === 'construction-traffic' ||
        type === 'line' ||
        type === 'pen' ||
        type === 'polygon' ||
        type === 'fence' // Don't stack ON fences usually
    );
};
