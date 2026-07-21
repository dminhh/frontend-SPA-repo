import type { Edge } from '@xyflow/react';
import { BRANCH, type BotNode } from '../types';

export type CompiledNode =
  | { type: 'start'; next?: string }
  | { type: 'message'; text: string; next?: string }
  | { type: 'ask'; question: string; variable: string; next?: string }
  | { type: 'condition'; expression: string; onTrue?: string; onFalse?: string }
  | { type: 'llm'; model: string; systemPrompt: string; prompt: string; outputVar: string; next?: string }
  | { type: 'end' };

export type Script = {
  version: 1;
  start: string;
  nodes: Record<string, CompiledNode>;
};

/** Compiles a validated graph. Call `validate()` first — this assumes a start
 *  node exists and required fields are filled. */
export function compile(nodes: BotNode[], edges: Edge[]): Script {
  const start = nodes.find((n) => n.type === 'start');
  if (!start) throw new Error('compile() called on a graph with no start node');

  const compiled: Record<string, CompiledNode> = {};
  for (const node of nodes) {
    compiled[node.id] = compileNode(node, edges);
  }

  return { version: 1, start: start.id, nodes: compiled };
}

function compileNode(node: BotNode, edges: Edge[]): CompiledNode {
  switch (node.type) {
    case 'start':
      return prune<CompiledNode>({ type: 'start', next: targetOf(edges, node.id) });
    case 'message':
      return prune<CompiledNode>({
        type: 'message',
        text: node.data.text,
        next: targetOf(edges, node.id),
      });
    case 'ask':
      return prune<CompiledNode>({
        type: 'ask',
        question: node.data.question,
        variable: node.data.variable,
        next: targetOf(edges, node.id),
      });
    case 'condition':
      return prune<CompiledNode>({
        type: 'condition',
        expression: node.data.expression,
        onTrue: targetOf(edges, node.id, BRANCH.true),
        onFalse: targetOf(edges, node.id, BRANCH.false),
      });
    case 'llm':
      return prune<CompiledNode>({
        type: 'llm',
        model: node.data.model,
        systemPrompt: node.data.systemPrompt,
        prompt: node.data.prompt,
        outputVar: node.data.outputVar,
        next: targetOf(edges, node.id),
      });
    case 'end':
      return { type: 'end' };
  }
}

function targetOf(edges: Edge[], nodeId: string, handle?: string): string | undefined {
  return edges.find(
    (e) => e.source === nodeId && (handle === undefined || e.sourceHandle === handle),
  )?.target;
}

/** Drops undefined-valued keys so a terminal node emits `{ type: 'end' }` rather
 *  than `{ type: 'end', next: undefined }`. Call it with an explicit type argument
 *  — inference alone widens `type: 'start'` to `string`. */
function prune<T extends object>(node: T): T {
  return Object.fromEntries(Object.entries(node).filter(([, v]) => v !== undefined)) as T;
}
