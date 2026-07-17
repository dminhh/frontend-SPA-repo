import type { Edge } from '@xyflow/react';
import { BRANCH, LABELS, type BotNode, type BotNodeType } from '../types';

export type Issue = { nodeId?: string; message: string };

/** Node types that must have exactly one outgoing edge. `condition` is handled
 *  separately (two branches) and `end` terminates the flow. */
const NEEDS_NEXT: BotNodeType[] = ['start', 'message', 'ask'];

const REQUIRED_FIELDS: Partial<Record<BotNodeType, { key: string; label: string }[]>> = {
  message: [{ key: 'text', label: 'nội dung' }],
  ask: [
    { key: 'question', label: 'câu hỏi' },
    { key: 'variable', label: 'tên biến' },
  ],
  condition: [{ key: 'expression', label: 'biểu thức' }],
};

export function validate(nodes: BotNode[], edges: Edge[]): Issue[] {
  return [
    ...checkStart(nodes),
    ...checkRequiredFields(nodes),
    ...checkOutgoing(nodes, edges),
    ...checkFanOut(nodes, edges),
    ...checkConditionBranches(nodes, edges),
    ...checkReachable(nodes, edges),
  ];
}

function checkStart(nodes: BotNode[]): Issue[] {
  const count = nodes.filter((n) => n.type === 'start').length;
  if (count === 1) return [];
  return [{ message: `Kịch bản cần đúng một node Start (đang có ${count})` }];
}

function checkRequiredFields(nodes: BotNode[]): Issue[] {
  const issues: Issue[] = [];
  for (const node of nodes) {
    for (const field of REQUIRED_FIELDS[node.type] ?? []) {
      const value = (node.data as Record<string, unknown>)[field.key];
      if (typeof value !== 'string' || value.trim() === '') {
        issues.push({ nodeId: node.id, message: `Node ${LABELS[node.type]}: chưa nhập ${field.label}` });
      }
    }
  }
  return issues;
}

function checkOutgoing(nodes: BotNode[], edges: Edge[]): Issue[] {
  return nodes
    .filter((n) => NEEDS_NEXT.includes(n.type) && !edges.some((e) => e.source === n.id))
    .map((n) => ({ nodeId: n.id, message: `Node ${LABELS[n.type]}: chưa nối tới node tiếp theo` }));
}

function checkFanOut(nodes: BotNode[], edges: Edge[]): Issue[] {
  const issues: Issue[] = [];
  for (const node of nodes.filter((n) => NEEDS_NEXT.includes(n.type))) {
    const outgoingCount = edges.filter((e) => e.source === node.id).length;
    if (outgoingCount > 1) {
      issues.push({ nodeId: node.id, message: `Node ${LABELS[node.type]}: nối tới nhiều hơn một node` });
    }
  }
  return issues;
}

function checkConditionBranches(nodes: BotNode[], edges: Edge[]): Issue[] {
  const issues: Issue[] = [];
  for (const node of nodes.filter((n) => n.type === 'condition')) {
    for (const branch of [BRANCH.true, BRANCH.false] as const) {
      const count = edges.filter((e) => e.source === node.id && e.sourceHandle === branch).length;
      if (count === 0) {
        issues.push({ nodeId: node.id, message: `Node Condition: thiếu nhánh ${branch}` });
      } else if (count > 1) {
        issues.push({
          nodeId: node.id,
          message: `Node Condition: nhánh ${branch} nối tới nhiều hơn một node`,
        });
      }
    }
  }
  return issues;
}

function checkReachable(nodes: BotNode[], edges: Edge[]): Issue[] {
  const start = nodes.find((n) => n.type === 'start');
  if (!start) return []; // checkStart already reported this.

  const seen = new Set<string>([start.id]);
  const queue = [start.id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const e of edges.filter((e) => e.source === id)) {
      if (!seen.has(e.target)) {
        seen.add(e.target);
        queue.push(e.target);
      }
    }
  }

  return nodes
    .filter((n) => !seen.has(n.id))
    .map((n) => ({ nodeId: n.id, message: `Node ${LABELS[n.type]}: không node nào dẫn tới đây` }));
}
