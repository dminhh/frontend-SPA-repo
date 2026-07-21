import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { LlmNodeType } from '../types';
import { NodeShell } from './NodeShell';
import { ACCENTS } from './accents';

export function LlmNode({ data, selected }: NodeProps<LlmNodeType>) {
  return (
    <NodeShell title="LLM" accent={ACCENTS.llm} selected={selected}>
      <Handle type="target" position={Position.Top} />
      <p className="font-mono text-xs text-slate-500">{data.model || 'gpt-5.4-nano'}</p>
      <p className={data.prompt ? '' : 'text-slate-400 italic'}>
        {data.prompt || 'Chưa có prompt'}
      </p>
      {data.outputVar && (
        <p className="mt-1 font-mono text-xs text-slate-500">→ {data.outputVar}</p>
      )}
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  );
}
