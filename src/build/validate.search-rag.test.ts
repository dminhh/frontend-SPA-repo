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
  it('rejects a search node with empty required fields', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'search', { query: '', outputVar: '' }),
      node('n3', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3')];
    const issues = validate(nodes, edges);
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node Search: chưa nhập câu truy vấn' });
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node Search: chưa nhập tên biến ra' });
  });

  it('a search node needs exactly one outgoing edge', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'search', { query: 'thời tiết', outputVar: 'r' }),
    ];
    const edges = [edge('n1', 'n2')];
    expect(validate(nodes, edges)).toContainEqual({
      nodeId: 'n2',
      message: 'Node Search: chưa nối tới node tiếp theo',
    });
  });

  it('rejects a rag node with empty required fields', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'rag', { query: '', document: '', outputVar: '' }),
      node('n3', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3')];
    const issues = validate(nodes, edges);
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node RAG: chưa nhập câu truy vấn' });
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node RAG: chưa nhập tài liệu' });
    expect(issues).toContainEqual({ nodeId: 'n2', message: 'Node RAG: chưa nhập tên biến ra' });
  });

  it('accepts a valid search and rag flow', () => {
    const nodes = [
      node('n1', 'start'),
      node('n2', 'search', { query: 'thời tiết hôm nay', outputVar: 'weather' }),
      node('n3', 'rag', { query: '{{weather}}', document: 'tài liệu mẫu', outputVar: 'doc' }),
      node('n4', 'end'),
    ];
    const edges = [edge('n1', 'n2'), edge('n2', 'n3'), edge('n3', 'n4')];
    expect(validate(nodes, edges)).toEqual([]);
  });
});
