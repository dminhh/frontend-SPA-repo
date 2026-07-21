import { describe, expect, it } from 'vitest';
import { interpolate } from './interpolate';

describe('interpolate', () => {
  it('thay một biến', () => {
    expect(interpolate('Chào {{name}}', { name: 'Minh' })).toBe('Chào Minh');
  });
  it('thay nhiều biến, kể cả lặp', () => {
    expect(interpolate('{{a}}-{{b}}-{{a}}', { a: '1', b: '2' })).toBe('1-2-1');
  });
  it('biến chưa có thành rỗng', () => {
    expect(interpolate('x{{missing}}y', {})).toBe('xy');
  });
  it('không có placeholder thì giữ nguyên', () => {
    expect(interpolate('không có gì', {})).toBe('không có gì');
  });
  it('bỏ qua khoảng trắng trong ngoặc', () => {
    expect(interpolate('{{ name }}', { name: 'A' })).toBe('A');
  });
});
