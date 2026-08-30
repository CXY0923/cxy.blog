export interface Dated {
  data: { date: Date };
}

/** 新→旧 */
export function byDateDesc<T extends Dated>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** 标签云聚合:count 降序,同数按字典序(规格 §6) */
export function tagCounts(tagLists: string[][]): Array<{ tag: string; count: number }> {
  const map = new Map<string, number>();
  for (const tags of tagLists) {
    for (const tag of tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 上下篇:入参须已按新→旧排序;newer=列表中前一项,older=后一项(规格 §5 PostLayout) */
export function adjacent<T>(items: T[], isCurrent: (item: T) => boolean): { newer: T | null; older: T | null } {
  const i = items.findIndex(isCurrent);
  if (i === -1) return { newer: null, older: null };
  return { newer: i > 0 ? items[i - 1] : null, older: i < items.length - 1 ? items[i + 1] : null };
}
