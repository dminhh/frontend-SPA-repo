import { useEffect, useRef, useState } from 'react';
import type { Script } from '../build/compile';
import { BaseButton } from '../components/base/BaseButton';
import { BaseModal } from '../components/base/BaseModal';
import { advance, createRun, type RunState, type TranscriptEntry } from './interpreter';
import { usePendingCalls } from './usePendingCalls';
import { useSpanTimings } from './useSpanTimings';

type Props = {
  script: Script;
  onClose: () => void;
};

export function RunModal({ script, onClose }: Props) {
  const [state, setState] = useState<RunState>(() => createRun(script));
  const [input, setInput] = useState('');
  const [traceSent, setTraceSent] = useState(false);
  const traceSentFor = useRef(false);
  const timings = useSpanTimings(state.spans);
  const pendingCalls = usePendingCalls(state, script, setState, timings);

  function submit() {
    if (state.status !== 'awaiting_input') return;
    setState(advance(state, script, input));
    setInput('');
  }

  function restart() {
    pendingCalls.reset();
    traceSentFor.current = false;
    setTraceSent(false);
    timings.reset();
    setState(createRun(script));
  }

  // Best-effort trace upload once the run finishes (success or error).
  useEffect(() => {
    if (state.status !== 'done' && state.status !== 'error') return;
    if (traceSentFor.current) return;
    traceSentFor.current = true;

    fetch('/api/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spans: timings.toTimedSpans() }),
    })
      // api/trace.ts always responds 200, even on failure (trace delivery is
      // best-effort) — the real result is in the body's `ok` field, not the
      // HTTP status. Checking res.ok alone would report a Langfuse outage as
      // a successful send.
      .then((res) => res.json())
      .then((body: { ok: boolean }) => body.ok && setTraceSent(true))
      .catch((err) => console.warn('Gửi trace thất bại:', err));
  }, [state.status, state.spans, timings]);

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
        ) : state.status === 'awaiting_search' ? (
          <p className="text-center text-sm text-slate-400">Đang tìm kiếm…</p>
        ) : state.status === 'awaiting_rag' ? (
          <p className="text-center text-sm text-slate-400">Đang tra cứu tài liệu…</p>
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
