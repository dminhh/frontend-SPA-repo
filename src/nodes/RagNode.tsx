import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { RagNodeType } from '../types';
import { NodeShell } from './NodeShell';
import { ACCENTS } from './accents';

export function RagNode({ data, selected }: NodeProps<RagNodeType>) {
  return (
    <NodeShell title="RAG" accent={ACCENTS.rag} selected={selected}>
      <Handle type="target" position={Position.Top} />
      <p className={data.query ? '' : 'text-slate-400 italic'}>
        {data.query || 'Chưa có câu truy vấn'}
      </p>
      <p className="mt-1 truncate text-xs text-slate-400">
        {data.document ? `Tài liệu: ${data.document.length} ký tự` : 'Chưa có tài liệu'}
      </p>
      {data.outputVar && (
        <p className="mt-1 font-mono text-xs text-slate-500">→ {data.outputVar}</p>
      )}
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  );
}
