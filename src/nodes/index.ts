import type { BotNodeType } from '../types';
import { ACCENTS } from './accents';
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
  { type: 'start', label: 'Start', accent: ACCENTS.start, defaultData: {} },
  { type: 'message', label: 'Message', accent: ACCENTS.message, defaultData: { text: '' } },
  { type: 'ask', label: 'Ask', accent: ACCENTS.ask, defaultData: { question: '', variable: '' } },
  {
    type: 'condition',
    label: 'Condition',
    accent: ACCENTS.condition,
    defaultData: { expression: '' },
  },
  { type: 'end', label: 'End', accent: ACCENTS.end, defaultData: {} },
];
