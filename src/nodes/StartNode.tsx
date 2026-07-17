import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StartNodeType } from '../types';
import { ACCENTS } from './accents';
import { NodeShell } from './NodeShell';

export function StartNode({ selected }: NodeProps<StartNodeType>) {
  return (
    <>
      <NodeShell title="Start" accent={ACCENTS.start} selected={selected} />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
