import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { MessageNodeType } from '../types';
import { NodeShell } from './NodeShell';

export function MessageNode({ data, selected }: NodeProps<MessageNodeType>) {
  return (
    <NodeShell title="Message" accent="bg-sky-600" selected={selected}>
      <Handle type="target" position={Position.Top} />
      <p className={data.text ? '' : 'text-slate-400 italic'}>{data.text || 'Chưa có nội dung'}</p>
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  );
}
