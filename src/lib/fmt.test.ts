import { describe, expect, it } from 'vitest';
import { formatDate, readingTime } from './fmt';

describe('readingTime', () => {
  it('中文按 400 字/分钟向上取整', () => {
    expect(readingTime('中'.repeat(800))).toBe(2);
    expect(readingTime('中'.repeat(401))).toBe(2);
    expect(readingTime('中'.repeat(400))).toBe(1);
  });
  it('英文按 400 词/分钟向上取整', () => {
    expect(readingTime(Array.from({ length: 800 }, () => 'word').join(' '))).toBe(2);
  });
  it('中英混合累计', () => {
    // 300 个汉字 + 200 个英文单词 = 500 单位 → 2 分钟
    const text = '中'.repeat(300) + ' ' + Array.from({ length: 200 }, () => 'w').join(' ');
    expect(readingTime(text)).toBe(2);
  });
  it('不足 1 分钟按 1 分钟', () => {
    expect(readingTime('短文本 short')).toBe(1);
    expect(readingTime('')).toBe(1);
  });
});

describe('formatDate', () => {
  it('输出 YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 7, 30))).toBe('2026-08-30');
  });
  it('补零', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
