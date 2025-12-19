
import * as THREE from 'three';

/**
 * The scale factor to convert 2D screen pixels to 3D world units.
 * This is a crucial value for maintaining a 1:1 scale between the 2D canvas and the 3D scene.
 */
export const SCALE_FACTOR = 1 / 10;

/**
 * Converts 2D canvas coordinates (x, y) to 3D world coordinates (x, y, z).
 * The 2D y-coordinate is mapped to the 3D z-coordinate, and the z-coordinate is negated
 * to align the 2D canvas (where Y is down) with the 3D coordinate system (where +Z is forward).
 *
 * @param x The x-coordinate on the 2D canvas.
 * @param y The y-coordinate on the 2D canvas.
 * @param background The dimensions of the 2D background image.
 * @returns A THREE.Vector3 representing the 3D world coordinates.
 */
export const toWorldCoords = (x: number, y: number, background: { width: number, height: number }): THREE.Vector3 => {
    const worldX = (x - background.width / 2) * SCALE_FACTOR;
    const worldZ = -(y - background.height / 2) * SCALE_FACTOR; // STABLE FIX: Negated Z for correct orientation
    return new THREE.Vector3(worldX, 0, worldZ);
};

/**
 * Converts 3D world coordinates (x, y, z) back to 2D canvas coordinates (x, y).
 * This is the inverse of the toWorldCoords function.
 *
 * @param obj3d The 3D object to convert.
 * @param background The dimensions of the 2D background image.
 * @returns A partial APDObject with the updated 2D coordinates and rotation.
 */
export const get2DAttributesFrom3D = (obj3d: THREE.Object3D, background: { width: number, height: number }): Partial<any> => {
    const newX = (obj3d.position.x / SCALE_FACTOR) + (background.width / 2);
    const newY = (-obj3d.position.z / SCALE_FACTOR) + (background.height / 2); // STABLE FIX: Negated Z for correct orientation
    const rotation = -THREE.MathUtils.radToDeg(obj3d.rotation.y);

    return { x: newX, y: newY, rotation };
};
