export const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5.4-nano': { input: 0.2, output: 1.25 },
  'gpt-5.4-mini': { input: 0.75, output: 4.5 },
  'gpt-5.4': { input: 2.5, output: 15 },
};

export function costOf(model: string, inTok: number, outTok: number): number {
  const p = PRICING[model] ?? PRICING['gpt-5.4-nano'];
  return (inTok / 1e6) * p.input + (outTok / 1e6) * p.output;
}

export const EMBEDDING_PRICING: Record<string, number> = {
  'text-embedding-3-small': 0.02,
};

export function embeddingCostOf(model: string, tokens: number): number {
  const perMillion = EMBEDDING_PRICING[model] ?? EMBEDDING_PRICING['text-embedding-3-small'];
  return (tokens / 1e6) * perMillion;
}
