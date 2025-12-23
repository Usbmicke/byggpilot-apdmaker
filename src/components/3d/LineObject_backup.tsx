export const LineObject = ({ obj, item, scale }: { obj: APDObject, item?: LibraryItem, scale: number }) => {
    const points = useMemo(() => {
        if (!obj.points || obj.points.length < 2) return [];
        const result = [];
        for (let i = 0; i < obj.points.length; i += 2) {
            const localX = (obj.points[i]) * scale;
            const localZ = (obj.points[i + 1]) * scale;
            result.push(new THREE.Vector3(localX, 0.05, localZ));
        }
        return result;
    }, [obj.points, obj.x, obj.y]);

    const color = obj.stroke || obj.item?.stroke || '#000000';
    const width = (obj.strokeWidth || 2) * 0.1; // Scale up stroke width for 3D visibility (world units)

    return (
        <group position={[0, 0.1, 0]}>
            <Line
                points={points}
                color={color}
                lineWidth={width}
                worldUnits={true}
            />
        </group>
    );
};
