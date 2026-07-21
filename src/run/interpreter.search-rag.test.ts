import { describe, expect, it } from 'vitest';
import type { Script } from '../build/compile';
import { advance, createRun, provideRag, provideSearch } from './interpreter';

function script(start: string, nodes: Script['nodes']): Script {
  return { version: 1, start, nodes };
}

describe('createRun / advance with search/rag', () => {
  it('search node pauses awaiting_search with interpolated query', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'ask', question: 'Thành phố?', variable: 'city', next: 'n3' },
      n3: { type: 'search', query: 'thời tiết ở {{city}}', outputVar: 'weather', next: 'n4' },
      n4: { type: 'end' },
    });
    const paused = advance(createRun(s), s, 'Hà Nội');
    expect(paused.status).toBe('awaiting_search');
    expect(paused.pendingSearch?.query).toBe('thời tiết ở Hà Nội');
    expect(paused.pendingSearch?.outputVar).toBe('weather');
  });

  it('provideSearch stores the result, records a search span, and continues', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'search', query: 'tin tức hôm nay', outputVar: 'news', next: 'n3' },
      n3: { type: 'message', text: 'Tin: {{news}}', next: 'n4' },
      n4: { type: 'end' },
    });
    const paused = createRun(s);
    expect(paused.status).toBe('awaiting_search');
    const done = provideSearch(paused, s, { text: 'trời nắng', cost: 0.002 });
    expect(done.status).toBe('done');
    expect(done.variables.news).toBe('trời nắng');
    expect(done.transcript).toContainEqual({ role: 'bot', text: 'Tin: trời nắng' });
    expect(done.spans).toContainEqual(
      expect.objectContaining({
        kind: 'search',
        query: 'tin tức hôm nay',
        result: 'trời nắng',
        cost: 0.002,
      }),
    );
  });

  it('rag node pauses awaiting_rag with interpolated query and document', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'ask', question: 'Hỏi gì?', variable: 'q', next: 'n3' },
      n3: {
        type: 'rag',
        query: '{{q}}',
        document: 'Tài liệu về {{q}}',
        outputVar: 'chunk',
        next: 'n4',
      },
      n4: { type: 'end' },
    });
    const paused = advance(createRun(s), s, 'giá vé');
    expect(paused.status).toBe('awaiting_rag');
    expect(paused.pendingRag?.query).toBe('giá vé');
    expect(paused.pendingRag?.document).toBe('Tài liệu về giá vé');
    expect(paused.pendingRag?.outputVar).toBe('chunk');
  });

  it('provideRag stores the result, records a rag span, and continues', () => {
    const s = script('n1', {
      n1: { type: 'start', next: 'n2' },
      n2: { type: 'rag', query: 'giá vé', document: 'tài liệu', outputVar: 'chunk', next: 'n3' },
      n3: { type: 'message', text: 'Đoạn: {{chunk}}', next: 'n4' },
      n4: { type: 'end' },
    });
    const paused = createRun(s);
    expect(paused.status).toBe('awaiting_rag');
    const done = provideRag(paused, s, { text: 'vé 200k', cost: 0.0001 });
    expect(done.status).toBe('done');
    expect(done.variables.chunk).toBe('vé 200k');
    expect(done.transcript).toContainEqual({ role: 'bot', text: 'Đoạn: vé 200k' });
    expect(done.spans).toContainEqual(
      expect.objectContaining({ kind: 'rag', query: 'giá vé', result: 'vé 200k', cost: 0.0001 }),
    );
  });
});
