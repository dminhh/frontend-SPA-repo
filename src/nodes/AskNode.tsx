import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AskNodeType } from '../types';
import { ACCENTS } from './accents';
import { NodeShell } from './NodeShell';

export function AskNode({ data, selected }: NodeProps<AskNodeType>) {
  return (
    <NodeShell title="Ask" accent={ACCENTS.ask} selected={selected}>
      <Handle type="target" position={Position.Top} />
      <p className={data.question ? '' : 'text-slate-400 italic'}>
        {data.question || 'Chưa có câu hỏi'}
      </p>
      {data.variable && <p className="mt-1 font-mono text-xs text-slate-500">→ {data.variable}</p>}
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  );
}
