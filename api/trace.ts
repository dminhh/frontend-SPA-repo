import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { startObservation } from '@langfuse/tracing';
import { cors } from './_cors';

// Module-scope init: survives warm invocations, harmless to re-run per cold start.
const langfuseSpanProcessor = new LangfuseSpanProcessor();
const sdk = new NodeSDK({ spanProcessors: [langfuseSpanProcessor] });
sdk.start();

// Mirrors src/run/interpreter.ts's SpanRecord. Not imported across the api/src
// build boundary — kept structurally identical instead.
type SpanRecord =
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const { spans } = req.body ?? {};
  if (!Array.isArray(spans)) return res.status(400).json({ error: 'thiếu spans' });

  try {
    const rootSpan = startObservation('bot-run', { input: { spanCount: spans.length } });

    for (const s of spans as SpanRecord[]) {
      if (s.kind === 'node') {
        rootSpan.startObservation(s.type, { input: s.input, output: s.output }).end();
      } else {
        rootSpan
          .startObservation(
            s.nodeId,
            { model: s.model, input: s.prompt },
            { asType: 'generation' },
          )
          .update({
            output: s.response,
            usageDetails: { input: s.tokens.input, output: s.tokens.output },
            metadata: { cost: s.cost },
          })
          .end();
      }
    }

    rootSpan.end();

    // Must flush before the serverless function returns, or buffered spans
    // are lost when the process is frozen/recycled.
    await langfuseSpanProcessor.forceFlush();

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: e instanceof Error ? e.message : 'trace error' });
  }
}
