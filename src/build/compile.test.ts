import { describe, expect, it } from 'vitest';
import type { Edge } from '@xyflow/react';
import type { BotNode } from '../types';
import { compile } from './compile';

function node(id: string, type: string, data: object = {}): BotNode {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as BotNode;
}

function edge(source: string, target: string, sourceHandle?: string): Edge {
  return { id: `${source}-${target}-${sourceHandle ?? ''}`, source, target, sourceHandle };
}

describe('compile', () => {
  it('compiles a linear flow and drops positions', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'message', { text: 'Xin chào!' }),
      node('n3', 'ask', { question: 'Tên bạn là gì?', variable: 'name' }),
      node('n4', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3'), edge('n3', 'n4')];

    expect(compile(nodes, edges)).toStrictEqual({
      version: 1,
      start: 'n1',
      nodes: {
        n1: { type: 'start', next: 'n2' },
        n2: { type: 'message', text: 'Xin chào!', next: 'n3' },
        n3: { type: 'ask', question: 'Tên bạn là gì?', variable: 'name', next: 'n4' },
        n4: { type: 'end' },
      },
    });
  });

  it('compiles a condition into onTrue/onFalse branches that rejoin', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'condition', { expression: "name == 'admin'" }),
      node('n3', 'message', { text: 'Chào sếp!' }),
      node('n4', 'message', { text: 'Chào bạn!' }),
      node('n5', 'end'),
    ];
    const edges = [
      edge('n1', 'n2'),
      edge('n2', 'n3', 'true'),
      edge('n2', 'n4', 'false'),
      edge('n3', 'n5'),
      edge('n4', 'n5'),
    ];

    const script = compile(nodes, edges);
    expect(script.nodes.n2).toStrictEqual({
      type: 'condition',
      expression: "name == 'admin'",
      onTrue: 'n3',
      onFalse: 'n4',
    });
    expect(script.nodes.n3).toStrictEqual({ type: 'message', text: 'Chào sếp!', next: 'n5' });
    expect(script.nodes.n4).toStrictEqual({ type: 'message', text: 'Chào bạn!', next: 'n5' });
  });

  it('omits next entirely on an end node', () => {
    const nodes = [node('n1', 'start'), node('n2', 'end')];
    const script = compile(nodes, [edge('n1', 'n2')]);
    expect(script.nodes.n2).toStrictEqual({ type: 'end' });
    expect('next' in script.nodes.n2).toBe(false);
  });

  it('copies the expression through without parsing it', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'condition', { expression: 'this is (not! valid' }),
      node('n3', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3', 'true'), edge('n2', 'n3', 'false')];
    const compiled = compile(nodes, edges).nodes.n2;
    expect(compiled).toMatchObject({ expression: 'this is (not! valid' });
  });

  it('compiles an llm node with its fields and next', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'llm', { model: 'gpt-4o-mini', systemPrompt: 'Bạn là trợ lý.', prompt: 'Chào {{name}}', outputVar: 'reply' }),
      node('n3', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3')];
    expect(compile(nodes, edges).nodes.n2).toStrictEqual({
      type: 'llm', model: 'gpt-4o-mini', systemPrompt: 'Bạn là trợ lý.',
      prompt: 'Chào {{name}}', outputVar: 'reply', next: 'n3',
    });
  });
});
