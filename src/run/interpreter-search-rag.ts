import type { Script } from '../build/compile';
import type { RunState, SpanRecord } from './interpreter';
import { runForward } from './interpreter';

export function provideSearch(
  state: RunState,
  script: Script,
  result: { text: string; cost: number },
): RunState {
  if (state.status !== 'awaiting_search' || state.current === null || !state.pendingSearch)
    return state;
  const p = state.pendingSearch;
  const node = script.nodes[state.current];
  const nextId = 'next' in node ? (node.next ?? null) : null;
  const spans: SpanRecord[] = [
    ...state.spans,
    { kind: 'search', nodeId: p.nodeId, query: p.query, result: result.text, cost: result.cost },
  ];
  return runForward(
    nextId,
    { ...state.variables, [p.outputVar]: result.text },
    state.transcript,
    spans,
    script,
  );
}

export function provideRag(
  state: RunState,
  script: Script,
  result: { text: string; cost: number },
): RunState {
  if (state.status !== 'awaiting_rag' || state.current === null || !state.pendingRag) return state;
  const p = state.pendingRag;
  const node = script.nodes[state.current];
  const nextId = 'next' in node ? (node.next ?? null) : null;
  const spans: SpanRecord[] = [
    ...state.spans,
    { kind: 'rag', nodeId: p.nodeId, query: p.query, result: result.text, cost: result.cost },
  ];
  return runForward(
    nextId,
    { ...state.variables, [p.outputVar]: result.text },
    state.transcript,
    spans,
    script,
  );
}
