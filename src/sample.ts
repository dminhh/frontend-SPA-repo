import type { Edge } from '@xyflow/react';
import { BRANCH, DEFAULT_LLM_MODEL, type BotNode } from './types';

/**
 * A ready-made flow for the palette's "Ví dụ" button, using all eight node
 * types and both condition branches so it compiles to a complete script:
 *
 *   Start → Ask(name) → Condition
 *                         ├─ true  → Message ─┐
 *                         └─ false → Message ─┴→ Search(weather) → RAG(hours)
 *                                                → LLM(uses {{name}}/{{weather}}/{{hours}}) → End
 *
 * Returns fresh objects on every call — sharing them would re-seat nodes wherever
 * the user last dragged them. Ids run n1..n9; the canvas resumes its counter past
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
      type: 'search',
      data: { query: 'Thời tiết hôm nay ở Hà Nội thế nào?', outputVar: 'weather' },
      position: { x: 320, y: 580 },
    },
    {
      id: 'n7',
      type: 'rag',
      data: {
        query: 'Cửa hàng mở cửa lúc mấy giờ?',
        document: 'Cửa hàng mở cửa từ 8 giờ sáng đến 22 giờ tối, tất cả các ngày trong tuần.',
        outputVar: 'hours',
      },
      position: { x: 320, y: 720 },
    },
    {
      id: 'n8',
      type: 'llm',
      data: {
        model: DEFAULT_LLM_MODEL,
        systemPrompt: 'Bạn là một trợ lý thân thiện, trả lời ngắn gọn.',
        prompt:
          'Chào {{name}}, cho biết thời tiết ({{weather}}) và giờ mở cửa ({{hours}}) trong một câu vui vẻ, dưới 30 từ.',
        outputVar: 'greeting',
      },
      position: { x: 320, y: 860 },
    },
    { id: 'n9', type: 'end', data: {}, position: { x: 320, y: 1000 } },
  ] as unknown as BotNode[];

  const edges: Edge[] = [
    { id: 'e1-2', source: 'n1', target: 'n2' },
    { id: 'e2-3', source: 'n2', target: 'n3' },
    { id: 'e3-4', source: 'n3', target: 'n4', sourceHandle: BRANCH.true },
    { id: 'e3-5', source: 'n3', target: 'n5', sourceHandle: BRANCH.false },
    { id: 'e4-6', source: 'n4', target: 'n6' },
    { id: 'e5-6', source: 'n5', target: 'n6' },
    { id: 'e6-7', source: 'n6', target: 'n7' },
    { id: 'e7-8', source: 'n7', target: 'n8' },
    { id: 'e8-9', source: 'n8', target: 'n9' },
  ];

  return { nodes, edges };
}
