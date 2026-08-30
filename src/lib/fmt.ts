/** 中英文统一按 400 单位/分钟:CJK 字符算 1,英文单词算 1;向上取整,最小 1(规格 §7) */
export function readingTime(text: string): number {
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.ceil((cjk + words) / 400));
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
