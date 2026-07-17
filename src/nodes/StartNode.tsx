import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StartNodeType } from '../types';
import { NodeShell } from './NodeShell';

export function StartNode({ selected }: NodeProps<StartNodeType>) {
  return (
    <NodeShell title="Start" accent="bg-emerald-600" selected={selected}>
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  );
}
