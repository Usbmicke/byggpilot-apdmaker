
export const isPointInCircle = (point: { x: number, y: number }, circleCenter: { x: number, y: number }, radius: number): boolean => {
    const dx = point.x - circleCenter.x;
    const dy = point.y - circleCenter.y;
    return dx * dx + dy * dy <= radius * radius;
};

interface RotatedRect {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

export const isPointInRotatedRect = (point: { x: number, y: number }, rect: RotatedRect): boolean => {
    const { x: cx, y: cy, width, height, rotation } = rect;

    // Convert rotation to radians
    const angle = rotation * (Math.PI / 180);
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);

    // Translate point to origin
    const dx = point.x - cx;
    const dy = point.y - cy;

    // Rotate point
    const xRot = dx * cos - dy * sin;
    const yRot = dx * sin + dy * cos;

    // Check if rotated point is within the unrotated rectangle
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return xRot > -halfWidth && xRot < halfWidth && yRot > -halfHeight && yRot < halfHeight;
};
