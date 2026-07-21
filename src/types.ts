import type { Node } from '@xyflow/react';

export type BotNodeType = 'start' | 'message' | 'ask' | 'condition' | 'end' | 'llm';

export type StartNodeType = Node<Record<string, never>, 'start'>;
export type MessageNodeType = Node<{ text: string }, 'message'>;
export type AskNodeType = Node<{ question: string; variable: string }, 'ask'>;
export type ConditionNodeType = Node<{ expression: string }, 'condition'>;
export type EndNodeType = Node<Record<string, never>, 'end'>;
export type LlmNodeType = Node<
  { model: string; systemPrompt: string; prompt: string; outputVar: string },
  'llm'
>;

export type BotNode =
  StartNodeType | MessageNodeType | AskNodeType | ConditionNodeType | EndNodeType | LlmNodeType;

/** Handle ids on ConditionNode's two source handles. The canvas sets these as
 *  `sourceHandle`; validate() and compile() read them back. Shared so a rename
 *  moves all three sites together. */
export const BRANCH = { true: 'true', false: 'false' } as const;

/** The only model an LLM node runs — not user-editable, so this is the single
 *  source of truth (NODE_DEFS, LlmNode's display, and the sample flow all read
 *  it) instead of the model string being duplicated and able to drift, the way
 *  a stale 'gpt-4o-mini' default once did. */
export const DEFAULT_LLM_MODEL = 'gpt-5.4-nano';

export const LABELS: Record<BotNodeType, string> = {
  start: 'Start',
  message: 'Message',
  ask: 'Ask',
  condition: 'Condition',
  end: 'End',
  llm: 'LLM',
};
