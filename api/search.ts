import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { costOf } from './_pricing.js';

const SEARCH_MODEL = 'gpt-5.4-nano';

// Same-origin only — see api/llm.ts for why no CORS handling is needed.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const { query } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'thiếu query' });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await openai.responses.create({
      model: SEARCH_MODEL,
      input: query,
      tools: [{ type: 'web_search' }],
    });
    const inTok = r.usage?.input_tokens ?? 0;
    const outTok = r.usage?.output_tokens ?? 0;
    res.status(200).json({
      text: r.output_text,
      tokens: { input: inTok, output: outTok },
      cost: costOf(SEARCH_MODEL, inTok, outTok),
    });
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : 'search error' });
  }
}
