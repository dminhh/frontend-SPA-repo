export type TranscriptEntry = { role: 'bot' | 'user' | 'system'; text: string };
export type RunStatus =
  'awaiting_input' | 'awaiting_llm' | 'awaiting_search' | 'awaiting_rag' | 'done' | 'error';
export type SpanRecord =
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
  | {
      kind: 'search';
      nodeId: string;
      query: string;
      result: string;
      tokens: { input: number; output: number };
      cost: number;
    }
  | { kind: 'rag'; nodeId: string; query: string; result: string; cost: number };
export type PendingLlm = {
  nodeId: string;
  model: string;
  system: string;
  prompt: string;
  outputVar: string;
};
export type PendingSearch = { nodeId: string; query: string; outputVar: string };
export type PendingRag = { nodeId: string; query: string; document: string; outputVar: string };
export type LlmResult = { text: string; tokens: { input: number; output: number }; cost: number };
export type SearchResult = {
  text: string;
  tokens: { input: number; output: number };
  cost: number;
};
export type RagResult = { text: string; cost: number };
export type RunState = {
  status: RunStatus;
  current: string | null;
  variables: Record<string, string>;
  transcript: TranscriptEntry[];
  spans: SpanRecord[];
  pendingVariable?: string;
  pendingLlm?: PendingLlm;
  pendingSearch?: PendingSearch;
  pendingRag?: PendingRag;
  error?: string;
};
