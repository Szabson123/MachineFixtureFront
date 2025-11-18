import { BaseEdge, getBezierPath, EdgeProps } from 'reactflow';

export default function HiddenEdge(props: EdgeProps) {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });

  return (
    <BaseEdge
      {...props}
      path={path}
      style={{ stroke: 'transparent' }}
      markerEnd={undefined}
    />
  );
}
