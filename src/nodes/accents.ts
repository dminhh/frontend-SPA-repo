import type { BotNodeType } from '../types';

/** Single source of truth for each node type's accent colour. Used both by
 *  NODE_DEFS (palette chip) and each node component (header bar) so they
 *  can't drift apart. Kept in its own module — not index.ts — because the
 *  node components import from here and index.ts imports the components,
 *  which would form an import cycle if this lived in index.ts. */
export const ACCENTS: Record<BotNodeType, string> = {
  start: 'bg-emerald-600',
  message: 'bg-sky-600',
  ask: 'bg-violet-600',
  condition: 'bg-amber-600',
  end: 'bg-slate-600',
  llm: 'bg-fuchsia-600',
};
