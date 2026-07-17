import { useCallback, useRef, useState } from 'react';
import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
} from '@xyflow/react';
import { NODE_DEFS, nodeTypes } from './nodes';
import { NodePalette } from './panels/NodePalette';
import { Inspector } from './panels/Inspector';
import { BuildPanel } from './panels/BuildPanel';
import { createSampleFlow } from './sample';
import type { BotNode, BotNodeType } from './types';

function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<BotNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  // Node state lives in useNodesState. Only take view helpers from useReactFlow —
  // its setNodes writes to the internal store and would be overwritten by the
  // `nodes` prop on the next render.
  const { screenToFlowPosition, fitView } = useReactFlow<BotNode, Edge>();
  const nextId = useRef(1);
  // Bumped on every sample load and used as BuildPanel's key, which remounts it
  // and drops a Build result that describes a graph no longer on the canvas.
  const [sampleLoads, setSampleLoads] = useState(0);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/bot-node-type') as BotNodeType;
      const def = NODE_DEFS.find((d) => d.type === type);
      if (!def) return;

      const node = {
        id: `n${nextId.current++}`,
        type: def.type,
        data: { ...def.defaultData },
        position: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      } as BotNode;

      setNodes((nds) => [...nds, node]);
    },
    [screenToFlowPosition, setNodes],
  );

  const selected = nodes.find((n) => n.selected);

  const onFieldChange = useCallback(
    (id: string, patch: Record<string, string>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as BotNode) : n)),
      );
    },
    [setNodes],
  );

  const onLoadSample = useCallback(() => {
    const { nodes: sampleNodes, edges: sampleEdges } = createSampleFlow();
    setNodes(sampleNodes);
    setEdges(sampleEdges);
    // The sample occupies n1..nN. Resume the counter past them, or the next drop
    // takes an id the sample already uses.
    nextId.current = sampleNodes.length + 1;
    setSampleLoads((n) => n + 1);
    void fitView({ duration: 400, maxZoom: 1 });
  }, [setNodes, setEdges, fitView]);

  const onFocusNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
      void fitView({ nodes: [{ id }], duration: 400, maxZoom: 1.2 });
    },
    [setNodes, fitView],
  );

  return (
    <div className="flex h-full">
      <NodePalette onLoadSample={onLoadSample} />
      <div
        className="h-full flex-1"
        onDrop={onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
        <Inspector node={selected} onChange={onFieldChange} />
        <BuildPanel key={sampleLoads} nodes={nodes} edges={edges} onFocusNode={onFocusNode} />
      </aside>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
