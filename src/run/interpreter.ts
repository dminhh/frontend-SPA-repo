import type { Script } from '../build/compile';
import { evaluate } from './evaluate';
import { interpolate } from './interpolate';
import type { TranscriptEntry, SpanRecord, RunState } from './interpreterTypes';
import type { LlmResult, SearchResult, RagResult } from './interpreterTypes';
export type { TranscriptEntry, RunStatus, SpanRecord, PendingLlm } from './interpreterTypes';
export type { PendingSearch, PendingRag, RunState } from './interpreterTypes';
export function createRun(script: Script): RunState {
  return runForward(script.start, {}, [], [], script);
}
export function advance(state: RunState, script: Script, input: string): RunState {
  if (state.status !== 'awaiting_input' || state.current === null) return state;
  const askNode = script.nodes[state.current];
  const variable = state.pendingVariable ?? '';
  const nextId = 'next' in askNode ? (askNode.next ?? null) : null;
  return runForward(
    nextId,
    { ...state.variables, [variable]: input },
    [...state.transcript, { role: 'user', text: input }],
    state.spans,
    script,
  );
}
export function provideLlm(state: RunState, script: Script, result: LlmResult): RunState {
  if (state.status !== 'awaiting_llm' || state.current === null || !state.pendingLlm) return state;
  const p = state.pendingLlm;
  const node = script.nodes[state.current];
  const nextId = 'next' in node ? (node.next ?? null) : null;
  const spans: SpanRecord[] = [
    ...state.spans,
    {
      kind: 'llm',
      nodeId: p.nodeId,
      model: p.model,
      prompt: p.prompt,
      response: result.text,
      tokens: result.tokens,
      cost: result.cost,
    },
  ];
  return runForward(
    nextId,
    { ...state.variables, [p.outputVar]: result.text },
    [...state.transcript, { role: 'bot', text: result.text }],
    spans,
    script,
  );
}
export function provideSearch(state: RunState, script: Script, result: SearchResult): RunState {
  if (state.status !== 'awaiting_search' || state.current === null || !state.pendingSearch)
    return state;
  const p = state.pendingSearch;
  const node = script.nodes[state.current];
  const nextId = 'next' in node ? (node.next ?? null) : null;
  const searchSpan: SpanRecord = {
    kind: 'search',
    nodeId: p.nodeId,
    query: p.query,
    result: result.text,
    tokens: result.tokens,
    cost: result.cost,
  };
  const spans: SpanRecord[] = [...state.spans, searchSpan];
  return runForward(
    nextId,
    { ...state.variables, [p.outputVar]: result.text },
    state.transcript,
    spans,
    script,
  );
}
export function provideRag(state: RunState, script: Script, result: RagResult): RunState {
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
function runForward(
  startAt: string | null,
  variables: Record<string, string>,
  priorTranscript: TranscriptEntry[],
  priorSpans: SpanRecord[],
  script: Script,
): RunState {
  const transcript = [...priorTranscript];
  const spans = [...priorSpans];
  let current = startAt;
  let steps = 0;
  while (current !== null) {
    if (steps++ >= 1000) {
      transcript.push({ role: 'system', text: 'Kịch bản chạy quá 1000 bước — có thể lặp vô hạn.' });
      return { status: 'error', current: null, variables, transcript, spans, error: 'loop' };
    }
    const node = script.nodes[current];
    if (!node) {
      transcript.push({ role: 'system', text: `Không tìm thấy node "${current}".` });
      return {
        status: 'error',
        current: null,
        variables,
        transcript,
        spans,
        error: 'missing-node',
      };
    }
    switch (node.type) {
      case 'start':
        spans.push({ kind: 'node', nodeId: current, type: node.type });
        current = node.next ?? null;
        break;
      case 'message': {
        spans.push({ kind: 'node', nodeId: current, type: node.type });
        const messageText = interpolate(node.text, variables);
        transcript.push({ role: 'bot', text: messageText });
        current = node.next ?? null;
        break;
      }
      case 'ask':
        spans.push({ kind: 'node', nodeId: current, type: node.type });
        transcript.push({ role: 'bot', text: node.question });
        return {
          status: 'awaiting_input',
          current,
          variables,
          transcript,
          spans,
          pendingVariable: node.variable,
        };
      case 'llm': {
        const prompt = interpolate(node.prompt, variables);
        return {
          status: 'awaiting_llm',
          current,
          variables,
          transcript,
          spans,
          pendingLlm: {
            nodeId: current,
            model: node.model,
            system: node.systemPrompt,
            prompt,
            outputVar: node.outputVar,
          },
        };
      }
      case 'search': {
        const query = interpolate(node.query, variables);
        return {
          status: 'awaiting_search',
          current,
          variables,
          transcript,
          spans,
          pendingSearch: { nodeId: current, query, outputVar: node.outputVar },
        };
      }
      case 'rag': {
        const query = interpolate(node.query, variables);
        const document = interpolate(node.document, variables);
        return {
          status: 'awaiting_rag',
          current,
          variables,
          transcript,
          spans,
          pendingRag: { nodeId: current, query, document, outputVar: node.outputVar },
        };
      }
      case 'condition': {
        spans.push({ kind: 'node', nodeId: current, type: node.type });
        let result: boolean;
        try {
          result = evaluate(node.expression, variables);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          transcript.push({ role: 'system', text: `Lỗi điều kiện tại "${current}": ${msg}` });
          return { status: 'error', current: null, variables, transcript, spans, error: msg };
        }
        current = (result ? node.onTrue : node.onFalse) ?? null;
        break;
      }
      case 'end':
        spans.push({ kind: 'node', nodeId: current, type: node.type });
        transcript.push({ role: 'system', text: 'Kết thúc.' });
        return { status: 'done', current: null, variables, transcript, spans };
    }
  }
  return { status: 'done', current: null, variables, transcript, spans };
}
