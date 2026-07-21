import type { Edge } from '@xyflow/react';
import { BRANCH, DEFAULT_LLM_MODEL, type BotNode } from './types';

/**
 * A ready-made flow for the palette's "Ví dụ" button, using all six node types
 * and both condition branches so it compiles to a complete script:
 *
 *   Start → Ask(name) → Condition
 *                         ├─ true  → Message ─┐
 *                         └─ false → Message ─┴→ LLM(uses {{name}}) → End
 *
 * Returns fresh objects on every call — sharing them would re-seat nodes wherever
 * the user last dragged them. Ids run n1..n7; the canvas resumes its counter past
 * them so a later drop cannot collide.
 */
export function createSampleFlow(): { nodes: BotNode[]; edges: Edge[] } {
  const nodes = [
    { id: 'n1', type: 'start', data: {}, position: { x: 320, y: 0 } },
    {
      id: 'n2',
      type: 'ask',
      data: { question: 'Tên bạn là gì?', variable: 'name' },
      position: { x: 320, y: 110 },
    },
    {
      id: 'n3',
      type: 'condition',
      data: { expression: "name == 'admin'" },
      position: { x: 320, y: 260 },
    },
    { id: 'n4', type: 'message', data: { text: 'Chào sếp!' }, position: { x: 120, y: 430 } },
    { id: 'n5', type: 'message', data: { text: 'Chào bạn!' }, position: { x: 520, y: 430 } },
    {
      id: 'n6',
      type: 'llm',
      data: {
        model: DEFAULT_LLM_MODEL,
        systemPrompt: 'Bạn là một trợ lý thân thiện, trả lời ngắn gọn.',
        prompt: 'Chào {{name}} một câu vui vẻ, dưới 15 từ.',
        outputVar: 'greeting',
      },
      position: { x: 320, y: 580 },
    },
    { id: 'n7', type: 'end', data: {}, position: { x: 320, y: 720 } },
  ] as unknown as BotNode[];

  const edges: Edge[] = [
    { id: 'e1-2', source: 'n1', target: 'n2' },
    { id: 'e2-3', source: 'n2', target: 'n3' },
    { id: 'e3-4', source: 'n3', target: 'n4', sourceHandle: BRANCH.true },
    { id: 'e3-5', source: 'n3', target: 'n5', sourceHandle: BRANCH.false },
    { id: 'e4-6', source: 'n4', target: 'n6' },
    { id: 'e5-6', source: 'n5', target: 'n6' },
    { id: 'e6-7', source: 'n6', target: 'n7' },
  ];

  return { nodes, edges };
}
