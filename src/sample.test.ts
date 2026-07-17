import { describe, expect, it } from 'vitest';
import { compile } from './build/compile';
import { validate } from './build/validate';
import { createSampleFlow } from './sample';

describe('createSampleFlow', () => {
  it('builds a flow that validates clean', () => {
    const { nodes, edges } = createSampleFlow();
    expect(validate(nodes, edges)).toEqual([]);
  });

  it('compiles to a complete script exercising every node type', () => {
    const { nodes, edges } = createSampleFlow();
    const script = compile(nodes, edges);

    expect(script.version).toBe(1);

    const types = Object.values(script.nodes).map((n) => n.type);
    expect(new Set(types)).toEqual(new Set(['start', 'message', 'ask', 'condition', 'end']));

    const condition = Object.values(script.nodes).find((n) => n.type === 'condition');
    expect(condition).toMatchObject({ onTrue: expect.any(String), onFalse: expect.any(String) });
  });

  it('returns fresh objects on every call, so one press cannot affect the next', () => {
    const first = createSampleFlow();
    const second = createSampleFlow();

    expect(first.nodes[0]).not.toBe(second.nodes[0]);
    expect(first.nodes[0].data).not.toBe(second.nodes[0].data);

    first.nodes[0].position.x = 9999;
    expect(second.nodes[0].position.x).not.toBe(9999);
  });

  it('numbers its nodes n1..nN so the canvas can resume the counter after them', () => {
    const { nodes } = createSampleFlow();
    const ids = nodes.map((n) => n.id);
    expect(ids).toEqual(nodes.map((_, i) => `n${i + 1}`));
  });
});
