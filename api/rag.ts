import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { bestChunk } from './_rag.js';

// Same-origin only — see api/llm.ts for why no CORS handling is needed.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const { query, document } = req.body ?? {};
  if (!query || !document) return res.status(400).json({ error: 'thiếu query/document' });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await bestChunk(openai, document, query);
    res.status(200).json(result);
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : 'rag error' });
  }
}
