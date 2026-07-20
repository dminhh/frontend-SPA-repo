import type { Script } from '../build/compile';
import { evaluate } from './evaluate';

export type TranscriptEntry = { role: 'bot' | 'user' | 'system'; text: string };

export type RunStatus = 'awaiting_input' | 'done' | 'error';

export type RunState = {
  status: RunStatus;
  current: string | null; // the ask node the run is paused at, else null
  variables: Record<string, string>;
  transcript: TranscriptEntry[];
  pendingVariable?: string;
  error?: string;
};

const MAX_STEPS = 1000;

/** Starts a run at script.start and walks forward to the first stop. */
export function createRun(script: Script): RunState {
  return runForward(script.start, {}, [], script);
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
    script,
  );
}

function runForward(
  startAt: string | null,
  variables: Record<string, string>,
  priorTranscript: TranscriptEntry[],
  script: Script,
): RunState {
  const transcript = [...priorTranscript];
  let current = startAt;
  let steps = 0;

  while (current !== null) {
    if (steps++ >= MAX_STEPS) {
      transcript.push({
        role: 'system',
        text: 'Kịch bản chạy quá 1000 bước — có thể lặp vô hạn.',
      });
      return { status: 'error', current: null, variables, transcript, error: 'loop' };
    }

    const node = script.nodes[current];
    if (!node) {
      transcript.push({ role: 'system', text: `Không tìm thấy node "${current}".` });
      return { status: 'error', current: null, variables, transcript, error: 'missing-node' };
    }

    switch (node.type) {
      case 'start':
        current = node.next ?? null;
        break;
      case 'message':
        transcript.push({ role: 'bot', text: node.text });
        current = node.next ?? null;
        break;
      case 'ask':
        transcript.push({ role: 'bot', text: node.question });
        return {
          status: 'awaiting_input',
          current,
          variables,
          transcript,
          pendingVariable: node.variable,
        };
      case 'condition': {
        let result: boolean;
        try {
          result = evaluate(node.expression, variables);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          transcript.push({ role: 'system', text: `Lỗi điều kiện tại "${current}": ${msg}` });
          return { status: 'error', current: null, variables, transcript, error: msg };
        }
        current = (result ? node.onTrue : node.onFalse) ?? null;
        break;
      }
      case 'end':
        transcript.push({ role: 'system', text: 'Kết thúc.' });
        return { status: 'done', current: null, variables, transcript };
    }
  }

  // A non-end node without `next` ends the run; validation prevents this on the
  // canvas, but the runtime stays defensive.
  return { status: 'done', current: null, variables, transcript };
}
