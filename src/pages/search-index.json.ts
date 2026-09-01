import type { APIRoute } from 'astro';
import { getPublished } from '../lib/content';
import { stripMarkdown } from '../lib/search';

/** 构建期生成搜索索引(draft 已过滤),SearchBox 首次聚焦时懒加载 */
export const GET: APIRoute = async () => {
  const collections = ['notes', 'docs', 'essays'] as const;
  const published = await Promise.all(collections.map((c) => getPublished(c)));
  const index = published.flat().map((p) => ({
    title: p.data.title,
    description: p.data.description,
    url: `/${p.collection}/${p.id}/`,
    collection: p.collection,
    date: p.data.date.toISOString().slice(0, 10),
    text: stripMarkdown(p.body ?? ''),
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
