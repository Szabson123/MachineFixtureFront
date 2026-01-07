import { useState } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import '../../components/ProcessNewGen/NodesStyles.css';

function EditableLabel({ data, nodeId }: { data: any; nodeId: string }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const updateNodeInternals = useUpdateNodeInternals();

  const handleDoubleClick = () => setEditing(true);
  const handleBlur = () => {
    setEditing(false);
    data.label = label;
    updateNodeInternals(nodeId);
  };

  return editing ? (
    <input
      className="node-input"
      value={label}
      onChange={e => setLabel(e.target.value)}
      onBlur={handleBlur}
      autoFocus
    />
  ) : (
    <span onDoubleClick={handleDoubleClick} title="Kliknij dwukrotnie, by edytować">
      {label}
    </span>
  );
}

export function GreenSquareNode({ data, id }: NodeProps) {
  return (
    <div className="node green">
      <Handle type="target" position={Position.Left} className="handle-input" />
      <EditableLabel data={data} nodeId={id} />
      <Handle type="source" position={Position.Right} className="handle-output" />

      <Handle type="target" position={Position.Bottom} className="handle-input" id="bottom-in" />
      <Handle type="source" position={Position.Bottom} className="handle-input" id="bottom-out" />
    </div>
  );
}

export function RedSquareNode({ data, id }: NodeProps) {
  return (
    <div className="node red">
      <Handle type="target" position={Position.Left} className="handle-output-red " />
      <EditableLabel data={data} nodeId={id} />
      <Handle type="source" position={Position.Right} className="handle-output-red" />
    </div>
  );
}

export function OrangeSquareNode({ data, id }: NodeProps) {
  return (
    <div className="node orange">
      <Handle type="target" position={Position.Left} className="handle-input-orange" />

      <EditableLabel data={data} nodeId={id} />
      <Handle type="source" position={Position.Right} className="handle-output-orange" />

      <Handle type="target" position={Position.Bottom} className="handle-input-orange" id="bottom-in" />
      <Handle type="source" position={Position.Bottom} className="handle-input-orange" id="bottom-out" />

    </div>
  );
}

export function BlueSquareNode({ data, id }: NodeProps) {
  return (
    <div className="node blue">
      <Handle type="target" position={Position.Left} className="handle-output-blue " />
      <EditableLabel data={data} nodeId={id} />
      <Handle type="source" position={Position.Right} className="handle-output-blue" />
    </div>
  );
}

