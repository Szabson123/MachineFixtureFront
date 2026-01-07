import { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  Connection,
  OnSelectionChangeParams,
  MarkerType
} from 'reactflow';

import 'reactflow/dist/style.css';
import { GreenSquareNode, RedSquareNode, OrangeSquareNode, BlueSquareNode } from './NodesComp';

const initialNodes: Node[] = [
  {
    id: 'f78d47ca-cecd-462c-af76-036178800b0b',
    type: 'and_receive',
    position: { x: 100, y: 300 },
    data: { label: 'Szafa' }
  },
  {
    id: '2c175313-cbd5-4df3-9f26-70bb32eb2c67',
    type: 'condition',
    position: { x: 300, y: 300 },
    data: { label: 'Kontrola' }
  },
  {
    id: 'fc94edf9-1651-43e0-8684-744fe16b41c3',
    type: 'normal',
    position: { x: 500, y: 250 },
    data: { label: 'Naprawa' }
  },
  {
    id: '9601dd70-976a-4d43-afc1-74375b7145aa',
    type: 'end',
    position: { x: 700, y: 250 },
    data: { label: 'Śmietnik' }
  },
  {
    id: '7d885af5-264f-4f5e-9f7f-180bb6ad0337',
    type: 'normal',
    position: { x: 500, y: 350 },
    data: { label: 'Linia' }
  },
  {
    id: '43fe9272-629e-4b1f-8a76-26116862011c',
    type: 'normal',
    position: { x: 700, y: 350 },
    data: { label: 'Myjka' }
  }
];
const initialEdges: Edge[] = [
  {
    id: 'e5da14fd-0472-48d7-adb8-117f916b9912',
    source: 'f78d47ca-cecd-462c-af76-036178800b0b',
    target: '2c175313-cbd5-4df3-9f26-70bb32eb2c67',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: '86ee3d57-d098-4ec9-87ad-2bfe3b36689b',
    source: '2c175313-cbd5-4df3-9f26-70bb32eb2c67',
    target: 'fc94edf9-1651-43e0-8684-744fe16b41c3',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: '360af823-1961-4979-a89d-1bf9c8af50a9',
    source: 'fc94edf9-1651-43e0-8684-744fe16b41c3',
    target: '9601dd70-976a-4d43-afc1-74375b7145aa',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'af329b15-d599-496c-bf5b-7d6576e57af2',
    source: '2c175313-cbd5-4df3-9f26-70bb32eb2c67',
    target: '7d885af5-264f-4f5e-9f7f-180bb6ad0337',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e3d0a3fd-a239-4acf-a4b7-ff5b1c135c53',
    source: '7d885af5-264f-4f5e-9f7f-180bb6ad0337',
    target: '43fe9272-629e-4b1f-8a76-26116862011c',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'b44bd74d-9b54-4c09-8da1-773380ac4518',
    source: 'fc94edf9-1651-43e0-8684-744fe16b41c3',
    target: 'f78d47ca-cecd-462c-af76-036178800b0b',
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'red' },
    markerEnd: { type: MarkerType.ArrowClosed }
  }
];


export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

  const nodeTypes = useMemo(() => ({
    normal: GreenSquareNode,
    end: RedSquareNode,
    condition: OrangeSquareNode,
    and_receive: BlueSquareNode,
  }), []);

  const onNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges>[0]) =>
      setNodes((n) => applyNodeChanges(changes, n)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges>[0]) =>
      setEdges((e) => applyEdgeChanges(changes, e)),
    []
  );

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const newEdge: Edge = {
      id: crypto.randomUUID(),
      source: connection.source as string,
      target: connection.target as string,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed }
    };

    setEdges((prev) => [...prev, newEdge]);
  }, []);

  const handleAddGreenNode = () => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'normal',
      position: {
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 50
      },
      data: { label: 'Nowy zielony' }
    };

    setNodes((prev) => [...prev, newNode]);
  };

  const handleAddRedNode = () => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'end',
      position: {
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 50
      },
      data: { label: 'Nowy czerwony' }
    };

    setNodes((prev) => [...prev, newNode]);
  };

  const handleAddOrangeNode = () => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'condition',
      position: {
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 50
      },
      data: { label: 'Nowy Pomarańczowy' }
    };

    setNodes((prev) => [...prev, newNode]);
  };

  const handleAddBlueNode = () => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'and_receive',
      position: {
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 50
      },
      data: { label: 'Nowy Niebieski' }
    };

    setNodes((prev) => [...prev, newNode]);
  };

  const handleDumpToJson = () => {
    const graphData = {
      nodes,
      edges,
    };
    console.log(JSON.stringify(graphData, null, 2));
    alert('Dane zostały zapisane do konsoli!');
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        setNodes(prev => prev.filter(n => !selectedNodes.some(s => s.id === n.id)));
        setEdges(prev => prev.filter(e => !selectedEdges.some(s => s.id === e.id)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, selectedEdges]);

  const handleSelectionChange = ({ nodes, edges }: OnSelectionChangeParams) => {
    setSelectedNodes(nodes || []);
    setSelectedEdges(edges || []);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', background: '#f0f0f0' }}>
        <button onClick={handleAddGreenNode}>➕ Dodaj zielony node</button>
        <button onClick={handleAddRedNode} style={{ marginLeft: 10 }}>➕ Dodaj czerwony node</button>
        <button onClick={handleAddOrangeNode} style={{ marginLeft: 10 }}>➕ Dodaj pomarańczowy node</button>
        <button onClick={handleAddBlueNode} style={{ marginLeft: 10 }}>➕ Dodaj niebieski node</button>
        <button onClick={handleDumpToJson} style={{ marginLeft: 10 }}>Dump JSON</button>
      </div>
      <div style={{ padding: '15px 0', background: '#ffffff', textAlign: 'center' }}>
  </div>
  <div
    style={{
      padding: '15px 0',
      background: '#ffffff',
      textAlign: 'center',
      borderBottom: '1px solid #ccc',
      fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      fontSize: '26px',
      fontWeight: 600,
      color: '#333',
      letterSpacing: '0.5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    }}
  >
    Przebieg procesu Sito
  </div>

      <div style={{ flexGrow: 1 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag={[2]}
        selectionOnDrag={true}
        snapToGrid={true}
        snapGrid={[1, 1]}
      >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
