import React, { useEffect, useState } from 'react';
import ReactFlow, {
  Edge,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import './ProductProcesses.css';
import { useParams } from 'react-router-dom';
import { GreenSquareNode, OrangeSquareNode, RedSquareNode, BlueSquareNode } from '../ProcessNewGen/NodesComp';
import { useNavigate } from 'react-router-dom';
import HiddenEdge from './HiddenEdge';

const nodeTypes = {
  normal: GreenSquareNode,
  condition: OrangeSquareNode,
  end: RedSquareNode,
  add_receive: BlueSquareNode
};

const typeMap: Record<string, string> = {
  normal: 'normal',
  condition: 'condition',
  end: 'end',
  add_receive: 'add_receive',
};

const edgeTypes = {
  hidden: HiddenEdge
};

function transformGraphData(apiData: any) {
  const nodes = apiData.nodes.map((node: any) => ({
    id: node.id,
    type: typeMap[node.type] || 'default',
    position: { x: node.pos_x, y: node.pos_y },
    data: {
      label: node.label,
      full: node,
    },
    draggable: false
  }));

const edges = apiData.edges.map((edge: any) => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.source_handle,
  targetHandle: edge.target_handle,
  type: edge.type || 'default',
  animated: edge.animated || false,
  label: edge.label || '',
  markerEnd: { type: 'arrowclosed' },
  style: edge.animated ? { stroke: 'red' } : undefined
}));

  return { nodes, edges };
}

const FlowProcess: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [productName, setProductName] = useState<string>('');
  const navigate = useNavigate();

  const handleNodeClick = (_: any, node: Node) => {
  const fullNode = node.data?.full;

  if (fullNode) {
    localStorage.setItem(
      "selectedProcess",
      JSON.stringify({
        id: fullNode.id,
        name: fullNode.label,
        type: fullNode.type,
        settings: {
          defaults: fullNode.defaults,
          starts: fullNode.starts,
          endings: fullNode.endings,
          fields: fullNode.fields || null,
          autoCheck: fullNode.autoCheck ?? false,
        },
      })
    );
  }

  navigate(`/process/${productId}/process-action`);
};

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/process/${productId}/graph-import/`);
      const data = await response.json();

      setProductName(data.name);

      const { nodes, edges } = transformGraphData(data);
      setNodes(nodes);
      setEdges(edges);

      const removeAttribution = () => {
        const attr = document.querySelector('.react-flow__attribution');
        if (attr) {
          attr.remove();
        }
      };
  
      removeAttribution();
      const observer = new MutationObserver(removeAttribution);
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    };
  
    fetchData();
  }, [productId]);

  return (
    <div className="flow-wrapper">
      <h2 className="flow-title">
        Procesy Produktu: {productName}
      </h2>
      <button onClick={() => navigate(`/process/`)} className="back-button-nopos">
            &larr; Powrót
        </button>
  
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnDrag
        selectionOnDrag
        onNodeClick={handleNodeClick}
      >
      </ReactFlow>
    </div>
  );
};

export default FlowProcess