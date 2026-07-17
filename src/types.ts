import type { Node } from '@xyflow/react';

export type BotNodeType = 'start' | 'message' | 'ask' | 'condition' | 'end';

export type StartNodeType = Node<Record<string, never>, 'start'>;
export type MessageNodeType = Node<{ text: string }, 'message'>;
export type AskNodeType = Node<{ question: string; variable: string }, 'ask'>;
export type ConditionNodeType = Node<{ expression: string }, 'condition'>;
export type EndNodeType = Node<Record<string, never>, 'end'>;

export type BotNode =
  | StartNodeType
  | MessageNodeType
  | AskNodeType
  | ConditionNodeType
  | EndNodeType;

export const LABELS: Record<BotNodeType, string> = {
  start: 'Start',
  message: 'Message',
  ask: 'Ask',
  condition: 'Condition',
  end: 'End',
};
