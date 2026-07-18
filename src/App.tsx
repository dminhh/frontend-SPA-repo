import { Background, Controls, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import { nodeTypes } from './nodes';
import { NodePalette } from './panels/NodePalette';
import { Inspector } from './panels/Inspector';
import { BuildPanel } from './panels/BuildPanel';
import { useBotFlow } from './hooks/useBotFlow';

function Canvas() {
  const flow = useBotFlow();

  return (
    <div className="flex h-full">
      <NodePalette onLoadSample={flow.onLoadSample} />
      <div
        className="h-full flex-1"
        onDrop={flow.onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
      >
        <ReactFlow
          nodes={flow.nodes}
          edges={flow.edges}
          nodeTypes={nodeTypes}
          onNodesChange={flow.onNodesChange}
          onEdgesChange={flow.onEdgesChange}
          onConnect={flow.onConnect}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
        <Inspector node={flow.selected} onChange={flow.onFieldChange} />
        <BuildPanel
          key={flow.buildPanelKey}
          nodes={flow.nodes}
          edges={flow.edges}
          onFocusNode={flow.onFocusNode}
        />
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
