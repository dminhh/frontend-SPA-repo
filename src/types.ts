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
  | StartNodeType
  | MessageNodeType
  | AskNodeType
  | ConditionNodeType
  | EndNodeType
  | LlmNodeType;

/** Handle ids on ConditionNode's two source handles. The canvas sets these as
 *  `sourceHandle`; validate() and compile() read them back. Shared so a rename
 *  moves all three sites together. */
export const BRANCH = { true: 'true', false: 'false' } as const;

export const LABELS: Record<BotNodeType, string> = {
  start: 'Start',
  message: 'Message',
  ask: 'Ask',
  condition: 'Condition',
  end: 'End',
  llm: 'LLM',
};
