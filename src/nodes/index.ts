import type { BotNodeType } from '../types';
import { StartNode } from './StartNode';
import { MessageNode } from './MessageNode';
import { AskNode } from './AskNode';
import { ConditionNode } from './ConditionNode';
import { EndNode } from './EndNode';

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  ask: AskNode,
  condition: ConditionNode,
  end: EndNode,
};

export type NodeDef = {
  type: BotNodeType;
  label: string;
  accent: string;
  defaultData: object;
};

export const NODE_DEFS: NodeDef[] = [
  { type: 'start', label: 'Start', accent: 'bg-emerald-600', defaultData: {} },
  { type: 'message', label: 'Message', accent: 'bg-sky-600', defaultData: { text: '' } },
  { type: 'ask', label: 'Ask', accent: 'bg-violet-600', defaultData: { question: '', variable: '' } },
  { type: 'condition', label: 'Condition', accent: 'bg-amber-600', defaultData: { expression: '' } },
  { type: 'end', label: 'End', accent: 'bg-slate-600', defaultData: {} },
];
