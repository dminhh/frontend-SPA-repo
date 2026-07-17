import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ConditionNodeType } from '../types';
import { NodeShell } from './NodeShell';

export function ConditionNode({ data, selected }: NodeProps<ConditionNodeType>) {
  return (
    <NodeShell title="Condition" accent="bg-amber-600" selected={selected}>
      <Handle type="target" position={Position.Top} />
      <p className={data.expression ? 'font-mono text-xs' : 'text-slate-400 italic'}>
        {data.expression || 'Chưa có biểu thức'}
      </p>
      <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-500">
        <span>TRUE</span>
        <span>FALSE</span>
      </div>
      <Handle id="true" type="source" position={Position.Bottom} style={{ left: '25%' }} />
      <Handle id="false" type="source" position={Position.Bottom} style={{ left: '75%' }} />
    </NodeShell>
  );
}
