import { useState } from 'react';
import type { Edge } from '@xyflow/react';
import { BaseButton } from '../components/base/BaseButton';
import { compile } from '../build/compile';
import { validate, type Issue } from '../build/validate';
import type { BotNode } from '../types';

const COPY_LABELS: Record<CopyState, string> = {
  idle: 'Copy',
  success: 'Đã copy',
  failed: 'Không copy được',
};

type Props = {
  nodes: BotNode[];
  edges: Edge[];
  onFocusNode: (id: string) => void;
};

type Result = { kind: 'json'; text: string } | { kind: 'issues'; issues: Issue[] };
type CopyState = 'idle' | 'success' | 'failed';

export function BuildPanel({ nodes, edges, onFocusNode }: Props) {
  const [result, setResult] = useState<Result | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  function onBuild() {
    setCopyState('idle');
    const issues = validate(nodes, edges);
    setResult(
      issues.length > 0
        ? { kind: 'issues', issues }
        : { kind: 'json', text: JSON.stringify(compile(nodes, edges), null, 2) },
    );
  }

  async function onCopy() {
    if (result?.kind !== 'json') return;
    try {
      if (!navigator.clipboard) {
        setCopyState('failed');
        return;
      }
      await navigator.clipboard.writeText(result.text);
      setCopyState('success');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <BaseButton label="Build" onClick={onBuild} />
        {result?.kind === 'json' && (
          <BaseButton label={COPY_LABELS[copyState]} variant="secondary" onClick={onCopy} />
        )}
      </div>

      {result?.kind === 'issues' && (
        <ul className="min-h-0 flex-1 space-y-1 overflow-auto">
          {result.issues.map((issue, i) => (
            <li key={i}>
              <button
                disabled={!issue.nodeId}
                onClick={() => issue.nodeId && onFocusNode(issue.nodeId)}
                className="w-full rounded border border-red-200 bg-red-50 px-2 py-1.5 text-left text-sm text-red-700 enabled:hover:bg-red-100"
              >
                {issue.message}
              </button>
            </li>
          ))}
        </ul>
      )}

      {result?.kind === 'json' && (
        <pre className="min-h-0 flex-1 overflow-auto rounded bg-slate-900 p-3 font-mono text-xs text-slate-100">
          {result.text}
        </pre>
      )}
    </div>
  );
}
