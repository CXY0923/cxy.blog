import { describe, expect, it } from 'vitest';
import { searchPosts, stripMarkdown, type SearchIndexEntry } from './search';

const mk = (title: string, extra: Partial<SearchIndexEntry> = {}): SearchIndexEntry => ({
  title,
  description: '',
  url: `/${title}/`,
  collection: 'notes',
  date: '2026-01-01',
  text: '',
  ...extra,
});

describe('searchPosts', () => {
  const index = [
    mk('WebGPU 着色器入门', { text: '用 GPU 做粒子模拟', date: '2026-06-20' }),
    mk('高级算法专题', { description: '动态规划与图遍历', date: '2026-06-14' }),
    mk('加密存储实践', { date: '2026-06-05' }),
  ];

  it('标题命中排在描述/正文命中之前', () => {
    const out = searchPosts(index, '算法');
    expect(out.map((x) => x.title)).toEqual(['高级算法专题']);
  });

  it('正文与摘要都能命中', () => {
    expect(searchPosts(index, '粒子').map((x) => x.title)).toEqual(['WebGPU 着色器入门']);
    expect(searchPosts(index, '动态规划').map((x) => x.title)).toEqual(['高级算法专题']);
  });

  it('多字段命中得分更高,排前面', () => {
    const idx = [
      mk('A', { text: 'neon', date: '2026-01-02' }),
      mk('B', { description: 'neon', text: 'neon', date: '2026-01-01' }),
    ];
    expect(searchPosts(idx, 'neon').map((x) => x.title)).toEqual(['B', 'A']);
  });

  it('同分按日期新→旧', () => {
    const idx = [mk('old', { text: 'gpu', date: '2026-01-01' }), mk('new', { text: 'gpu', date: '2026-06-01' })];
    expect(searchPosts(idx, 'gpu').map((x) => x.title)).toEqual(['new', 'old']);
  });

  it('大小写不敏感', () => {
    expect(searchPosts([mk('WebGPU 入门')], 'webgpu')).toHaveLength(1);
  });

  it('空白查询与无命中返回空数组', () => {
    expect(searchPosts(index, '')).toEqual([]);
    expect(searchPosts(index, '  ')).toEqual([]);
    expect(searchPosts(index, '不存在的词')).toEqual([]);
  });
});

describe('stripMarkdown', () => {
  it('剥离代码块/行内码/链接/图片/HTML/标题标记并折叠空白', () => {
    const md = [
      '# 标题',
      '',
      '```js',
      'const x = 1;',
      '```',
      '',
      '见 [文档](https://example.com) 与 ![图](a.png),`inline` 以及 <b>html</b>。',
    ].join('\n');
    expect(stripMarkdown(md)).toBe('标题 见 文档 与 图,inline 以及 html 。');
  });
});
