import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { cors } from './_cors';
import { costOf } from './_pricing';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const { model, system, prompt } = req.body ?? {};
  if (!model || !prompt) return res.status(400).json({ error: 'thiếu model/prompt' });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await openai.chat.completions.create({
      model,
      messages: [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        { role: 'user' as const, content: prompt },
      ],
    });
    const text = r.choices[0]?.message?.content ?? '';
    const inTok = r.usage?.prompt_tokens ?? 0;
    const outTok = r.usage?.completion_tokens ?? 0;
    res
      .status(200)
      .json({ text, tokens: { input: inTok, output: outTok }, cost: costOf(model, inTok, outTok) });
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : 'openai error' });
  }
}
