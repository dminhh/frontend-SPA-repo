import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EndNodeType } from '../types';
import { NodeShell } from './NodeShell';

export function EndNode({ selected }: NodeProps<EndNodeType>) {
  return (
    <NodeShell title="End" accent="bg-slate-600" selected={selected}>
      <Handle type="target" position={Position.Top} />
    </NodeShell>
  );
}
