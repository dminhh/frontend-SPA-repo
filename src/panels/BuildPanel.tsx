import { useState } from 'react';
import type { Edge } from '@xyflow/react';
import { compile } from '../build/compile';
import { validate, type Issue } from '../build/validate';
import type { BotNode } from '../types';

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
        <button
          onClick={onBuild}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Build
        </button>
        {result?.kind === 'json' && (
          <button
            onClick={onCopy}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            {copyState === 'success' ? 'Đã copy' : copyState === 'failed' ? 'Không copy được' : 'Copy'}
          </button>
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
