import { describe, expect, it } from 'vitest';
import type { Script } from '../build/compile';
import { advance, createRun, provideLlm } from './interpreter';

function script(start: string, nodes: Script['nodes']): Script {
  return { version: 1, start, nodes };
}

describe('createRun / advance', () => {
  it('chạy tuyến tính start → message → end', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'message', text: 'Xin chào!', next: 'n3' },
      n3: { type: 'end' },
    });
    const state = createRun(s);
    expect(state.status).toBe('done');
    expect(state.transcript).toEqual([
      { role: 'bot', text: 'Xin chào!' },
      { role: 'system', text: 'Kết thúc.' },
    ]);
  });

  it('ask dừng chờ input, advance ghi câu trả lời rồi condition rẽ nhánh', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'ask', question: 'Tên bạn?', variable: 'name', next: 'n3' },
      n3: { type: 'condition', expression: "name == 'admin'", onTrue: 'n4', onFalse: 'n5' },
      n4: { type: 'message', text: 'Chào sếp!', next: 'n6' },
      n5: { type: 'message', text: 'Chào bạn!', next: 'n6' },
      n6: { type: 'end' },
    });

    const paused = createRun(s);
    expect(paused.status).toBe('awaiting_input');
    expect(paused.pendingVariable).toBe('name');
    expect(paused.transcript).toEqual([{ role: 'bot', text: 'Tên bạn?' }]);

    const done = advance(paused, s, 'admin');
    expect(done.status).toBe('done');
    expect(done.variables).toEqual({ name: 'admin' });
    expect(done.transcript).toContainEqual({ role: 'user', text: 'admin' });
    expect(done.transcript).toContainEqual({ role: 'bot', text: 'Chào sếp!' });
    expect(done.transcript).not.toContainEqual({ role: 'bot', text: 'Chào bạn!' });
  });

  it('condition false đi nhánh onFalse', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'ask', question: 'Tên?', variable: 'name', next: 'n3' },
      n3: { type: 'condition', expression: "name == 'admin'", onTrue: 'n4', onFalse: 'n5' },
      n4: { type: 'message', text: 'Sếp', next: 'n6' },
      n5: { type: 'message', text: 'Khách', next: 'n6' },
      n6: { type: 'end' },
    });
    const done = advance(createRun(s), s, 'guest');
    expect(done.transcript).toContainEqual({ role: 'bot', text: 'Khách' });
  });

  it('biểu thức sai cho ra error', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'condition', expression: 'name @@ 5', onTrue: 'n3', onFalse: 'n3' },
      n3: { type: 'end' },
    });
    const state = createRun(s);
    expect(state.status).toBe('error');
    expect(state.transcript.some((e) => e.role === 'system')).toBe(true);
  });

  it('flow tự lặp bị chặn bởi bộ đếm bước', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'message', text: 'lặp', next: 'n2' },
    });
    const state = createRun(s);
    expect(state.status).toBe('error');
    expect(state.transcript.at(-1)?.text).toMatch(/lặp vô hạn/);
  });

  it('advance trên trạng thái đã kết thúc trả về nguyên trạng thái', () => {
    const s = script('n1', { n1: { type: 'start', next: 'n2' }, n2: { type: 'end' } });
    const done = createRun(s);
    expect(done.status).toBe('done');
    expect(advance(done, s, 'bất kỳ')).toBe(done);
  });

  it('llm node pauses awaiting_llm with interpolated prompt', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'ask', question: 'Tên?', variable: 'name', next: 'n3' },
      n3: { type: 'llm', model: 'gpt-4o-mini', systemPrompt: 'x', prompt: 'Chào {{name}}', outputVar: 'reply', next: 'n4' },
      n4: { type: 'end' },
    });
    const afterAsk = advance(createRun(s), s, 'Minh');
    expect(afterAsk.status).toBe('awaiting_llm');
    expect(afterAsk.pendingLlm?.prompt).toBe('Chào Minh');
    expect(afterAsk.pendingLlm?.outputVar).toBe('reply');
  });

  it('provideLlm stores the reply, records an llm span, and continues', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'llm', model: 'gpt-4o-mini', systemPrompt: '', prompt: 'hi', outputVar: 'reply', next: 'n3' },
      n3: { type: 'message', text: 'Bot nói: {{reply}}', next: 'n4' },
      n4: { type: 'end' },
    });
    const paused = createRun(s);
    expect(paused.status).toBe('awaiting_llm');
    const done = provideLlm(paused, s, { text: 'xin chào', tokens: { input: 3, output: 5 }, cost: 0.0001 });
    expect(done.status).toBe('done');
    expect(done.variables.reply).toBe('xin chào');
    expect(done.spans).toContainEqual(
      expect.objectContaining({ kind: 'llm', model: 'gpt-4o-mini', response: 'xin chào', tokens: { input: 3, output: 5 }, cost: 0.0001 }),
    );
  });

  it('records one span per visited node', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'message', text: 'hi', next: 'n3' },
      n3: { type: 'end' },
    });
    const state = createRun(s);
    expect(state.spans.filter((sp) => sp.kind === 'node')).toHaveLength(3);
  });
});
