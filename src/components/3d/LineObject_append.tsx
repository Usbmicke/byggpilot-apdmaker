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
    // Pen lines are usually thin, but visible.
    const width = 0.5;

    return (
        <group position={[0, 0.15, 0]}>
            <Line
                points={points}
                color={color}
                lineWidth={width}
                worldUnits={true}
            />
        </group>
    );
};
