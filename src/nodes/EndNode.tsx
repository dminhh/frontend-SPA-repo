import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EndNodeType } from '../types';
import { ACCENTS } from './accents';
import { NodeShell } from './NodeShell';

export function EndNode({ selected }: NodeProps<EndNodeType>) {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell title="End" accent={ACCENTS.end} selected={selected} />
    </>
  );
}
