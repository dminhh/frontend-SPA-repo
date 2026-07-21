import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { startObservation } from '@langfuse/tracing';

// Module-scope init: survives warm invocations, harmless to re-run per cold start.
const langfuseSpanProcessor = new LangfuseSpanProcessor();
const sdk = new NodeSDK({ spanProcessors: [langfuseSpanProcessor] });
sdk.start();

// Mirrors src/run/interpreter.ts's SpanRecord, plus the wall-clock timing
// RunModal attaches (the interpreter itself stays pure — no Date.now() there).
// Not imported across the api/src build boundary — kept structurally
// identical instead. Timing is optional so a manual curl without it (as used
// to verify this endpoint before the frontend sent real timings) still works,
// falling back to "right now" for both ends.
type SpanRecord = {
  startedAt?: number;
  endedAt?: number;
} & (
  | { kind: 'node'; nodeId: string; type: string; input?: string; output?: string }
  | {
      kind: 'llm';
      nodeId: string;
      model: string;
      prompt: string;
      response: string;
      tokens: { input: number; output: number };
      cost: number;
    }
  | { kind: 'search'; nodeId: string; query: string; result: string; cost: number }
  | { kind: 'rag'; nodeId: string; query: string; result: string; cost: number }
);

// Same-origin only — the frontend and this function are both served from the
// same Vercel deployment, so no CORS headers or preflight handling are needed.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const { spans } = req.body ?? {};
  if (!Array.isArray(spans)) return res.status(400).json({ error: 'thiếu spans' });

  try {
    const now = Date.now();
    const typedSpans = spans as SpanRecord[];
    const starts = typedSpans.map((s) => s.startedAt ?? now);
    const ends = typedSpans.map((s) => s.endedAt ?? now);
    const runStart = starts.length ? Math.min(...starts) : now;
    const runEnd = ends.length ? Math.max(...ends) : now;

    const rootSpan = startObservation(
      'bot-run',
      { input: { spanCount: spans.length } },
      { startTime: new Date(runStart) },
    );
    // The instance method (rootSpan.startObservation) doesn't accept a custom
    // startTime — only the free function does. Use it for children too, with
    // parentSpanContext to preserve the parent-child relationship.
    const parentSpanContext = rootSpan.otelSpan.spanContext();

    for (const s of typedSpans) {
      const startTime = new Date(s.startedAt ?? now);
      const endTime = s.endedAt ?? now;
      if (s.kind === 'node') {
        startObservation(
          s.type,
          { input: s.input, output: s.output },
          { startTime, parentSpanContext },
        ).end(endTime);
      } else if (s.kind === 'llm') {
        startObservation(
          s.nodeId,
          { model: s.model, input: s.prompt },
          { asType: 'generation', startTime, parentSpanContext },
        )
          .update({
            output: s.response,
            usageDetails: { input: s.tokens.input, output: s.tokens.output },
            metadata: { cost: s.cost },
          })
          .end(endTime);
      } else if (s.kind === 'search') {
        startObservation(
          'search',
          { input: s.query, output: s.result },
          { asType: 'generation', startTime, parentSpanContext },
        )
          .update({ metadata: { cost: s.cost } })
          .end(endTime);
      } else {
        startObservation(
          'rag',
          { input: s.query, output: s.result, metadata: { cost: s.cost } },
          { startTime, parentSpanContext },
        ).end(endTime);
      }
    }

    rootSpan.end(runEnd);

    // Must flush before the serverless function returns, or buffered spans
    // are lost when the process is frozen/recycled.
    await langfuseSpanProcessor.forceFlush();

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: e instanceof Error ? e.message : 'trace error' });
  }
}
