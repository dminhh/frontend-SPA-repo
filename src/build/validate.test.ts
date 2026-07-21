import { describe, expect, it } from 'vitest';
import type { Edge } from '@xyflow/react';
import type { BotNode } from '../types';
import { validate } from './validate';

function node(id: string, type: string, data: object = {}): BotNode {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as BotNode;
}

function edge(source: string, target: string, sourceHandle?: string): Edge {
  return { id: `${source}-${target}-${sourceHandle ?? ''}`, source, target, sourceHandle };
}

describe('validate', () => {
  it('accepts a valid linear flow', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'message', { text: 'Xin chào!' }),
      node('n3', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3')];
    expect(validate(nodes, edges)).toEqual([]);
  });

  it('rejects a flow with no start node', () => {
    const issues = validate([node('n1', 'end')], []);
    expect(issues).toContainEqual({ message: 'Kịch bản cần đúng một node Start (đang có 0)' });
  });

  it('rejects a flow with two start nodes', () => {
    const nodes = [node('n1', 'start'), node('n2', 'start'), node('n3', 'end')];
    const edges = [edge('n1', 'n3'), edge('n2', 'n3')];
    const issues = validate(nodes, edges);
    expect(issues).toContainEqual({ message: 'Kịch bản cần đúng một node Start (đang có 2)' });
  });

  it('rejects an empty required field', () => {
    const nodes = [node('n1', 'start'), node('n2', 'message', { text: '   ' }), node('n3', 'end')];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3')];
    expect(validate(nodes, edges)).toContainEqual({
      nodeId: 'n2',
      message: 'Node Message: chưa nhập nội dung',
    });
  });

  it('reports each missing required field on an ask node', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'ask', { question: '', variable: '' }),
      node('n3', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3')];
    const issues = validate(nodes, edges);
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node Ask: chưa nhập câu hỏi' });
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node Ask: chưa nhập tên biến' });
  });

  it('rejects a node with no outgoing edge', () => {
    const nodes = [node('n1', 'start'), node('n2', 'message', { text: 'hi' })];
    const edges = [edge('n1', 'n2')];
    expect(validate(nodes, edges)).toContainEqual({
      nodeId: 'n2',
      message: 'Node Message: chưa nối tới node tiếp theo',
    });
  });

  it('allows an end node to have no outgoing edge', () => {
    const nodes = [node('n1', 'start'), node('n2', 'end')];
    const edges = [edge('n1', 'n2')];
    expect(validate(nodes, edges)).toEqual([]);
  });

  it('rejects a condition missing its false branch', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'condition', { expression: "name == 'admin'" }),
      node('n3', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3', 'true')];
    const issues = validate(nodes, edges);
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node Condition: thiếu nhánh false' });
    expect(issues).not.toContainEqual({
      nodeId: 'n2',
      message: 'Node Condition: chưa nối tới node tiếp theo',
    });
  });

  it('rejects a condition with two edges on the same branch', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'condition', { expression: "name == 'admin'" }),
      node('n3', 'end'),
      node('n4', 'end'),
      node('n5', 'end'),
    ];
    const edges = [
      edge('n1', 'n2'),
      edge('n2', 'n3', 'true'),
      edge('n2', 'n4', 'true'),
      edge('n2', 'n5', 'false'),
    ];
    const issues = validate(nodes, edges);
    expect(issues).toContainEqual({
      nodeId: 'n2',
      message: 'Node Condition: nhánh true nối tới nhiều hơn một node',
    });
  });

  it('accepts a condition with exactly one edge per branch', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'condition', { expression: "name == 'admin'" }),
      node('n3', 'end'),
      node('n4', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3', 'true'), edge('n2', 'n4', 'false')];
    expect(validate(nodes, edges)).toEqual([]);
  });

  it('rejects a node unreachable from start', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'end'),
      node('n3', 'message', { text: 'lạc trôi' }),
      node('n4', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n3', 'n4')];
    expect(validate(nodes, edges)).toContainEqual({
      nodeId: 'n3',
      message: 'Node Message: không node nào dẫn tới đây',
    });
  });

  it('rejects a message node with multiple outgoing edges', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'message', { text: 'Xin chào!' }),
      node('n3', 'end'),
      node('n4', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3'), edge('n2', 'n4')];
    const issues = validate(nodes, edges);
    expect(issues).toContainEqual({
      nodeId: 'n2',
      message: 'Node Message: nối tới nhiều hơn một node',
    });
  });

  it('allows a condition node with multiple outgoing edges (two branches)', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'condition', { expression: "name == 'admin'" }),
      node('n3', 'end'),
      node('n4', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3', 'true'), edge('n2', 'n4', 'false')];
    expect(validate(nodes, edges)).toEqual([]);
  });

  it('rejects an llm node with empty required fields', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'llm', { model: '', systemPrompt: '', prompt: '', outputVar: '' }),
      node('n3', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3')];
    const issues = validate(nodes, edges);
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node LLM: chưa nhập model' });
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node LLM: chưa nhập prompt' });
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node LLM: chưa nhập tên biến ra' });
  });

  it('an llm node needs exactly one outgoing edge', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'llm', { model: 'gpt-4o-mini', systemPrompt: '', prompt: 'hi', outputVar: 'r' }),
    ];
    const edges = [edge('n1', 'n2')];
    expect(validate(nodes, edges)).toContainEqual({
      nodeId: 'n2',
      message: 'Node LLM: chưa nối tới node tiếp theo',
    });
  });
});
