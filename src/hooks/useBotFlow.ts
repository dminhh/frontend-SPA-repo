import { useCallback, useRef, useState } from 'react';
import {
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
} from '@xyflow/react';
import { NODE_DEFS } from '../nodes';
import { createSampleFlow } from '../sample';
import type { BotNode, BotNodeType } from '../types';

/**
 * Owns the flow graph: the nodes/edges state and every action that changes it.
 * `App` consumes this and only lays out the three columns, so the two concerns
 * — graph management and presentation — stay separable.
 */
export function useBotFlow() {
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

  const onDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      // Drop every edge touching the node — as its source or its target — or the
      // graph keeps dangling edges that point at an id no longer present.
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges],
  );

  const onFocusNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
      void fitView({ nodes: [{ id }], duration: 400, maxZoom: 1.2 });
    },
    [setNodes, fitView],
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDrop,
    onFieldChange,
    onLoadSample,
    onFocusNode,
    onDeleteNode,
    selected: nodes.find((n) => n.selected),
    buildPanelKey: sampleLoads,
  };
}
