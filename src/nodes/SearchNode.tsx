import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { SearchNodeType } from '../types';
import { NodeShell } from './NodeShell';
import { ACCENTS } from './accents';

export function SearchNode({ data, selected }: NodeProps<SearchNodeType>) {
  return (
    <NodeShell title="Search" accent={ACCENTS.search} selected={selected}>
      <Handle type="target" position={Position.Top} />
      <p className={data.query ? '' : 'text-slate-400 italic'}>
        {data.query || 'Chưa có câu truy vấn'}
      </p>
      {data.outputVar && (
        <p className="mt-1 font-mono text-xs text-slate-500">→ {data.outputVar}</p>
      )}
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  );
}
