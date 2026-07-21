import type OpenAI from 'openai';
import { embeddingCostOf } from './_pricing.js';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE = 500;

/** Splits a document into ~CHUNK_SIZE-character pieces, breaking at the
 *  nearest whitespace before the limit so words aren't cut mid-way. Pure —
 *  no I/O, easy to unit test later if this logic grows. */
export function chunkText(document: string): string[] {
  const chunks: string[] = [];
  let rest = document.trim();
  while (rest.length > CHUNK_SIZE) {
    let cut = rest.lastIndexOf(' ', CHUNK_SIZE);
    if (cut <= 0) cut = CHUNK_SIZE;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Embeds every chunk plus the query in one batched request, returns the
 *  chunk with the highest cosine similarity to the query, and the total
 *  embedding cost. */
export async function bestChunk(
  openai: OpenAI,
  document: string,
  query: string,
): Promise<{ text: string; cost: number }> {
  const chunks = chunkText(document);
  const r = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: [...chunks, query],
  });
  const queryEmbedding = r.data[r.data.length - 1].embedding;
  let bestIndex = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < chunks.length; i++) {
    const score = cosineSimilarity(r.data[i].embedding, queryEmbedding);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return {
    text: chunks[bestIndex],
    cost: embeddingCostOf(EMBEDDING_MODEL, r.usage.total_tokens),
  };
}
