import { useEffect, useRef } from 'react';
import type { Script } from '../build/compile';
import {
  provideLlm,
  provideRag,
  provideSearch,
  type PendingLlm,
  type PendingRag,
  type PendingSearch,
  type RunState,
  type TranscriptEntry,
} from './interpreter';
import type { Timing } from './useSpanTimings';

type LlmResult = { text: string; tokens: { input: number; output: number }; cost: number };
type SearchResult = { text: string; tokens: { input: number; output: number }; cost: number };
type RagResult = { text: string; cost: number };

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

async function callSearch(pending: PendingSearch): Promise<SearchResult> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: pending.query }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as SearchResult;
}

async function callRag(pending: PendingRag): Promise<RagResult> {
  const res = await fetch('/api/rag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: pending.query, document: pending.document }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as RagResult;
}

type Timings = {
  recordTiming: (index: number, timing: Timing) => void;
};

/**
 * Drives the three backend-call pause states (`awaiting_llm`/`awaiting_search`/
 * `awaiting_rag`) uniformly: each effect below guards on `state.spans.length`
 * (not `nodeId`) since a flow can loop back through the same node — each pass
 * appends a span, so spans.length uniquely identifies this particular pause
 * even when the node id repeats. A nodeId-only guard would silently stop
 * firing on a second visit and leave the modal stuck forever (this exact bug
 * class already bit the llm effect once).
 */
export function usePendingCalls(
  state: RunState,
  script: Script,
  setState: (updater: (prev: RunState) => RunState) => void,
  timings: Timings,
) {
  const llmRequestedFor = useRef<number | null>(null);
  const searchRequestedFor = useRef<number | null>(null);
  const ragRequestedFor = useRef<number | null>(null);

  function reset() {
    llmRequestedFor.current = null;
    searchRequestedFor.current = null;
    ragRequestedFor.current = null;
  }

  useEffect(() => {
    if (state.status !== 'awaiting_llm' || !state.pendingLlm) return;
    const pending = state.pendingLlm;
    if (llmRequestedFor.current === state.spans.length) return;
    llmRequestedFor.current = state.spans.length;

    const startedAt = Date.now();
    callLlm(pending)
      .then((result) => {
        const endedAt = Date.now();
        setState((prev) => {
          const next = provideLlm(prev, script, result);
          // provideLlm appends exactly one span (the llm generation) at the
          // end — record its real network duration now.
          timings.recordTiming(next.spans.length - 1, { startedAt, endedAt });
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
  }, [state, script, timings, setState]);

  useEffect(() => {
    if (state.status !== 'awaiting_search' || !state.pendingSearch) return;
    const pending = state.pendingSearch;
    if (searchRequestedFor.current === state.spans.length) return;
    searchRequestedFor.current = state.spans.length;

    const startedAt = Date.now();
    callSearch(pending)
      .then((result) => {
        const endedAt = Date.now();
        setState((prev) => {
          const next = provideSearch(prev, script, result);
          timings.recordTiming(next.spans.length - 1, { startedAt, endedAt });
          return next;
        });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          status: 'error',
          transcript: [...prev.transcript, { role: 'system', text: `Lỗi search: ${message}` }],
        }));
      });
  }, [state, script, timings, setState]);

  useEffect(() => {
    if (state.status !== 'awaiting_rag' || !state.pendingRag) return;
    const pending = state.pendingRag;
    if (ragRequestedFor.current === state.spans.length) return;
    ragRequestedFor.current = state.spans.length;

    const startedAt = Date.now();
    callRag(pending)
      .then((result) => {
        const endedAt = Date.now();
        setState((prev) => {
          const next = provideRag(prev, script, result);
          timings.recordTiming(next.spans.length - 1, { startedAt, endedAt });
          return next;
        });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          status: 'error',
          transcript: [...prev.transcript, { role: 'system', text: `Lỗi RAG: ${message}` }],
        }));
      });
  }, [state, script, timings, setState]);

  return { reset };
}
