
import * as THREE from 'three';
import { APDObject } from '../types';

// This is the single source of truth for scaling between 2D and 3D worlds.
export const SCALE_FACTOR = 1 / 50;

/**
 * "The Golden Rule" Translator: Maps a 2D object's top-left corner coordinate to a 3D world position.
 * The center of the 2D background becomes the origin [0, 0, 0] in the 3D world.
 *
 * @param obj The APDObject with 2D coordinates.
 * @param bgWidth The width of the 2D background/canvas.
 * @param bgHeight The height of the 2D background/canvas.
 * @returns A THREE.Vector3 representing the position on the 3D ground plane.
 */
export const map2DPositionTo3D = (
    obj: Pick<APDObject, 'x' | 'y'>,
    bgWidth: number,
    bgHeight: number
): THREE.Vector3 => {
    const worldX = (obj.x - bgWidth / 2) * SCALE_FACTOR;
    // Note: 2D 'y' axis (downwards) maps to 3D 'z' axis (depth).
    const worldZ = (obj.y - bgHeight / 2) * SCALE_FACTOR;

    // 3D 'y' is height, so it starts at 0 on the ground.
    return new THREE.Vector3(worldX, 0, worldZ);
};

/**
 * Translates a 2D rotation (in degrees, around a Z-axis) to a 3D rotation
 * (in radians, around the Y-axis - a "spinning top" rotation).
 *
 * @param rotationDegrees The rotation from the 2D object.
 * @returns A THREE.Euler for use in a 3D object's rotation property.
 */
export const map2DRotationTo3D = (rotationDegrees: number = 0): THREE.Euler => {
    // We use a negative value because the coordinate systems' rotational directions are often inverted.
    const rotationRadians = -THREE.MathUtils.degToRad(rotationDegrees);
    // In our 3D world, "up" is the Y-axis.
    return new THREE.Euler(0, rotationRadians, 0);
};
