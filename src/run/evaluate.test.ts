import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';

describe('evaluate', () => {
  it('so sánh chuỗi bằng ==', () => {
    expect(evaluate("name == 'admin'", { name: 'admin' })).toBe(true);
    expect(evaluate("name == 'admin'", { name: 'guest' })).toBe(false);
  });

  it('so sánh chuỗi bằng !=', () => {
    expect(evaluate("name != 'admin'", { name: 'guest' })).toBe(true);
    expect(evaluate("name != 'admin'", { name: 'admin' })).toBe(false);
  });

  it('so sánh số > < >= <=', () => {
    expect(evaluate('age > 18', { age: '20' })).toBe(true);
    expect(evaluate('age < 18', { age: '20' })).toBe(false);
    expect(evaluate('age >= 20', { age: '20' })).toBe(true);
    expect(evaluate('age <= 20', { age: '20' })).toBe(true);
  });

  it('biến chưa gán đọc thành chuỗi rỗng', () => {
    expect(evaluate("name == 'admin'", {})).toBe(false);
    expect(evaluate("name == ''", {})).toBe(true);
  });

  it('chuỗi && — mọi vế phải đúng', () => {
    expect(evaluate("name == 'admin' && age > 18", { name: 'admin', age: '20' })).toBe(true);
    expect(evaluate("name == 'admin' && age > 18", { name: 'admin', age: '10' })).toBe(false);
  });

  it('chuỗi || — chỉ cần một vế đúng', () => {
    expect(evaluate("name == 'admin' || name == 'root'", { name: 'root' })).toBe(true);
    expect(evaluate("name == 'a' || name == 'b'", { name: 'c' })).toBe(false);
  });

  it('trộn && với || là lỗi', () => {
    expect(() => evaluate("a == '1' && b == '2' || c == '3'", {})).toThrow(/trộn/);
  });

  it('toán tử số trên vế không phải số là lỗi', () => {
    expect(() => evaluate('name > 5', { name: 'admin' })).toThrow();
  });

  it('biến chưa gán trong so sánh số là lỗi', () => {
    expect(() => evaluate('age > 5', {})).toThrow();
    expect(() => evaluate('age <= 5', {})).toThrow();
  });

  it('biểu thức rỗng hoặc sai định dạng là lỗi', () => {
    expect(() => evaluate('   ', {})).toThrow();
    expect(() => evaluate('name', {})).toThrow();
    expect(() => evaluate('name @@ 5', {})).toThrow();
  });
});
