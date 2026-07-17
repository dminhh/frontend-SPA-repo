import { useCallback, useRef } from 'react';
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
import type { BotNode, BotNodeType } from './types';

function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<BotNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  // Node state lives in useNodesState. Only take view helpers from useReactFlow —
  // its setNodes writes to the internal store and would be overwritten by the
  // `nodes` prop on the next render.
  const { screenToFlowPosition } = useReactFlow<BotNode, Edge>();
  const nextId = useRef(1);

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

  return (
    <div className="flex h-full">
      <NodePalette />
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
