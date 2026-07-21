import { useEffect, useRef, useState } from 'react';
import type { Script } from '../build/compile';
import { BaseButton } from '../components/base/BaseButton';
import { BaseModal } from '../components/base/BaseModal';
import {
  advance,
  createRun,
  provideLlm,
  type PendingLlm,
  type RunState,
  type TranscriptEntry,
} from './interpreter';

type Props = {
  script: Script;
  onClose: () => void;
};

type LlmResult = { text: string; tokens: { input: number; output: number }; cost: number };

/** Calls the backend's /api/llm route. The app is served from the same origin as
 *  the backend (both on Vercel), so a relative path is enough — no base URL to
 *  configure. Throws on network error or a non-ok status. */
async function callLlm(pending: PendingLlm): Promise<LlmResult> {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: pending.model, system: pending.system, prompt: pending.prompt }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as LlmResult;
}

export function RunModal({ script, onClose }: Props) {
  const [state, setState] = useState<RunState>(() => createRun(script));
  const [input, setInput] = useState('');
  const [traceSent, setTraceSent] = useState(false);
  const llmRequestedFor = useRef<number | null>(null);
  const traceSentFor = useRef(false);

  function submit() {
    if (state.status !== 'awaiting_input') return;
    setState(advance(state, script, input));
    setInput('');
  }

  function restart() {
    llmRequestedFor.current = null;
    traceSentFor.current = false;
    setTraceSent(false);
    setState(createRun(script));
  }

  // Runs the pending LLM node against the backend once per pause. Guards on
  // spans.length rather than nodeId: a flow can loop back through the same llm
  // node (llm → condition → llm), and each pass adds spans, so spans.length
  // uniquely identifies this particular pause even when the node id repeats —
  // a nodeId-only guard would silently stop firing on the second visit and
  // leave the modal stuck on "Đang gọi LLM…" forever.
  useEffect(() => {
    if (state.status !== 'awaiting_llm' || !state.pendingLlm) return;
    const pending = state.pendingLlm;
    if (llmRequestedFor.current === state.spans.length) return;
    llmRequestedFor.current = state.spans.length;

    callLlm(pending)
      .then((result) => {
        setState((prev) => {
          const next = provideLlm(prev, script, result);
          const hint: TranscriptEntry = {
            role: 'system',
            text: `~${result.tokens.input + result.tokens.output} token, ~$${result.cost.toFixed(5)}`,
          };
          return { ...next, transcript: [...next.transcript, hint] };
        });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          status: 'error',
          transcript: [...prev.transcript, { role: 'system', text: `Lỗi gọi LLM: ${message}` }],
        }));
      });
  }, [state, script]);

  // Best-effort trace upload once the run finishes (success or error).
  useEffect(() => {
    if (state.status !== 'done' && state.status !== 'error') return;
    if (traceSentFor.current) return;
    traceSentFor.current = true;

    fetch('/api/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spans: state.spans }),
    })
      // api/trace.ts always responds 200, even on failure (trace delivery is
      // best-effort) — the real result is in the body's `ok` field, not the
      // HTTP status. Checking res.ok alone would report a Langfuse outage as
      // a successful send.
      .then((res) => res.json())
      .then((body: { ok: boolean }) => body.ok && setTraceSent(true))
      .catch((err) => console.warn('Gửi trace thất bại:', err));
  }, [state.status, state.spans]);

  return (
    <BaseModal open title="Chạy thử bot" onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-4">
        {state.transcript.map((entry, i) => (
          <Bubble key={i} entry={entry} />
        ))}
        {traceSent && (
          <p className="self-center text-xs text-slate-400">Đã gửi trace lên Langfuse.</p>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        {state.status === 'awaiting_input' ? (
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submit()}
            />
            <BaseButton label="Gửi" onClick={submit} />
          </div>
        ) : state.status === 'awaiting_llm' ? (
          <p className="text-center text-sm text-slate-400">Đang gọi LLM…</p>
        ) : (
          <BaseButton label="Chạy lại" variant="secondary" onClick={restart} />
        )}
      </div>
    </BaseModal>
  );
}

function Bubble({ entry }: { entry: TranscriptEntry }) {
  const style =
    entry.role === 'bot'
      ? 'self-start bg-slate-100 text-slate-800'
      : entry.role === 'user'
        ? 'self-end bg-slate-900 text-white'
        : 'self-center bg-amber-50 text-amber-700 text-xs';
  return <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${style}`}>{entry.text}</div>;
}
