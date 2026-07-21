import type { Script } from '../build/compile';
import { evaluate } from './evaluate';
import { interpolate } from './interpolate';

export type TranscriptEntry = { role: 'bot' | 'user' | 'system'; text: string };

export type RunStatus = 'awaiting_input' | 'awaiting_llm' | 'done' | 'error';

export type SpanRecord =
  | { kind: 'node'; nodeId: string; type: string; input?: string; output?: string }
  | {
      kind: 'llm';
      nodeId: string;
      model: string;
      prompt: string;
      response: string;
      tokens: { input: number; output: number };
      cost: number;
    };

export type PendingLlm = {
  nodeId: string;
  model: string;
  system: string;
  prompt: string;
  outputVar: string;
};

export type RunState = {
  status: RunStatus;
  current: string | null; // the ask/llm node the run is paused at, else null
  variables: Record<string, string>;
  transcript: TranscriptEntry[];
  spans: SpanRecord[];
  pendingVariable?: string;
  pendingLlm?: PendingLlm;
  error?: string;
};

const MAX_STEPS = 1000;

/** Starts a run at script.start and walks forward to the first stop. */
export function createRun(script: Script): RunState {
  return runForward(script.start, {}, [], [], script);
}

/** Records the answer to the paused ask node, then walks forward again. A
 *  done/error state is returned unchanged. */
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

/** Records the LLM response for the paused llm node, then walks forward again.
 *  A state not awaiting_llm is returned unchanged. */
export function provideLlm(
  state: RunState,
  script: Script,
  result: { text: string; tokens: { input: number; output: number }; cost: number },
): RunState {
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
    if (steps++ >= MAX_STEPS) {
      transcript.push({
        role: 'system',
        text: 'Kịch bản chạy quá 1000 bước — có thể lặp vô hạn.',
      });
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
      case 'message':
        spans.push({ kind: 'node', nodeId: current, type: node.type });
        transcript.push({ role: 'bot', text: node.text });
        current = node.next ?? null;
        break;
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

  // A non-end node without `next` ends the run; validation prevents this on the
  // canvas, but the runtime stays defensive.
  return { status: 'done', current: null, variables, transcript, spans };
}
