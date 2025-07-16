import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    EdgeProps,
  } from 'reactflow';
  
  const getEdgeColor = (edgeType?: string) => {
    switch (edgeType) {
      case 'pass':
        return 'green';
      case 'fail':
        return 'red';
      default:
        return '#222';
    }
  };
  
  const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
  }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  
    const edgeType = data?.edgeType;
  
    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{ stroke: getEdgeColor(edgeType), strokeWidth: 2 }}
        />
        {data?.label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                background: 'white',
                padding: 4,
                borderRadius: 4,
                fontSize: 12,
                border: '1px solid #ccc',
              }}
            >
              {data.label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  };
  
  export default CustomEdge;
  