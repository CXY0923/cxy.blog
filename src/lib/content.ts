import { getCollection, type CollectionEntry } from 'astro:content';
import { byDateDesc } from './post-utils';

export type Post = CollectionEntry<'notes'> | CollectionEntry<'essays'> | CollectionEntry<'docs'>;
export type CollectionName = 'notes' | 'docs' | 'essays';

/** 全量已发布条目:production 与列表查询均过滤 draft(规格 §6/§8) */
export async function getPublished<C extends CollectionName>(name: C): Promise<CollectionEntry<C>[]> {
  return getCollection(name, (entry) => !entry.data.draft);
}

/** 三集合合并,新→旧 */
export async function getAllPosts(): Promise<Post[]> {
  const [notes, docs, essays] = await Promise.all([getPublished('notes'), getPublished('docs'), getPublished('essays')]);
  return byDateDesc([...notes, ...docs, ...essays]);
}
