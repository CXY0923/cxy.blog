import { describe, expect, it } from 'vitest';
import { adjacent, byDateDesc, tagCounts } from './post-utils';

const d = (s: string) => new Date(s);
const mk = (title: string, date: string) => ({ data: { date: d(date) }, title });

describe('byDateDesc', () => {
  it('按日期新→旧排序', () => {
    const out = byDateDesc([mk('a', '2026-01-01'), mk('b', '2026-06-01'), mk('c', '2026-03-01')]);
    expect(out.map((x) => x.title)).toEqual(['b', 'c', 'a']);
  });
});

describe('tagCounts', () => {
  it('聚合计数,count 降序同数按字典序', () => {
    const out = tagCounts([['react', 'web'], ['web'], ['react']]);
    expect(out).toEqual([
      { tag: 'react', count: 2 },
      { tag: 'web', count: 2 },
    ]);
  });
  it('空输入返回空数组', () => {
    expect(tagCounts([])).toEqual([]);
  });
});

describe('adjacent', () => {
  it('返回同集合中更新/更旧的文章', () => {
    const items = [mk('newest', '2026-03-01'), mk('current', '2026-02-01'), mk('oldest', '2026-01-01')];
    expect(adjacent(items, (x) => x.title === 'current')).toEqual({
      newer: items[0],
      older: items[2],
    });
  });
  it('找不到目标返回双 null', () => {
    const items = [mk('a', '2026-01-01')];
    expect(adjacent(items, () => false)).toEqual({ newer: null, older: null });
  });
});
