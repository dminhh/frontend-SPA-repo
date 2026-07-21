import { useEffect, useRef } from 'react';
import type { SpanRecord } from './interpreter';

export type Timing = { startedAt: number; endedAt: number };
export type TimedSpanRecord = SpanRecord & Timing;

/**
 * Tracks wall-clock start/end times for each span the interpreter records,
 * without the interpreter itself calling Date.now() (it must stay pure). Node
 * spans (start/message/ask/condition/end) run synchronously with no real work
 * between them, so a batch of them appearing between two renders genuinely
 * did complete in near-zero time — that's not a bug to paper over. The llm,
 * search, and rag spans are the cases with real elapsed time (a network round
 * trip); call `recordTiming` with an exact measurement before the automatic
 * batch estimate below has a chance to render and overwrite it with a rough
 * one.
 */
export function useSpanTimings(spans: SpanRecord[]) {
  const timings = useRef<Timing[]>([]);
  const lastCount = useRef(0);
  const lastObservedAt = useRef(0);

  useEffect(() => {
    const count = spans.length;
    if (count <= lastCount.current) return;
    const now = Date.now();
    if (lastObservedAt.current === 0) lastObservedAt.current = now;
    for (let i = lastCount.current; i < count; i++) {
      if (!timings.current[i]) {
        timings.current[i] = { startedAt: lastObservedAt.current, endedAt: now };
      }
    }
    lastCount.current = count;
    lastObservedAt.current = now;
  }, [spans]);

  function recordTiming(index: number, timing: Timing) {
    timings.current[index] = timing;
  }

  function reset() {
    timings.current = [];
    lastCount.current = 0;
    lastObservedAt.current = 0;
  }

  function toTimedSpans(): TimedSpanRecord[] {
    const now = Date.now();
    return spans.map((span, i) => ({
      ...span,
      ...(timings.current[i] ?? { startedAt: now, endedAt: now }),
    }));
  }

  return { recordTiming, reset, toTimedSpans };
}
