/** 站内搜索:索引条目结构 / 子串评分匹配 / 正文纯文本化(规格 docs/superpowers/specs/2026-09-01-search-design.md) */

export interface SearchIndexEntry {
  title: string;
  description: string;
  url: string;
  collection: string;
  /** ISO 日期串 */
  date: string;
  /** 剥离 Markdown 后的正文纯文本 */
  text: string;
}

/** 字段权重:标题 > 摘要 > 正文 */
const WEIGHT = { title: 3, description: 2, text: 1 } as const;

/**
 * 子串匹配评分检索:标题/摘要/正文按权重加分,同分按日期新→旧。
 * 空白查询返回 [];大小写不敏感;中文按连续子串命中(无分词)。
 */
export function searchPosts(index: SearchIndexEntry[], query: string): SearchIndexEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { entry: SearchIndexEntry; score: number }[] = [];
  for (const entry of index) {
    let score = 0;
    if (entry.title.toLowerCase().includes(q)) score += WEIGHT.title;
    if (entry.description.toLowerCase().includes(q)) score += WEIGHT.description;
    if (entry.text.toLowerCase().includes(q)) score += WEIGHT.text;
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date));
  return scored.map((s) => s.entry);
}

/** Markdown → 纯文本:够索引用即可,不追求还原度(代码块/标记/链接语法全部剥掉,空白折叠) */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
