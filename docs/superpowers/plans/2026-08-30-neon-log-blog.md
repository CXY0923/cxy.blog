# NEON_LOG 个人博客实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按规格 `docs/superpowers/specs/2026-08-30-neon-log-blog-design.md` 构建作品集型双主题静态博客 NEON_LOG(Astro 5,12 路由,whyself 式主题圆形扩散 + 页面过渡,部署 Cloudflare Pages)。

**Architecture:** 纯静态 Astro 5 + Tailwind CSS v4。主题差异 100% 收敛在 `src/styles/tokens.css` 的 CSS 变量表,组件只用语义类(`text-primary` 等)。交互全部为原生 TS 脚本(无 UI 框架),渐进增强。内容用 Content Collections(zod 校验)+ 统一简化 frontmatter。

**Tech Stack:** Astro 5 / TypeScript(strict)/ Tailwind CSS v4(`@tailwindcss/vite`)/ astro-icon + @iconify-json/material-symbols / vitest(仅测纯函数)/ Cloudflare Pages。

## Global Constraints

- 主题唯一入口:`<html data-theme="dark|light">` + 同步 class;**组件内禁止 `dark:` 变体双写**,主题差异只允许出现在 `src/styles/tokens.css` 与 `src/styles/base.css`
- 主题圆形扩散参数固定:520ms / `cubic-bezier(0.22, 1, 0.36, 1)` / `::view-transition-new(root)`
- 页面导航过渡:新内容淡入 + 12px 上移 240ms;TopNav `transition:persist="topnav"`
- 默认主题 dark;`meta[name=theme-color]` 暗色 `#0b1326` / 亮色 `#f8f9fe`
- 界面标签英文大写科技风(如 `LEARNING_MATRIX`),正文中文
- 阅读时长:中英文均按 400 单位/分钟(CJK 字符算 1、英文单词算 1),`Math.ceil`,最小 1
- frontmatter 统一:`title/description/date/tags/draft`,docs 另加 `category`,essays 另加 `image`;无 SYNC_PROGRESS、无版本徽章
- 明确不做:搜索、RSS、评论、分页、UI 框架、Serverless
- 所有交互脚本兼容 ClientRouter:事件委托或 `document.addEventListener('astro:page-load', ...)`,禁止依赖 `DOMContentLoaded` 单次执行
- 站点 URL `https://cxy.blog`(astro.config `site`)
- 提交信息中文 + `feat:`/`test:`/`docs:` 前缀;每步验证通过立即提交
- 环境:Windows + Git Bash;命令一律 `npm run ...` / `npx ...`

## File Structure(最终形态)

```
package.json  tsconfig.json  astro.config.mjs  .gitignore  README.md
public/favicon.svg  public/images/essays/subway.svg
src/styles/global.css    # 仅 3 行 @import
src/styles/tokens.css    # ★ 全部主题变量 + @theme inline 映射
src/styles/base.css      # body 底色/装饰工具类/shiki 双主题/view-transition 动画
src/lib/fmt.ts           # formatDate / readingTime(纯函数)
src/lib/post-utils.ts    # byDateDesc / tagCounts / adjacent(纯函数)
src/lib/content.ts       # getPublished / getAllPosts(依赖 astro:content)
src/content.config.ts
src/content/notes/*.md(4 篇)  src/content/docs/**/*.md(3 组 6 篇)  src/content/essays/*.md(4 篇)
src/layouts/BaseLayout.astro  PostLayout.astro  DocLayout.astro
src/components/layout/TopNav.astro  Footer.astro  DocTree.astro  Toc.astro
src/components/ui/GlassCard.astro  TagChip.astro  SectionTitle.astro  PostCard.astro  BackToTop.astro
src/pages/index.astro  about.astro  archive.astro  404.astro
src/pages/notes/index.astro  notes/[slug].astro
src/pages/docs/index.astro  docs/[slug].astro
src/pages/essays/index.astro  essays/[slug].astro
src/pages/tags/index.astro  tags/[tag].astro
```

验证命令约定:`npm run check`(astro check,类型零错误)、`npm run build`(构建零错误)、`npm run test`(vitest)、`grep` 于 `dist/` 产物核对内容标记。

---

### Task 1: 项目脚手架与构建链

**Files:**
- Create: `package.json`、`tsconfig.json`、`astro.config.mjs`、`.gitignore`、`src/styles/global.css`、`src/pages/index.astro`(占位)

**Interfaces:**
- Produces: 可运行的 Astro 5 + Tailwind v4 工程;后续所有任务在其上迭代。`npm run check/build/test` 三命令从本任务起恒定可用。

- [ ] **Step 1: 写 package.json**

```json
{
  "name": "cxy-blog",
  "type": "module",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  },
  "dependencies": {
    "@iconify-json/material-symbols": "^1.2.0",
    "@tailwindcss/vite": "^4.1.0",
    "astro": "^5.10.0",
    "astro-icon": "^1.1.5",
    "tailwindcss": "^4.1.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "typescript": "^5.7.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: 写 tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 3: 写 astro.config.mjs**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://cxy.blog',
  markdown: {
    shikiConfig: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      defaultColor: false,
    },
  },
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: 写 .gitignore**

```
node_modules/
dist/
.astro/
```

- [ ] **Step 5: 写 src/styles/global.css(骨架,tokens/base 由 Task 2 填充)**

```css
@import 'tailwindcss';
@import './tokens.css';
@import './base.css';
```

- [ ] **Step 6: 写临时空壳文件让构建可跑**

`src/styles/tokens.css`、`src/styles/base.css` 先写空注释占位:

```css
/* filled in Task 2 */
```

`src/pages/index.astro` 占位:

```astro
---
---
<!doctype html>
<html lang="zh-CN" data-theme="dark" class="dark">
  <head><meta charset="utf-8" /><title>NEON_LOG</title></head>
  <body><h1>NEON_LOG</h1></body>
</html>
```

- [ ] **Step 7: 安装依赖并验证构建**

Run: `npm install`
Expected: 无 error(exit 0)

Run: `npm run check && npm run build`
Expected: `0 errors`;`dist/index.html` 生成

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json astro.config.mjs .gitignore src/styles/global.css src/styles/tokens.css src/styles/base.css src/pages/index.astro package-lock.json
git commit -m "feat: Astro 5 + Tailwind v4 工程脚手架"
```

---

### Task 2: 设计令牌与全局样式(双主题核心)

**Files:**
- Modify: `src/styles/tokens.css`(全量重写)、`src/styles/base.css`(全量重写)
- Modify: `public/favicon.svg`(新建)

**Interfaces:**
- Produces: 语义工具类 `text-primary` `bg-surface` `font-display` `font-body` `font-mono` 等(经 `@theme inline`);全局装饰类 `.glass-panel` `.corner-bracket` `.scanline-overlay` `.grid-backdrop` `.glow-text` `.data-line` `.article-body`;`.astro-code` 双主题高亮;view-transition CSS(主题扩散 + 页面过渡)。后续所有组件与布局直接消费。

- [ ] **Step 1: 写 src/styles/tokens.css(完整令牌表)**

```css
/* ===== NEON_LOG 设计令牌 —— 全站唯一主题差异点(规格 §3) ===== */

:root,
[data-theme='light'] {
  color-scheme: light;
  --nl-primary: #854d67;
  --nl-secondary: #16667e;
  --nl-tertiary: #6f5092;
  --nl-surface: #f8f9fe;
  --nl-surface-lowest: #ffffff;
  --nl-surface-low: #f2f3f8;
  --nl-surface-container: #eceef3;
  --nl-surface-high: #e7e8ed;
  --nl-surface-highest: #e1e2e7;
  --nl-surface-variant: #e1e2e7;
  --nl-on-surface: #191c1f;
  --nl-on-surface-variant: #504348;
  --nl-outline: #837378;
  --nl-outline-variant: #d4c2c7;
  --nl-font-display: 'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif;
  --nl-font-body: 'Hanken Grotesk', 'Noto Sans SC', system-ui, sans-serif;
  --nl-glass-bg: rgba(255, 255, 255, 0.6);
  --nl-glass-border: rgba(255, 255, 255, 0.5);
  --nl-glass-shadow: 0 8px 32px rgba(160, 228, 255, 0.1);
  --fx-scanline-display: none;
  --fx-grid-opacity: 0.35;
}

[data-theme='dark'] {
  color-scheme: dark;
  --nl-primary: #ddb7ff;
  --nl-secondary: #4cd7f6;
  --nl-tertiary: #ffb0cd;
  --nl-surface: #0b1326;
  --nl-surface-lowest: #060e20;
  --nl-surface-low: #131b2e;
  --nl-surface-container: #171f33;
  --nl-surface-high: #222a3d;
  --nl-surface-highest: #2d3449;
  --nl-surface-variant: #2d3449;
  --nl-on-surface: #dae2fd;
  --nl-on-surface-variant: #cfc2d6;
  --nl-outline: #988d9f;
  --nl-outline-variant: #4d4354;
  --nl-font-display: 'Sora', 'Noto Sans SC', system-ui, sans-serif;
  --nl-font-body: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
  --nl-glass-bg: rgba(23, 31, 51, 0.4);
  --nl-glass-border: rgba(221, 183, 255, 0.2);
  --nl-glass-shadow: 0 0 24px rgba(76, 215, 246, 0.08);
  --fx-scanline-display: block;
  --fx-grid-opacity: 0;
}

/* 映射为 Tailwind 语义工具类:inline 使 utility 直接引用变量,切换 data-theme 即全站生效 */
@theme inline {
  --color-primary: var(--nl-primary);
  --color-secondary: var(--nl-secondary);
  --color-tertiary: var(--nl-tertiary);
  --color-surface: var(--nl-surface);
  --color-surface-lowest: var(--nl-surface-lowest);
  --color-surface-low: var(--nl-surface-low);
  --color-surface-container: var(--nl-surface-container);
  --color-surface-high: var(--nl-surface-high);
  --color-surface-highest: var(--nl-surface-highest);
  --color-surface-variant: var(--nl-surface-variant);
  --color-on-surface: var(--nl-on-surface);
  --color-on-surface-variant: var(--nl-on-surface-variant);
  --color-outline: var(--nl-outline);
  --color-outline-variant: var(--nl-outline-variant);
  --font-display: var(--nl-font-display);
  --font-body: var(--nl-font-body);
  --font-mono: 'JetBrains Mono', 'Noto Sans SC', ui-monospace, monospace;
}
```

- [ ] **Step 2: 写 src/styles/base.css(装饰工具类 + shiki 双主题 + 过渡动画)**

```css
/* ===== 全局基底与装饰(规格 §3.2 / §4.4) ===== */

body {
  background-color: var(--nl-surface);
}
[data-theme='dark'] body {
  background-image: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  background-attachment: fixed;
}

/* 暗色扫描线 / 亮色网格底纹:同一元素,按主题显隐 */
.scanline-overlay {
  display: var(--fx-scanline-display);
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent 50%, rgba(76, 215, 246, 0.05) 51%);
  background-size: 100% 4px;
}
.grid-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: var(--fx-grid-opacity);
  background-image:
    linear-gradient(to right, var(--nl-outline-variant) 1px, transparent 1px),
    linear-gradient(to bottom, var(--nl-outline-variant) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* 玻璃卡(两主题各自贴原稿形态) */
.glass-panel {
  background: var(--nl-glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--nl-glass-border);
  box-shadow: var(--nl-glass-shadow);
}

/* 霓虹角括号(暗色主用,亮色退化为细边角) */
.corner-bracket {
  position: relative;
}
.corner-bracket::before,
.corner-bracket::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  opacity: 0.7;
  pointer-events: none;
}
.corner-bracket::before {
  top: 0;
  right: 0;
  border-top: 2px solid var(--nl-secondary);
  border-right: 2px solid var(--nl-secondary);
}
.corner-bracket::after {
  bottom: 0;
  left: 0;
  border-bottom: 2px solid var(--nl-secondary);
  border-left: 2px solid var(--nl-secondary);
}

[data-theme='dark'] .glow-text {
  text-shadow: 0 0 8px color-mix(in srgb, var(--nl-primary) 60%, transparent);
}
.glow-text {
  text-shadow: none;
}

.data-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--nl-secondary) 50%, transparent), transparent);
}

/* ===== 正文排版(详情页 .article-body)===== */
.article-body {
  line-height: 1.8;
  color: var(--nl-on-surface-variant);
  font-size: 1rem;
}
.article-body h2,
.article-body h3,
.article-body h4 {
  color: var(--nl-on-surface);
  font-family: var(--nl-font-display);
  font-weight: 700;
  scroll-margin-top: 6rem;
}
.article-body h2 { font-size: 1.5rem; margin: 2.5rem 0 1rem; }
.article-body h3 { font-size: 1.25rem; margin: 2rem 0 0.75rem; }
.article-body p { margin: 1rem 0; }
.article-body a { color: var(--nl-secondary); text-decoration: underline; text-underline-offset: 3px; }
.article-body ul { list-style: disc; padding-left: 1.5rem; margin: 1rem 0; }
.article-body ol { list-style: decimal; padding-left: 1.5rem; margin: 1rem 0; }
.article-body li { margin: 0.375rem 0; }
.article-body blockquote {
  border-left: 3px solid var(--nl-secondary);
  padding: 0.25rem 1rem;
  margin: 1.25rem 0;
  color: var(--nl-outline);
  font-style: italic;
}
.article-body code:not(pre code) {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--nl-surface-container);
  border: 1px solid var(--nl-outline-variant);
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  color: var(--nl-tertiary);
}
.article-body img { border-radius: 8px; margin: 1.5rem auto; }
.article-body hr { border-color: var(--nl-outline-variant); margin: 2.5rem 0; }
.article-body table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
.article-body th, .article-body td { border: 1px solid var(--nl-outline-variant); padding: 0.5rem 0.75rem; }

/* ===== Shiki 双主题联动(规格 §7):defaultColor:false → span 上是 --shiki-light/dark 变量 ===== */
.astro-code {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.7;
}
.astro-code span { color: var(--shiki-light); }
[data-theme='dark'] .astro-code { color: var(--shiki-dark); background-color: var(--shiki-dark-bg); }
[data-theme='dark'] .astro-code span { color: var(--shiki-dark); }

/* ===== View Transitions(规格 §4):主题圆形扩散 + 页面导航过渡 ===== */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
/* 页面导航:新页淡入 + 上移 240ms(主题切换时 JS 的 WAAPI clip-path 优先级更高,自动覆盖) */
::view-transition-new(root) {
  animation: nl-page-in 240ms ease-out;
}
@keyframes nl-page-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}

/* 阅读进度条(规格 §7) */
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: 0%;
  z-index: 60;
  background: linear-gradient(90deg, var(--nl-secondary), var(--nl-primary));
  box-shadow: 0 0 8px color-mix(in srgb, var(--nl-secondary) 60%, transparent);
}

/* 代码块外壳(由 copy-code.ts 注入头部栏) */
.codeblock { margin: 1.5rem 0; }
.codeblock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--nl-on-surface-variant);
  background: var(--nl-surface-container);
  border: 1px solid var(--nl-outline-variant);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
}
.codeblock-header + .astro-code { border-radius: 0 0 8px 8px; margin: 0; }
.codeblock-copy { cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.codeblock-copy:hover { color: var(--nl-secondary); }

/* 锚点平滑滚动(TOC 等,reduced-motion 时由下方规则关闭) */
html {
  scroll-behavior: smooth;
}

/* 减动效(规格 §4.4) */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) { animation: none !important; }
  * { scroll-behavior: auto !important; }
}
```

- [ ] **Step 3: 写 public/favicon.svg(霓虹圆点)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0b1326"/><circle cx="16" cy="16" r="7" fill="#ddb7ff"/><circle cx="16" cy="16" r="10" fill="none" stroke="#4cd7f6" stroke-width="2" opacity="0.7"/></svg>
```

- [ ] **Step 4: 验证令牌进入构建产物**

Run: `npm run build`
Expected: 构建成功

Run: `grep -l "nl-primary" dist/_astro/*.css`
Expected: 输出至少一个 CSS 文件路径

Run: `grep -c "data-theme=.dark." dist/_astro/*.css`
Expected: 计数 ≥ 1

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/base.css public/favicon.svg
git commit -m "feat: 双主题设计令牌系统与全局装饰样式"
```

---

### Task 3: 纯函数库(TDD:fmt + post-utils)

**Files:**
- Create: `src/lib/fmt.ts`、`src/lib/post-utils.ts`
- Test: `src/lib/fmt.test.ts`、`src/lib/post-utils.test.ts`

**Interfaces:**
- Produces(v后续任务按此签名调用):
  - `formatDate(d: Date): string` → `'YYYY-MM-DD'`
  - `readingTime(text: string): number` → 分钟数
  - `byDateDesc<T extends { data: { date: Date } }>(items: T[]): T[]`
  - `tagCounts(tagLists: string[][]): Array<{ tag: string; count: number }>`(count 降序,同数按字典序)
  - `adjacent<T>(items: T[], isCurrent: (item: T) => boolean): { newer: T | null; older: T | null }`(入参需已按新→旧排序)

- [ ] **Step 1: 写失败测试 src/lib/fmt.test.ts**

```ts
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
```

- [ ] **Step 2: 写失败测试 src/lib/post-utils.test.ts**

```ts
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
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm run test`
Expected: FAIL —— `Cannot find module './fmt'`、`Cannot find module './post-utils'`

- [ ] **Step 4: 实现 src/lib/fmt.ts**

```ts
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
```

- [ ] **Step 5: 实现 src/lib/post-utils.ts**

```ts
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
```

- [ ] **Step 6: 运行测试确认通过**

Run: `npm run test`
Expected: PASS,`Test Files 2 passed`,`Tests 9 passed`

- [ ] **Step 7: 类型检查并提交**

Run: `npm run check`
Expected: `0 errors`

```bash
git add src/lib/fmt.ts src/lib/post-utils.ts src/lib/fmt.test.ts src/lib/post-utils.test.ts
git commit -m "feat: 阅读时长/日期/标签聚合/上下篇纯函数(TDD)"
```

---

### Task 4: 内容集合 schema 与占位内容

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/notes/` 4 篇、`src/content/docs/` 3 组 6 篇、`src/content/essays/` 4 篇
- Create: `public/images/essays/subway.svg`

**Interfaces:**
- Consumes: 无
- Produces: 集合名 `notes` / `docs` / `essays`;`entry.id` 即路由 slug;docs 必有 `category`(字符串,文档树分组名),essays 可有 `image`(public 路径)。Task 7–11 的 `getCollection(...)` / `getStaticPaths` 依赖本 schema。

- [ ] **Step 1: 写 src/content.config.ts(规格 §6 统一模型)**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const base = {
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
};

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object(base),
});

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({ ...base, category: z.string() }),
});

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
  schema: z.object({ ...base, image: z.string().optional() }),
});

export const collections = { notes, docs, essays };
```

- [ ] **Step 2: 写 4 篇学习笔记(src/content/notes/)**

`advanced-algorithms.md`:

```markdown
---
title: 高级算法专题
description: 动态规划、图遍历与复杂系统优化策略的深入学习记录。
date: 2026-06-14
tags: [算法, 计算机科学]
---

## 动态规划

状态设计是动态规划的核心。先用暴力递归写出解,再找重复子问题,最后换成一维/二维数组。

### 例:区间 DP

```python
def solve(nums):
    n = len(nums)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = min(dp[i + 1][j], dp[i][j - 1]) + 1
    return dp[0][n - 1]
```

## 图遍历

BFS 适合最短路径,DFS 适合拓扑与连通性。工程中更常见的是它们的变形:双向 BFS、迭代加深。
```

`neon-typography.md`:

```markdown
---
title: 霓虹字体排印
description: 在深色界面上做出可读性优先的辉光文字结构。
date: 2026-06-02
tags: [UI设计]
---

辉光不是滤镜堆叠,而是**层级系统**:标题允许 8px 辉光,正文永远关闭。

`text-shadow: 0 0 8px` 是安全上限;超过 12px 会把字形融成一团。
```

`discrete-math.md`:

```markdown
---
title: 离散数学模型
description: 逻辑、集合论与组合数学在密码学和网络架构中的应用。
date: 2026-05-18
tags: [数学]
---

集合论是类型系统的远祖。组合数学告诉我:枚举之前,先算数量级。
```

`webgpu-shaders.md`:

```markdown
---
title: WebGPU 着色器入门
description: WGSL、计算管线,以及用 GPU 做粒子模拟与生成艺术的实践。
date: 2026-06-20
tags: [计算机科学, 图形学]
---

## 为什么是 WebGPU

WebGL 的管线是绘图管线,而 WebGPU 提供 compute shader,通用计算成为一等公民。

```wgsl
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let i = id.x;
    particles[i].pos = particles[i].pos + particles[i].vel;
}
```
```

- [ ] **Step 3: 写 6 篇技术文档(src/content/docs/),3 组各 2 篇**

`docs/architecture/system-design.md`:

```markdown
---
title: 系统总览
description: NEON_ARCH 的分层结构与模块边界约定。
date: 2026-05-10
category: 架构
tags: [架构]
---

## 分层

- 接口层:协议适配与鉴权
- 领域层:纯业务规则,无 I/O
- 基础设施层:数据库、消息、缓存

边界规则:上层可以依赖下层,反向禁止。
```

`docs/architecture/modules.md`:

```markdown
---
title: 模块化设计
description: 高内聚模块的拆分粒度与通信契约。
date: 2026-05-12
category: 架构
tags: [架构]
---

模块间只通过显式接口通信。当两个模块共享超过 30% 的类型定义,说明边界画错了。
```

`docs/kernel/boot.md`:

```markdown
---
title: 内核初始化协议
description: 从冷启动到可交互环境的完整引导序列。
date: 2026-05-20
category: 内核
tags: [内核, 底层]
---

```c
void kernel_main(void) {
    if (!verify_hardware_integrity()) {
        panic("ERR_HW_FAULT");
    }
    init_virtual_memory();
    setup_idt();
    load_module("mod_vfs");
}
```

三阶段:预检 → 核心实例化 → 模块加载。
```

`docs/kernel/interrupts.md`:

```markdown
---
title: 中断与调度
description: 中断描述符表与协作式调度的实现取舍。
date: 2026-05-22
category: 内核
tags: [内核]
---

IDT 每一项都是"别慌"的预案。协作式调度换来确定性,代价是信任每一个任务。
```

`docs/security/auth.md`:

```markdown
---
title: 身份验证设计
description: 会话、令牌与最小信任原则。
date: 2026-06-01
category: 安全
tags: [安全]
---

令牌的生命周期必须短于它保护的数据的暴露成本。刷新令牌只做一件事:换新令牌。
```

`docs/security/crypto-storage.md`:

```markdown
---
title: 加密存储实践
description: 静态数据的密钥轮换与字段级加密。
date: 2026-06-05
category: 安全
tags: [安全]
---

密钥与密文分库存放只是及格线;轮换窗口和撤销流程才是设计重点。
```

- [ ] **Step 4: 写 4 篇随笔(src/content/essays/),其中 1 篇配图**

`server-room-silence.md`:

```markdown
---
title: 服务器机房的寂静
description: 机器的嗡鸣是一种特定频率的孤独。
date: 2026-04-12
tags: [随想]
---

机房里有种特有的安静。冷却风扇的嗡鸣变成白噪音,像稳定的心跳。闪烁的指示灯描绘出数据流动的隐形星座。在这里待着,有时比在人群里更像人类。

我们用 9 的个数衡量可用性,却很少计算脉冲之间的空隙。
```

`decoupling-the-ego.md`:

```markdown
---
title: 解耦自我
description: 给核心自我与外部世界之间,写一套严格的接口。
date: 2026-03-28
tags: [随想, 哲学]
---

我们写代码时用模块化保持系统整洁,防止一个组件的失败拖垮整个架构。但在生活里,我们把自己的身份和工作、产出、所谓的地位缠得太深。

最近我在尝试给核心自我和外部世界之间建一套 API:严格的接口,松耦合,让错误优雅地失败,而不是打崩主线程。
```

`prismatic-data-structures.md`:

```markdown
---
title: 棱镜数据结构
description: 把复杂树结构想象成折射光线的棱镜。
date: 2026-02-15
tags: [随想, 可视化]
---

把树结构想象成棱镜:每个节点都会改变穿过它的光的色相。理解僵化拓扑的一种更柔软的方式。
```

`subway-reflection.md`:

```markdown
---
title: 地铁倒影
description: 线路模糊,移动没有目的地,玻璃里映出一个幽灵。
date: 2026-04-06
image: /images/essays/subway.svg
tags: [随想, 影像]
---

 transit lines blur. 移动没有目的地,玻璃映出一个幽灵——像速度本身留下的残影。
```

- [ ] **Step 5: 写 public/images/essays/subway.svg(本地霓虹渐变占位,规格 §6 禁止外链)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1326"/>
      <stop offset="1" stop-color="#2d3449"/>
    </linearGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4cd7f6"/>
      <stop offset="0.5" stop-color="#ddb7ff"/>
      <stop offset="1" stop-color="#ffb0cd"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#sky)"/>
  <rect x="60" y="120" width="680" height="14" rx="7" fill="url(#neon)" opacity="0.9"/>
  <rect x="60" y="360" width="680" height="14" rx="7" fill="url(#neon)" opacity="0.6"/>
  <rect x="120" y="160" width="560" height="180" rx="10" fill="#171f33" stroke="#4cd7f6" stroke-opacity="0.4"/>
  <circle cx="640" cy="110" r="36" fill="#ffb0cd" opacity="0.8"/>
  <text x="400" y="255" fill="#dae2fd" font-family="monospace" font-size="20" text-anchor="middle" opacity="0.7">TRANSIT // GHOST</text>
</svg>
```

- [ ] **Step 6: 验证 schema 与集合装载**

Run: `npm run build`
Expected: 构建成功;若有 frontmatter 违反 schema,构建必须报错并列出文件(这本身是验收点)。同时验证 4 篇笔记中的嵌套代码围栏不破坏 frontmatter 解析(嵌套围栏全部位于 `---` 之后)。

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/content public/images/essays/subway.svg
git commit -m "feat: 三集合统一内容模型与 14 篇占位内容"
```

---

### Task 5: BaseLayout + TopNav(主题圆形扩散)+ Footer + ClientRouter

**Files:**
- Create: `src/layouts/BaseLayout.astro`、`src/components/layout/TopNav.astro`、`src/components/layout/Footer.astro`
- Modify: `src/pages/index.astro`(套用 BaseLayout,内容仍为占位)

**Interfaces:**
- Consumes: Task 2 的 `.glow-text` / `.scanline-overlay` / `.grid-backdrop`、Tailwind 语义类
- Produces:
  - `BaseLayout` props:`{ title?: string; description?: string }`(默认 title `NEON_LOG`)
  - 全局事件:点击 `[data-theme-toggle]` 触发主题圆形扩散;点击 `[data-menu-toggle]` 折叠 `[data-mobile-menu]`
  - 站点骨架:装饰层 + TopNav(fixed,`transition:persist`)+ `<main class="...pt-28...">` + Footer。页面任务(Task 7–11)只需填充 `<slot />`

- [ ] **Step 1: 写 src/components/layout/TopNav.astro(含主题扩散与移动菜单脚本)**

```astro
---
import Icon from 'astro-icon/components/Icon';

const links = [
  { href: '/', label: 'Home' },
  { href: '/notes/', label: 'Notes' },
  { href: '/docs/', label: 'Docs' },
  { href: '/essays/', label: 'Essays' },
];
const current = Astro.url.pathname;
const isActive = (href: string) => (href === '/' ? current === '/' : current.startsWith(href));
---

<nav
  class="fixed inset-x-0 top-0 z-50 border-b border-primary/20 bg-surface/80 backdrop-blur-md"
  transition:persist="topnav"
>
  <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-16">
    <a href="/" class="glow-text font-display text-xl font-bold tracking-tight text-primary">NEON_LOG</a>
    <div class="hidden items-center gap-8 md:flex">
      {
        links.map((l) => (
          <a
            href={l.href}
            aria-current={isActive(l.href) ? 'page' : undefined}
            class:list={[
              'font-mono text-sm uppercase tracking-wider transition-colors',
              isActive(l.href)
                ? 'border-b-2 border-secondary pb-0.5 font-bold text-secondary'
                : 'text-on-surface-variant hover:text-secondary',
            ]}
          >
            {l.label}
          </a>
        ))
      }
    </div>
    <div class="flex items-center gap-1">
      <button
        type="button"
        data-theme-toggle
        aria-label="切换主题"
        class="rounded-full p-2 text-secondary transition-colors hover:bg-secondary/10"
      >
        <Icon name="material-symbols:brightness-6-outline" class="text-xl" />
      </button>
      <button
        type="button"
        data-menu-toggle
        aria-label="菜单"
        class="rounded-full p-2 text-secondary transition-colors hover:bg-secondary/10 md:hidden"
      >
        <Icon name="material-symbols:menu" class="text-xl" />
      </button>
    </div>
  </div>
  <div data-mobile-menu hidden class="border-t border-outline-variant/40 bg-surface/95 px-4 py-3 md:hidden">
    {
      links.map((l) => (
        <a href={l.href} class="block py-2 font-mono text-sm uppercase tracking-wider text-on-surface-variant hover:text-secondary">
          {l.label}
        </a>
      ))
    }
  </div>
</nav>

<script>
  /* ===== 主题圆形扩散(规格 §4.2,whyself 方案)—— document 级事件委托,天然兼容 ClientRouter ===== */
  const applyTheme = (theme: string) => {
    window.dispatchEvent(new CustomEvent('nl:theme', { detail: theme }));
    document.dispatchEvent(new Event('themechange'));
  };

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // —— 主题切换 ——
    const toggle = target.closest<HTMLElement>('[data-theme-toggle]');
    if (toggle) {
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      const persist = () => {
        try {
          localStorage.setItem('theme', next);
        } catch {
          /* 私密模式等存储失败:忽略 */
        }
      };
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reduced) {
        applyTheme(next);
        persist();
        return;
      }
      const x = (e as MouseEvent).clientX || window.innerWidth - 48;
      const y = (e as MouseEvent).clientY || 48;
      const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const transition = document.startViewTransition(() => applyTheme(next));
      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
            },
            {
              duration: 520,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          );
        })
        .catch(() => {});
      transition.finished.finally(persist);
      return;
    }

    // —— 移动菜单 ——
    const menuBtn = target.closest<HTMLElement>('[data-menu-toggle]');
    if (menuBtn) {
      const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
      if (menu) menu.hidden = !menu.hidden;
    }
  });
</script>
```

注意:`applyTheme` 通过 `nl:theme` 自定义事件通知真正的 class 切换器(head 内联脚本,Step 2)——保证"切换主题的唯一入口"约束,防止两处各写一套 class 逻辑。

- [ ] **Step 2: 写 src/layouts/BaseLayout.astro(head 内联主题初始化 + 骨架)**

```astro
---
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
import TopNav from '../components/layout/TopNav.astro';
import Footer from '../components/layout/Footer.astro';

interface Props {
  title?: string;
  description?: string;
}

const {
  title = 'NEON_LOG',
  description = 'Archive of a Cyber-Architect — 学习笔记、技术文档与个人随笔',
} = Astro.props;
---

<!doctype html>
<html lang="zh-CN" data-theme="dark" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="generator" content={Astro.generator} />
    <meta name="description" content={description} />
    <meta name="theme-color" content="#0b1326" />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;600&family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@400;700&family=Noto+Sans+SC:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <ClientRouter />
    <script is:inline>
      (() => {
        const apply = (theme) => {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(theme);
          root.dataset.theme = theme;
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1326' : '#f8f9fe');
        };
        const stored = (() => {
          try {
            return localStorage.getItem('theme');
          } catch {
            return null;
          }
        })();
        const prefersDark = window.matchMedia
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : true;
        apply(stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light');
        /* 主题按钮 → 唯一 class 切换入口 */
        window.addEventListener('nl:theme', (e) => apply(e.detail));
        /* ClientRouter 换页后 html 被替换,重新应用持久化主题(规格 §4.3) */
        document.addEventListener('astro:after-swap', () => {
          const s = (() => {
            try {
              return localStorage.getItem('theme');
            } catch {
              return null;
            }
          })();
          if (s === 'light' || s === 'dark') apply(s);
        });
      })();
    </script>
  </head>
  <body class="min-h-screen bg-surface font-body text-on-surface antialiased">
    <div class="scanline-overlay" aria-hidden="true"></div>
    <div class="grid-backdrop" aria-hidden="true"></div>
    <TopNav />
    <main class="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-28 md:px-16">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 3: 写 src/components/layout/Footer.astro**

```astro
---
const links = [
  { href: 'https://github.com/cxy', label: 'GITHUB' },
  { href: '#', label: 'STACK_OVERFLOW' },
  { href: '#', label: 'LINKEDIN' },
];
---

<footer class="relative z-10 border-t border-primary/10 bg-surface-lowest/80 backdrop-blur-sm">
  <div
    class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 font-mono text-xs uppercase tracking-widest md:flex-row md:px-16"
  >
    <div class="text-primary">© 2026 NEON_LOG // CXY</div>
    <div class="flex gap-6">
      {
        links.map((l) => (
          <a href={l.href} class="text-on-surface-variant transition-colors hover:text-secondary">
            {l.label}
          </a>
        ))
      }
    </div>
  </div>
</footer>
```

- [ ] **Step 4: index.astro 套用 BaseLayout(内容仍占位)**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout>
  <h1 class="font-display text-4xl font-bold text-primary">NEON_LOG</h1>
  <p class="mt-2 font-mono text-sm uppercase tracking-widest text-secondary">SCAFFOLD OK</p>
</BaseLayout>
```

- [ ] **Step 5: 验证**

Run: `npm run check && npm run build`
Expected: 均零错误

Run: `grep -c "data-theme-toggle" dist/index.html`
Expected: `1`(或 ≥1)

Run: `grep -c "astro:after-swap" dist/index.html`
Expected: `≥ 1`

Run: `grep -c "cubic-bezier(0.22, 1, 0.36, 1)" dist/index.html`
Expected: `≥ 1`

- [ ] **Step 6: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/layout/TopNav.astro src/components/layout/Footer.astro src/pages/index.astro
git commit -m "feat: 站点骨架与 whyself 式主题圆形扩散/移动菜单"
```

---

### Task 6: 通用 UI 组件

**Files:**
- Create: `src/components/ui/GlassCard.astro`、`TagChip.astro`、`SectionTitle.astro`、`PostCard.astro`、`BackToTop.astro`

**Interfaces:**
- Consumes: Task 2 的 `.glass-panel`/`.corner-bracket`,Task 3 的 `formatDate` 不在此用(PostCard 接收已格式化字符串)
- Produces:
  - `GlassCard`:props `{ class?: string }`,slot 容器
  - `TagChip`:props `{ tag: string; count?: number }`,渲染为 `/tags/{tag}/` 链接胶囊
  - `SectionTitle`:props `{ title: string }`,英文大写小节标题 + 下划线
  - `PostCard`:props `{ title; href; description; date: string; tags?: string[]; dataTags?: string }`,`data-note-card` 供筛选(Task 8)
  - `BackToTop`:无 props;点击 easeInOutCubic 平滑回顶(680ms,whyself 同曲线);`[data-back-to-top]`

- [ ] **Step 1: GlassCard.astro**

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<div class:list={['glass-panel rounded-lg', className]}>
  <slot />
</div>
```

- [ ] **Step 2: TagChip.astro**

```astro
---
interface Props {
  tag: string;
  count?: number;
}
const { tag, count } = Astro.props;
---

<a
  href={`/tags/${tag}/`}
  class="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-surface-container px-3 py-1 font-mono text-xs text-secondary transition-colors hover:bg-secondary/20"
>
  #{tag}{count !== undefined && <span class="opacity-60">{count}</span>}
</a>
```

- [ ] **Step 3: SectionTitle.astro**

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<h2 class="mb-6 inline-block border-b border-secondary/30 pb-2 font-display text-xl font-bold text-secondary">
  {title}
</h2>
```

- [ ] **Step 4: PostCard.astro**

```astro
---
interface Props {
  title: string;
  href: string;
  description: string;
  date: string;
  tags?: string[];
  /** 额外的筛选属性(逗号分隔),透传到 data-tags,Task 8 筛选用 */
  dataTags?: string;
}
const { title, href, description, date, tags = [], dataTags } = Astro.props;
---

<article
  data-note-card
  data-tags={dataTags ?? tags.join(',')}
  class="glass-panel corner-bracket group relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 hover:border-secondary"
>
  <div class="mb-3 flex items-center justify-between gap-2">
    {
      tags.length > 0 && (
        <span class="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
          {tags[0]}
        </span>
      )
    }
    <span class="ml-auto font-mono text-xs text-secondary opacity-70">{date}</span>
  </div>
  <h3 class="font-display text-lg font-bold text-primary transition-colors group-hover:text-secondary">
    <a href={href}>{title}</a>
  </h3>
  <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
</article>
```

- [ ] **Step 5: BackToTop.astro(含平滑滚动脚本)**

```astro
---
import Icon from 'astro-icon/components/Icon';
---

<button
  type="button"
  data-back-to-top
  aria-label="返回顶部"
  hidden
  class="fixed bottom-8 right-8 z-50 rounded-full border border-secondary/40 bg-surface-container p-3 text-secondary shadow-lg transition-opacity hover:bg-secondary/20"
>
  <Icon name="material-symbols:arrow-upward" class="text-xl" />
</button>

<script>
  /* 回顶按钮 + easeInOutCubic 平滑滚动(规格 §7,680ms whyself 同曲线) */
  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let raf = 0;
  const animateScrollTo = (targetTop: number) => {
    cancelAnimationFrame(raf);
    const startTop = window.scrollY;
    const delta = targetTop - startTop;
    if (Math.abs(delta) <= 2) {
      window.scrollTo(0, targetTop);
      return;
    }
    const start = performance.now();
    const duration = 680;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startTop + delta * easeInOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const sync = () => {
    const btn = document.querySelector<HTMLElement>('[data-back-to-top]');
    if (!btn) return;
    btn.hidden = window.scrollY <= window.innerHeight;
  };

  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-back-to-top]')) return;
    animateScrollTo(0);
  });
  window.addEventListener('scroll', sync, { passive: true });
  document.addEventListener('astro:page-load', sync);
</script>
```

- [ ] **Step 6: 验证**

Run: `npm run check && npm run build`
Expected: 零错误(组件尚未被引用,`astro check` 仍会类型检查全部 `src/**/*`)

- [ ] **Step 7: Commit**

```bash
git add src/components/ui
git commit -m "feat: GlassCard/TagChip/SectionTitle/PostCard/BackToTop 通用组件"
```

---

### Task 7: 内容查询封装与首页

**Files:**
- Create: `src/lib/content.ts`
- Modify: `src/pages/index.astro`(全量重写)

**Interfaces:**
- Consumes: Task 3 `byDateDesc`、Task 4 集合、Task 6 组件
- Produces:
  - `getPublished<C extends 'notes'|'docs'|'essays'>(name: C): Promise<CollectionEntry<C>[]>`(过滤 `draft`)
  - `getAllPosts(): Promise<Post[]>`(`Post = CollectionEntry<'notes'|'essays'|'docs'>`,按新→旧)
  - Task 8–11 所有列表页使用这两个函数

- [ ] **Step 1: 写 src/lib/content.ts**

```ts
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
```

- [ ] **Step 2: 全量重写 src/pages/index.astro(Hero + 目录 Bento + 最新文章 + 侧栏)**

```astro
---
import { getPublished, getAllPosts } from '../lib/content';
import { tagCounts } from '../lib/post-utils';
import { formatDate, readingTime } from '../lib/fmt';
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionTitle from '../components/ui/SectionTitle.astro';
import PostCard from '../components/ui/PostCard.astro';
import TagChip from '../components/ui/TagChip.astro';
import BackToTop from '../components/ui/BackToTop.astro';
import Icon from 'astro-icon/components/Icon';

const [notes, docs, essays] = await Promise.all([getPublished('notes'), getPublished('docs'), getPublished('essays')]);
const posts = await getAllPosts();
const latest = posts.slice(0, 5);
const tags = tagCounts(posts.map((p) => p.data.tags)).slice(0, 8);

const dirs = [
  { href: '/notes/', icon: 'material-symbols:school', title: 'Course Notes', desc: '结构化学习记录与深度笔记。', count: notes.length, tone: 'text-primary border-primary/30' },
  { href: '/docs/', icon: 'material-symbols:memory', title: 'Tech Specs', desc: '技术文档、系统设计与工程实践。', count: docs.length, tone: 'text-secondary border-secondary/30' },
  { href: '/essays/', icon: 'material-symbols:edit_note', title: 'Daily Essays', desc: '非结构化的思考、观察与日志。', count: essays.length, tone: 'text-tertiary border-tertiary/30' },
];
---

<BaseLayout description="NEON_LOG — 赛博架构师档案:学习笔记、技术文档与个人随笔。">
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
    <div class="flex flex-col gap-12 lg:col-span-8">
      <section class="glass-panel corner-bracket relative overflow-hidden rounded-lg p-10 text-center md:p-16">
        <h1 class="glow-text font-display text-4xl font-extrabold tracking-tight text-primary md:text-5xl">NEON_LOG</h1>
        <p class="mt-3 font-mono text-sm uppercase tracking-[0.3em] text-secondary">Archive of a Cyber-Architect</p>
      </section>

      <section>
        <SectionTitle title="FEATURED_DIRECTORIES" />
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          {
            dirs.map((d) => (
              <a
                href={d.href}
                class:list={[
                  'glass-panel corner-bracket group relative rounded-lg p-6 transition-all duration-300 hover:-translate-y-1',
                  d.count >= 4 ? 'md:col-span-2' : '',
                ]}
              >
                <div class="mb-4 flex items-center gap-3">
                  <Icon name={d.icon} class={`text-2xl ${d.tone.split(' ')[0]}`} />
                  <h3 class="font-display text-lg font-bold text-on-surface">{d.title}</h3>
                </div>
                <p class="text-sm text-on-surface-variant">{d.desc}</p>
                <div class="mt-4 text-right font-mono text-xs text-secondary opacity-50 transition-opacity group-hover:opacity-100">
                  DIR_SIZE: {d.count}_ENTRIES
                </div>
              </a>
            ))
          }
        </div>
      </section>

      <section>
        <SectionTitle title="SYSTEM_LOGS" />
        <div class="flex flex-col gap-4">
          {
            latest.map((p) => (
              <PostCard
                title={p.data.title}
                href={`/${p.collection}/${p.id}/`}
                description={p.data.description}
                date={formatDate(p.data.date)}
                tags={[`${Math.max(1, readingTime(p.body ?? ''))} MIN`]}
              />
            ))
          }
        </div>
      </section>
    </div>

    <aside class="flex flex-col gap-6 lg:col-span-4">
      <div class="glass-panel rounded-lg p-6">
        <h3 class="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-secondary">
          <Icon name="material-symbols:search" /> QUERY_ARCHIVE
        </h3>
        <input
          type="text"
          placeholder="Search logs..."
          disabled
          class="w-full border-b border-secondary/30 bg-transparent px-2 py-2 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
        />
      </div>

      <div class="glass-panel rounded-lg p-6 text-center">
        <div class="glow-text mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-surface-container font-display text-3xl font-bold text-primary">
          C
        </div>
        <h3 class="font-display text-lg font-bold text-on-surface">SYS_ADMIN_01</h3>
        <p class="mt-1 font-mono text-xs uppercase tracking-widest text-primary">Lead Architect</p>
        <p class="mt-3 text-sm text-on-surface-variant">构建数字现实,记录模拟世界的崩溃过程。</p>
        <a href="/about/" class="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-secondary hover:text-primary">MORE_INFO →</a>
      </div>

      <div class="glass-panel rounded-lg p-6">
        <h3 class="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-secondary">
          <Icon name="material-symbols:sell" /> INDEX_TAGS
        </h3>
        <div class="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => <TagChip tag={tag} count={count} />)}
        </div>
      </div>
    </aside>
  </div>
  <BackToTop />
</BaseLayout>
```

- [ ] **Step 3: 验证**

Run: `npm run check && npm run build`
Expected: 零错误;若 frontmatter `description` 缺失会在此暴露(schema 已在 Task 4 拦截)

Run: `grep -c "FEATURED_DIRECTORIES" dist/index.html`
Expected: `1`

Run: `grep -c "SYS_LOGS" dist/index.html`
Expected: `1`

Run: `grep -oE 'href="/notes/[^"]+"' dist/index.html | head -3`
Expected: 4 篇笔记的详情链接出现(如 `/notes/advanced-algorithms/`)

- [ ] **Step 4: Commit**

```bash
git add src/lib/content.ts src/pages/index.astro
git commit -m "feat: 内容查询封装与首页(Hero/Bento/最新文章/侧栏)"
```

---

### Task 8: 笔记列表(客户端筛选)+ PostLayout 详情(阅读体验包)

**Files:**
- Create: `src/layouts/PostLayout.astro`、`src/pages/notes/index.astro`、`src/pages/notes/[slug].astro`

**Interfaces:**
- Consumes: Task 3 `formatDate/readingTime`、Task 7 `getPublished/adjacent(经 post-utils)`、Task 6 组件、Task 2 `.reading-progress`/`.astro-code`/`.codeblock`/`.article-body`
- Produces:
  - `PostLayout` props:`{ backHref: string; backLabel: string; title: string; date: string; minutes: number; tags: string[] }`,正文经默认 slot 传入(页面内 `await render(post)` 后 `<Content />`)
  - `[data-reading-progress]` 进度条脚本与 `[data-codeblock]` 复制脚本随 PostLayout 挂载;essays 详情(Task 10)直接复用
  - 笔记列表:`[data-filter]` 按钮 + `[data-note-card]` 卡片的客户端筛选

- [ ] **Step 1: 写 src/layouts/PostLayout.astro(含进度条与复制代码脚本)**

```astro
---
import BaseLayout from './BaseLayout.astro';
import BackToTop from '../components/ui/BackToTop.astro';
import TagChip from '../components/ui/TagChip.astro';

interface Props {
  backHref: string;
  backLabel: string;
  title: string;
  date: string;
  minutes: number;
  tags: string[];
}
const { backHref, backLabel, title, date, minutes, tags } = Astro.props;
---

<BaseLayout title={`${title} · NEON_LOG`}>
  <div class="reading-progress" data-reading-progress aria-hidden="true"></div>
  <article class="mx-auto max-w-3xl">
    <a href={backHref} class="font-mono text-xs uppercase tracking-widest text-secondary hover:text-primary">← {backLabel}</a>
    <header class="mb-10 mt-4">
      <h1 class="font-display text-3xl font-extrabold text-on-surface md:text-4xl">{title}</h1>
      <div class="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs">
        <span class="text-secondary">{date}</span>
        <span class="text-outline">·</span>
        <span class="uppercase text-on-surface-variant">~{minutes} MIN</span>
        {tags.map((t) => <TagChip tag={t} />)}
      </div>
    </header>
    <div class="article-body">
      <slot />
    </div>
    <slot name="footer-nav" />
  </article>
  <BackToTop />
</BaseLayout>

<script>
  /* ===== 阅读进度条(规格 §7):fixed 细条,passive scroll ===== */
  let bar: HTMLElement | null = null;
  let doc: HTMLElement | null = null;
  const update = () => {
    if (!bar || !doc) return;
    const total = doc.scrollHeight - window.innerHeight;
    const pct = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0;
    bar.style.width = `${pct}%`;
  };
  const refresh = () => {
    bar = document.querySelector('[data-reading-progress]');
    doc = document.documentElement;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  document.addEventListener('astro:page-load', () => {
    refresh();
    update();
  });

  /* ===== 代码块增强(规格 §7):头部栏(语言)+ 复制按钮,幂等 ===== */
  const enhance = () => {
    document.querySelectorAll<HTMLElement>('article .article-body > .astro-code, article .article-body .astro-code').forEach((pre) => {
      if (pre.dataset.enhanced) return;
      pre.dataset.enhanced = '1';
      const lang = pre.dataset.language ?? 'code';
      const wrap = document.createElement('div');
      wrap.className = 'codeblock';
      const header = document.createElement('div');
      header.className = 'codeblock-header';
      const label = document.createElement('span');
      label.textContent = lang.toUpperCase();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'codeblock-copy';
      btn.setAttribute('aria-label', '复制代码');
      btn.textContent = 'COPY';
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('pre')?.textContent ?? pre.textContent ?? '';
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = '✓ COPIED';
        } catch {
          btn.textContent = '✗ FAILED';
        }
        window.setTimeout(() => (btn.textContent = 'COPY'), 2000);
      });
      header.append(label, btn);
      pre.replaceWith(wrap);
      wrap.append(header, pre);
    });
  };
  enhance();
  document.addEventListener('astro:page-load', enhance);
</script>
```

- [ ] **Step 2: 写 src/pages/notes/index.astro(LEARNING_MATRIX + 筛选)**

```astro
---
import { getPublished } from '../../lib/content';
import { byDateDesc } from '../../lib/post-utils';
import { formatDate } from '../../lib/fmt';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/ui/PostCard.astro';
import BackToTop from '../../components/ui/BackToTop.astro';

const notes = byDateDesc(await getPublished('notes'));
const categories = [...new Set(notes.flatMap((n) => n.data.tags))];
---

<BaseLayout title="LEARNING_MATRIX · NEON_LOG" description="学习笔记知识索引。">
  <header class="mb-10">
    <h1 class="font-display text-3xl font-extrabold text-primary md:text-4xl">LEARNING_MATRIX</h1>
    <p class="mt-3 max-w-2xl text-on-surface-variant">访问碎片化知识节点。选择一个分类,开始数据传输。</p>
    <div class="mt-2 text-right font-mono text-xs uppercase tracking-widest text-secondary/40">SYS_STATUS: ONLINE</div>
  </header>

  <div class="mb-8 flex flex-wrap gap-3" data-filter-bar>
    <button type="button" data-filter="all" class="filter-active border border-secondary bg-secondary/20 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-secondary transition-colors">
      ALL_NODES
    </button>
    {
      categories.map((c) => (
        <button
          type="button"
          data-filter={c}
          class="border border-outline bg-transparent px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary"
        >
          {c}
        </button>
      ))
    }
  </div>

  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
    {
      notes.map((n) => (
        <PostCard
          title={n.data.title}
          href={`/notes/${n.id}/`}
          description={n.data.description}
          date={formatDate(n.data.date)}
          tags={n.data.tags}
        />
      ))
    }
  </div>
  <BackToTop />
</BaseLayout>

<script>
  /* 客户端筛选(规格 §5):data-filter ↔ PostCard 的 data-tags,document 委托 */
  const activeCls = ['border-secondary', 'bg-secondary/20', 'text-secondary'];
  const idleCls = ['border-outline', 'text-on-surface-variant'];
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-filter]');
    if (!btn) return;
    const value = btn.dataset.filter ?? 'all';
    document.querySelectorAll<HTMLElement>('[data-filter]').forEach((b) => {
      b.classList.remove(...activeCls);
      b.classList.add(...idleCls);
    });
    btn.classList.remove(...idleCls);
    btn.classList.add(...activeCls);
    document.querySelectorAll<HTMLElement>('[data-note-card]').forEach((card) => {
      const tags = (card.dataset.tags ?? '').split(',');
      card.hidden = value !== 'all' && !tags.includes(value);
    });
  });
</script>
```

- [ ] **Step 3: 写 src/pages/notes/[slug].astro**

```astro
---
import { getPublished } from '../../lib/content';
import { byDateDesc, adjacent } from '../../lib/post-utils';
import { formatDate, readingTime } from '../../lib/fmt';
import PostLayout from '../../layouts/PostLayout.astro';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const notes = byDateDesc(await getPublished('notes'));
  return notes.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const notes = byDateDesc(await getPublished('notes'));
const { newer, older } = adjacent(notes, (n) => n.id === post.id);
const { Content } = await render(post);
---

<PostLayout
  backHref="/notes/"
  backLabel="LEARNING_MATRIX"
  title={post.data.title}
  date={formatDate(post.data.date)}
  minutes={readingTime(post.body ?? '')}
  tags={post.data.tags}
>
  <Content />
  <nav slot="footer-nav" class="mt-16 flex justify-between gap-4 border-t border-outline-variant/40 pt-6 font-mono text-xs uppercase tracking-widest">
    {newer ? <a href={`/notes/${newer.id}/`} class="text-secondary hover:text-primary">← {newer.data.title}</a> : <span />}
    {older ? <a href={`/notes/${older.id}/`} class="text-secondary hover:text-primary">{older.data.title} →</a> : <span />}
  </nav>
</PostLayout>
```

- [ ] **Step 4: 验证**

Run: `npm run check && npm run build`
Expected: 零错误

Run: `grep -c "LEARNING_MATRIX" dist/notes/index.html`
Expected: `≥ 2`(标题 + 面包屑)

Run: `grep -c "reading-progress" dist/notes/advanced-algorithms/index.html`
Expected: `1`

Run: `grep -c "codeblock-copy" dist/notes/advanced-algorithms/index.html`
Expected: `1`

Run: `grep -c "COPY" dist/notes/webgpu-shaders/index.html && grep -c "shiki-dark" dist/notes/webgpu-shaders/index.html`
Expected: 均 `≥ 1`(复制脚本与 Shiki 双主题变量进入产物)

- [ ] **Step 5: Commit**

```bash
git add src/layouts/PostLayout.astro src/pages/notes
git commit -m "feat: 笔记列表客户端筛选与详情页阅读体验包"
```

---

### Task 9: 技术文档列表 + DocLayout 三栏(DocTree / TOC scrollspy)

**Files:**
- Create: `src/layouts/DocLayout.astro`、`src/components/layout/DocTree.astro`、`src/components/layout/Toc.astro`、`src/pages/docs/index.astro`、`src/pages/docs/[slug].astro`

**Interfaces:**
- Consumes: Task 7 `getPublished`、Task 3 `byDateDesc/formatDate`、Task 6 `GlassCard`、Task 2 `.article-body`
- Produces:
  - `DocTree` props:`{ tree: Array<{ category: string; items: Array<{ id: string; title: string }> }>; currentId: string }`
  - `Toc` props:`{ headings: Array<{ depth: number; slug: string; text: string }> }`(只取 h2/h3,来自 `render()` 返回值)
  - `DocLayout` props:`{ tree; headings; currentId; title; date; minutes; tags: string[] }`,正文默认 slot。三栏:lg 左 256px 树 / 中正文 / xl 右 256px TOC

- [ ] **Step 1: 写 src/components/layout/DocTree.astro**

```astro
---
interface DocItem {
  id: string;
  title: string;
}
interface Props {
  tree: Array<{ category: string; items: DocItem[] }>;
  currentId: string;
}
const { tree, currentId } = Astro.props;
import Icon from 'astro-icon/components/Icon';
---

<aside class="hidden lg:block">
  <div class="glass-panel sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg p-5">
    <h4 class="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-secondary">DOC_NAV</h4>
    <nav class="flex flex-col gap-5">
      {
        tree.map((group) => (
          <div>
            <div class="mb-2 font-mono text-xs uppercase tracking-widest text-tertiary opacity-80">{group.category}</div>
            <ul class="flex flex-col gap-1">
              {group.items.map((doc) => (
                <li>
                  <a
                    href={`/docs/${doc.id}/`}
                    aria-current={doc.id === currentId ? 'page' : undefined}
                    class:list={[
                      'flex items-center gap-2 rounded px-2 py-1.5 font-mono text-sm transition-colors',
                      doc.id === currentId
                        ? 'border-r-2 border-secondary bg-secondary/10 font-bold text-secondary'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-secondary',
                    ]}
                  >
                    <Icon name="material-symbols:description" class="text-base opacity-70" />
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))
      }
    </nav>
  </div>
</aside>
```

- [ ] **Step 2: 写 src/components/layout/Toc.astro(含 scrollspy 脚本)**

```astro
---
interface Heading {
  depth: number;
  slug: string;
  text: string;
}
interface Props {
  headings: Heading[];
}
const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
---

{
  items.length > 0 && (
    <aside class="hidden xl:block">
      <div class="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pl-4">
        <h4 class="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-secondary">ON_THIS_PAGE</h4>
        <ul class="flex flex-col gap-2 border-l border-outline-variant" data-toc>
          {items.map((h) => (
            <li>
              <a
                href={`#${h.slug}`}
                data-toc-link={h.slug}
                class:list={[
                  '-ml-px block border-l-2 border-transparent pl-3 font-mono text-xs leading-relaxed text-on-surface-variant transition-colors hover:text-on-surface',
                  h.depth === 3 ? 'pl-6' : '',
                ]}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

<script>
  /* TOC scrollspy(规格 §7):IntersectionObserver 高亮当前小节,astro:page-load 重挂 */
  const setup = () => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));
    if (links.length === 0) return;
    const targets = links
      .map((l) => document.getElementById(l.dataset.tocLink ?? ''))
      .filter((el): el is HTMLElement => el !== null);
    const setActive = (id: string) => {
      links.forEach((l) => {
        const on = l.dataset.tocLink === id;
        l.classList.toggle('border-secondary', on);
        l.classList.toggle('text-secondary', on);
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    targets.forEach((t) => observer.observe(t));
  };
  setup();
  document.addEventListener('astro:page-load', setup);
</script>
```

- [ ] **Step 3: 写 src/layouts/DocLayout.astro**

```astro
---
import BaseLayout from './BaseLayout.astro';
import DocTree from '../components/layout/DocTree.astro';
import Toc from '../components/layout/Toc.astro';
import TagChip from '../components/ui/TagChip.astro';
import BackToTop from '../components/ui/BackToTop.astro';

export interface DocTreeGroup {
  category: string;
  items: Array<{ id: string; title: string }>;
}
interface Heading {
  depth: number;
  slug: string;
  text: string;
}
interface Props {
  tree: DocTreeGroup[];
  headings: Heading[];
  currentId: string;
  title: string;
  date: string;
  minutes: number;
  tags: string[];
}
const { tree, headings, currentId, title, date, minutes, tags } = Astro.props;
---

<BaseLayout title={`${title} · NEON_LOG`}>
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_16rem]">
    <DocTree tree={tree} currentId={currentId} />
    <article class="mx-auto w-full max-w-3xl">
      <a href="/docs/" class="font-mono text-xs uppercase tracking-widest text-secondary hover:text-primary">← TECH_SPECS</a>
      <header class="mb-10 mt-4">
        <h1 class="font-display text-3xl font-extrabold text-on-surface md:text-4xl">{title}</h1>
        <div class="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs">
          <span class="text-secondary">{date}</span>
          <span class="text-outline">·</span>
          <span class="uppercase text-on-surface-variant">~{minutes} MIN</span>
          {tags.map((t) => <TagChip tag={t} />)}
        </div>
      </header>
      <div class="article-body">
        <slot />
      </div>
      <slot name="footer-nav" />
    </article>
    <Toc headings={headings} />
  </div>
  <BackToTop />
</BaseLayout>
```

- [ ] **Step 4: 写 src/pages/docs/index.astro**

```astro
---
import { getPublished } from '../../lib/content';
import { byDateDesc } from '../../lib/post-utils';
import { formatDate } from '../../lib/fmt';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionTitle from '../../components/ui/SectionTitle.astro';
import GlassCard from '../../components/ui/GlassCard.astro';
import BackToTop from '../../components/ui/BackToTop.astro';

const docs = byDateDesc(await getPublished('docs'));
const groups = [...new Set(docs.map((d) => d.data.category))].map((category) => ({
  category,
  docs: docs.filter((d) => d.data.category === category),
}));
---

<BaseLayout title="TECH_SPECS · NEON_LOG" description="技术文档与工程实践。">
  <header class="mb-10">
    <h1 class="font-display text-3xl font-extrabold text-primary md:text-4xl">TECH_SPECS</h1>
    <p class="mt-3 max-w-2xl text-on-surface-variant">蓝图、系统设计与工程实践文档。</p>
  </header>
  <div class="flex flex-col gap-10">
    {
      groups.map((g) => (
        <section>
          <SectionTitle title={g.category} />
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            {g.docs.map((doc) => (
              <GlassCard class="corner-bracket p-6 transition-all duration-300 hover:-translate-y-1 hover:border-secondary">
                <div class="mb-2 flex items-center justify-between font-mono text-xs text-secondary opacity-70">
                  <span>{formatDate(doc.data.date)}</span>
                </div>
                <h3 class="font-display text-lg font-bold text-primary hover:text-secondary">
                  <a href={`/docs/${doc.id}/`}>{doc.data.title}</a>
                </h3>
                <p class="mt-2 line-clamp-2 text-sm text-on-surface-variant">{doc.data.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>
      ))
    }
  </div>
  <BackToTop />
</BaseLayout>
```

- [ ] **Step 5: 写 src/pages/docs/[slug].astro**

```astro
---
import { getPublished } from '../../lib/content';
import { byDateDesc, adjacent } from '../../lib/post-utils';
import { formatDate, readingTime } from '../../lib/fmt';
import DocLayout from '../../layouts/DocLayout.astro';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const docs = byDateDesc(await getPublished('docs'));
  return docs.map((doc) => ({ params: { slug: doc.id }, props: { doc } }));
}

const { doc } = Astro.props;
const docs = byDateDesc(await getPublished('docs'));
const categories = [...new Set(docs.map((d) => d.data.category))];
/* 内联结构类型:与 DocTree.astro / DocLayout.astro 的 Props 结构一致;不从 .astro 文件导入类型 */
const tree: { category: string; items: Array<{ id: string; title: string }> }[] = categories.map((category) => ({
  category,
  items: docs.filter((d) => d.data.category === category).map((d) => ({ id: d.id, title: d.data.title })),
}));
const { newer, older } = adjacent(docs, (d) => d.id === doc.id);
const { Content, headings } = await render(doc);
---

<DocLayout
  tree={tree}
  headings={headings}
  currentId={doc.id}
  title={doc.data.title}
  date={formatDate(doc.data.date)}
  minutes={readingTime(doc.body ?? '')}
  tags={doc.data.tags}
>
  <Content />
  <nav slot="footer-nav" class="mt-16 flex justify-between gap-4 border-t border-outline-variant/40 pt-6 font-mono text-xs uppercase tracking-widest">
    {newer ? <a href={`/docs/${newer.id}/`} class="text-secondary hover:text-primary">← {newer.data.title}</a> : <span />}
    {older ? <a href={`/docs/${older.id}/`} class="text-secondary hover:text-primary">{older.data.title} →</a> : <span />}
  </nav>
</DocLayout>
```

- [ ] **Step 6: 验证**

Run: `npm run check && npm run build`
Expected: 零错误

Run: `grep -c "DOC_NAV" dist/docs/boot/index.html`
Expected: `1`

Run: `grep -c "ON_THIS_PAGE" dist/docs/boot/index.html`
Expected: `1`

Run: `grep -c "data-toc-link" dist/docs/boot/index.html`
Expected: `≥ 1`(boot.md 含 h2 标题)

- [ ] **Step 7: Commit**

```bash
git add src/layouts/DocLayout.astro src/components/layout/DocTree.astro src/components/layout/Toc.astro src/pages/docs
git commit -m "feat: 文档列表与三栏 DocLayout(DocTree/TOC scrollspy)"
```

---

### Task 10: 随笔时间线与详情

**Files:**
- Create: `src/pages/essays/index.astro`、`src/pages/essays/[slug].astro`

**Interfaces:**
- Consumes: Task 8 `PostLayout`、Task 7 `getPublished`、Task 3/2 工具与样式
- Produces: `/essays/` 时间线(中央线 + 左右交错 + 图片条目);详情复用 PostLayout(`backHref="/essays/"`)

- [ ] **Step 1: 写 src/pages/essays/index.astro**

```astro
---
import { getPublished } from '../../lib/content';
import { byDateDesc } from '../../lib/post-utils';
import { formatDate } from '../../lib/fmt';
import BaseLayout from '../../layouts/BaseLayout.astro';
import BackToTop from '../../components/ui/BackToTop.astro';

const essays = byDateDesc(await getPublished('essays'));
---

<BaseLayout title="Fragments & Reflections · NEON_LOG" description="随笔:逃出刚性系统的散落思考。">
  <header class="mb-16 text-center">
    <h1 class="glow-text font-display text-3xl font-extrabold text-tertiary md:text-4xl">Fragments &amp; Reflections</h1>
    <p class="mx-auto mt-3 max-w-2xl text-on-surface-variant">散落的思考、个人随笔与瞬间,逃离系统的刚性结构。</p>
  </header>

  <div class="relative">
    <div
      class="absolute bottom-0 left-2 top-0 w-0.5 bg-gradient-to-b from-tertiary/80 to-primary/20 shadow-[0_0_8px_rgba(255,176,205,0.4)] md:left-1/2"
      aria-hidden="true"
    >
    </div>
    <div class="flex flex-col gap-16">
      {
        essays.map((essay, i) => (
          <article class:list={['relative md:w-[46%]', i % 2 === 0 ? 'md:self-start' : 'md:self-end', 'pl-8 md:pl-0']}>
            <span
              class:list={[
                'absolute left-0 top-6 h-4 w-4 rounded-full border-2 border-surface bg-tertiary shadow-[0_0_12px_rgba(255,176,205,0.8)] md:left-auto',
                i % 2 === 0 ? 'md:right-[-9px]' : 'md:left-[-9px]',
              ]}
              aria-hidden="true"
            />
            {essay.data.image ? (
              <img src={essay.data.image} alt={essay.data.title} width="800" height="500" loading="lazy" class="mb-4 w-full rounded-lg border border-tertiary/30 object-cover opacity-80 transition-opacity hover:opacity-100" />
            ) : null}
            <div class="glass-panel corner-bracket rounded-lg p-6 transition-all duration-300 hover:-translate-y-1">
              <div class="mb-2 font-mono text-xs text-tertiary opacity-70">{formatDate(essay.data.date)} // SYS_LOG</div>
              <h2 class="mb-3 font-display text-xl font-bold text-primary">
                <a href={`/essays/${essay.id}/`} class="hover:text-tertiary">{essay.data.title}</a>
              </h2>
              <p class="line-clamp-3 leading-relaxed text-on-surface-variant">{essay.data.description}</p>
              <a href={`/essays/${essay.id}/`} class="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-tertiary hover:text-primary">
                READ_FULL_LOG →
              </a>
            </div>
          </article>
        ))
      }
    </div>
  </div>

  <div class="mt-16 text-center">
    <a
      href="/archive/"
      class="inline-block rounded border border-tertiary px-6 py-3 font-mono text-xs uppercase tracking-widest text-tertiary transition-colors hover:bg-tertiary/10"
    >
      LOAD_ARCHIVE
    </a>
  </div>
  <BackToTop />
</BaseLayout>
```

- [ ] **Step 2: 写 src/pages/essays/[slug].astro**

```astro
---
import { getPublished } from '../../lib/content';
import { byDateDesc, adjacent } from '../../lib/post-utils';
import { formatDate, readingTime } from '../../lib/fmt';
import PostLayout from '../../layouts/PostLayout.astro';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const essays = byDateDesc(await getPublished('essays'));
  return essays.map((essay) => ({ params: { slug: essay.id }, props: { essay } }));
}

const { essay } = Astro.props;
const essays = byDateDesc(await getPublished('essays'));
const { newer, older } = adjacent(essays, (e) => e.id === essay.id);
const { Content } = await render(essay);
---

<PostLayout
  backHref="/essays/"
  backLabel="FRAGMENTS"
  title={essay.data.title}
  date={formatDate(essay.data.date)}
  minutes={readingTime(essay.body ?? '')}
  tags={essay.data.tags}
>
  {
    essay.data.image && (
      <img src={essay.data.image} alt={essay.data.title} width="800" height="500" class="mb-8 w-full rounded-lg border border-tertiary/30" />
    )
  }
  <Content />
  <nav slot="footer-nav" class="mt-16 flex justify-between gap-4 border-t border-outline-variant/40 pt-6 font-mono text-xs uppercase tracking-widest">
    {newer ? <a href={`/essays/${newer.id}/`} class="text-secondary hover:text-primary">← {newer.data.title}</a> : <span />}
    {older ? <a href={`/essays/${older.id}/`} class="text-secondary hover:text-primary">{older.data.title} →</a> : <span />}
  </nav>
</PostLayout>
```

- [ ] **Step 3: 验证**

Run: `npm run check && npm run build`
Expected: 零错误

Run: `grep -c "READ_FULL_LOG" dist/essays/index.html`
Expected: `4`(每篇一条)

Run: `grep -c "subway.svg" dist/essays/index.html`
Expected: `1`(配图条目)

Run: `grep -c "reading-progress" dist/essays/decoupling-the-ego/index.html`
Expected: `1`(复用 PostLayout)

- [ ] **Step 4: Commit**

```bash
git add src/pages/essays
git commit -m "feat: 随笔中央时间线列表与详情页"
```

---

### Task 11: 归档、标签、关于、404

**Files:**
- Create: `src/pages/archive.astro`、`src/pages/tags/index.astro`、`src/pages/tags/[tag].astro`、`src/pages/about.astro`、`src/pages/404.astro`

**Interfaces:**
- Consumes: Task 7 `getAllPosts/getPublished`、Task 3 `tagCounts/formatDate`、Task 6 `TagChip/GlassCard/BackToTop`
- Produces: 全站剩余路由;Footer/侧栏的标签链接、Essays 页 `LOAD_ARCHIVE` 按钮自此全部可达(规格 §5 12 路由闭合)

- [ ] **Step 1: 写 src/pages/archive.astro(按年分组)**

```astro
---
import { getAllPosts } from '../lib/content';
import { formatDate } from '../lib/fmt';
import BaseLayout from '../layouts/BaseLayout.astro';
import BackToTop from '../components/ui/BackToTop.astro';

const posts = await getAllPosts();
const years = [...new Set(posts.map((p) => String(p.data.date.getFullYear())))];
const byYear = years.map((y) => ({ year: y, posts: posts.filter((p) => String(p.data.date.getFullYear()) === y) }));
const label: Record<string, string> = { notes: 'NOTES', docs: 'DOCS', essays: 'ESSAYS' };
---

<BaseLayout title="ARCHIVE · NEON_LOG" description="全站文章归档,按年份倒序。">
  <header class="mb-10">
    <h1 class="font-display text-3xl font-extrabold text-primary md:text-4xl">ARCHIVE</h1>
    <p class="mt-3 text-on-surface-variant">共 {posts.length} 篇记录,按时间倒序排列。</p>
  </header>
  <div class="flex flex-col gap-10">
    {
      byYear.map(({ year, posts: items }) => (
        <section>
          <h2 class="mb-4 border-b border-secondary/30 pb-2 font-display text-2xl font-bold text-secondary">{year}</h2>
          <ul class="flex flex-col gap-3">
            {items.map((p) => (
              <li class="flex flex-wrap items-baseline gap-3">
                <span class="font-mono text-xs text-secondary/60">{formatDate(p.data.date)}</span>
                <span class="rounded border border-outline-variant px-1.5 font-mono text-[10px] uppercase text-outline">{label[p.collection]}</span>
                <a href={`/${p.collection}/${p.id}/`} class="text-on-surface hover:text-secondary">{p.data.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ))
    }
  </div>
  <BackToTop />
</BaseLayout>
```

- [ ] **Step 2: 写 src/pages/tags/index.astro(标签云)**

```astro
---
import { getAllPosts } from '../../lib/content';
import { tagCounts } from '../../lib/post-utils';
import BaseLayout from '../../layouts/BaseLayout.astro';
import TagChip from '../../components/ui/TagChip.astro';
import BackToTop from '../../components/ui/BackToTop.astro';

const posts = await getAllPosts();
const tags = tagCounts(posts.map((p) => p.data.tags));
---

<BaseLayout title="INDEX_TAGS · NEON_LOG" description="全站标签索引。">
  <header class="mb-10">
    <h1 class="font-display text-3xl font-extrabold text-primary md:text-4xl">INDEX_TAGS</h1>
    <p class="mt-3 text-on-surface-variant">共 {tags.length} 个标签节点。</p>
  </header>
  <div class="flex flex-wrap gap-3">
    {tags.map(({ tag, count }) => <TagChip tag={tag} count={count} />)}
  </div>
  <BackToTop />
</BaseLayout>
```

- [ ] **Step 3: 写 src/pages/tags/[tag].astro**

```astro
---
import { getAllPosts } from '../../lib/content';
import { formatDate } from '../../lib/fmt';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/ui/PostCard.astro';
import BackToTop from '../../components/ui/BackToTop.astro';

export async function getStaticPaths() {
  const posts = await getAllPosts();
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];
  return tags.map((tag) => ({ params: { tag }, props: { posts: posts.filter((p) => p.data.tags.includes(tag)) } }));
}

const { posts } = Astro.props;
const { tag } = Astro.params;
---

<BaseLayout title={`#${tag} · NEON_LOG`} description={`标签 #${tag} 下的全部文章。`}>
  <header class="mb-10">
    <h1 class="font-display text-3xl font-extrabold text-primary md:text-4xl">#{tag}</h1>
    <p class="mt-3 text-on-surface-variant">{posts.length} 篇记录 · <a href="/tags/" class="text-secondary hover:text-primary">INDEX_TAGS →</a></p>
  </header>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
    {
      posts.map((p) => (
        <PostCard
          title={p.data.title}
          href={`/${p.collection}/${p.id}/`}
          description={p.data.description}
          date={formatDate(p.data.date)}
          tags={p.data.tags}
        />
      ))
    }
  </div>
  <BackToTop />
</BaseLayout>
```

注意:`getStaticPaths` 返回的 props 会经 Astro 序列化,`p.collection` 为字符串、`p.data.date` 为 Date,均可安全通过;不要在 props 中放置函数。

- [ ] **Step 4: 写 src/pages/about.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import GlassCard from '../components/ui/GlassCard.astro';
import TagChip from '../components/ui/TagChip.astro';

const skills = ['TypeScript', 'Astro', 'React', 'Node.js', 'Rust', 'WebGPU'];
const links = [
  { href: 'https://github.com/cxy', label: 'GITHUB' },
  { href: 'mailto:me@cxy.blog', label: 'EMAIL' },
  { href: '#', label: 'RSS(占位)' },
];
---

<BaseLayout title="ABOUT · NEON_LOG" description="关于 SYS_ADMIN_01。">
  <div class="mx-auto max-w-3xl">
    <div class="glass-panel corner-bracket rounded-lg p-8 text-center md:p-12">
      <div class="glow-text mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-surface-container font-display text-3xl font-bold text-primary">
        C
      </div>
      <h1 class="font-display text-3xl font-extrabold text-on-surface">SYS_ADMIN_01</h1>
      <p class="mt-1 font-mono text-xs uppercase tracking-widest text-primary">Lead Architect // 赛博架构师</p>
      <p class="mt-6 leading-relaxed text-on-surface-variant">
        我是 cxy,一名对系统底层与视觉表达同样着迷的工程师。这个站点是我的外存大脑:结构化的知识放在 Notes 与 Docs,逃出格子的想法落在 Essays。
      </p>
      <p class="mt-4 leading-relaxed text-on-surface-variant">相信松耦合的人生,和严格的接口。</p>
    </div>

    <GlassCard class="mt-8 p-8">
      <h2 class="mb-4 font-mono text-sm font-bold uppercase tracking-widest text-secondary">SKILL_MATRIX</h2>
      <div class="flex flex-wrap gap-2">{skills.map((s) => <TagChip tag={s} />)}</div>
    </GlassCard>

    <GlassCard class="mt-8 p-8">
      <h2 class="mb-4 font-mono text-sm font-bold uppercase tracking-widest text-secondary">CONTACT_CHANNELS</h2>
      <div class="flex flex-wrap gap-6 font-mono text-sm uppercase tracking-widest">
        {
          links.map((l) => (
            <a href={l.href} class="text-on-surface-variant transition-colors hover:text-secondary">
              {l.label}
            </a>
          ))
        }
      </div>
    </GlassCard>
  </div>
</BaseLayout>
```

- [ ] **Step 5: 写 src/pages/404.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="ERR_404 · NEON_LOG" description="页面未找到。">
  <div class="glass-panel corner-bracket mx-auto max-w-2xl rounded-lg p-10 font-mono">
    <p class="text-sm text-secondary">$ access <span class="text-tertiary">/this/path</span></p>
    <p class="mt-4 text-2xl font-bold text-primary">ERR_404: NODE_NOT_FOUND</p>
    <p class="mt-4 text-sm leading-relaxed text-on-surface-variant">
      请求的节点不存在,或已在某次重构中被回收。数据流在此断开。
    </p>
    <div class="mt-8 flex gap-4">
      <a href="/" class="rounded border border-secondary px-4 py-2 text-xs uppercase tracking-widest text-secondary transition-colors hover:bg-secondary/10">RETURN_HOME</a>
      <a href="/archive/" class="rounded border border-outline px-4 py-2 text-xs uppercase tracking-widest text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary">BROWSE_ARCHIVE</a>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 6: 验证(12 路由闭合核对)**

Run: `npm run check && npm run build`
Expected: 零错误

Run: `ls dist dist/tags dist/essays dist/notes dist/docs`
Expected: `archive/index.html`、`about/index.html`、`404.html`、`tags/index.html` 与各 `tags/<tag>/index.html` 全部存在

Run: `grep -c "ERR_404" dist/404.html`
Expected: `≥ 1`

Run: `grep -oE 'href="/tags/[^"]+"' dist/index.html | wc -l`
Expected: `≥ 8`(首页侧栏标签云全部有落点)

- [ ] **Step 7: Commit**

```bash
git add src/pages/archive.astro src/pages/tags src/pages/about.astro src/pages/404.astro
git commit -m "feat: 归档/标签/关于/404,12 路由闭合"
```

---

### Task 12: 全站验收、README 与部署说明

**Files:**
- Modify: `README.md`(全量重写)

**Interfaces:**
- Consumes: 全部前置任务
- Produces: 可部署产物与部署文档;Cloudflare Pages 控制台连接属用户手工操作,README 写明步骤

- [ ] **Step 1: 全站验收清单(逐条执行并记录)**

Run: `npm run check && npm run test && npm run build`
Expected: 三者全绿(0 errors / 9 tests passed / 构建成功)

Run: `npx astro preview`(另开终端)
逐项人工核对并记录到提交说明:
1. 12 路由逐个访问均 200;任一不存在路径渲染 404 页
2. 暗色/亮色各过一遍:点击主题按钮出现从点击处扩散的圆形揭示(Chrome);切换后刷新无闪烁;TopNav 高亮、玻璃卡、扫描线(暗)/网格(亮)正确
3. 页面间导航有淡入上移过渡(Chrome);Firefox 降级为普通跳转且主题保持
4. 详情页:进度条随滚动增长、代码块有 COPY 且点击后变 ✓ COPIED、TOC 滚动高亮、上下篇可达
5. 375 / 768 / 1280px 三档:移动菜单可开合、TOC/文档树按断点显隐、网格卡片折行正确
6. 系统开启"减少动态效果"后:无扩散动画、无平滑滚动
7. Lighthouse(桌面,首页)Performance ≥ 95;不达标时优先排查字体加载与图片尺寸

- [ ] **Step 2: 全量重写 README.md**

```markdown
# cxy.blog — NEON_LOG

赛博朋克双主题个人博客(作品集向)。Astro 5 + Tailwind CSS v4 + TypeScript,零 UI 框架运行时。

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发(`http://localhost:4321`) |
| `npm run build` | 构建到 `dist/` |
| `npm run preview` | 预览构建产物 |
| `npm run check` | 类型与诊断检查 |
| `npm run test` | vitest 纯函数测试 |

## 架构要点

- 双主题唯一入口:`<html data-theme>`;差异全部在 `src/styles/tokens.css`,组件只写语义类
- 主题切换 = View Transitions 圆形扩散(520ms);页面导航 = ClientRouter + 淡入上移 240ms
- 内容:`src/content/{notes,docs,essays}`,统一 frontmatter(zod 校验),`draft: true` 构建时过滤
- 设计规格:`docs/superpowers/specs/2026-08-30-neon-log-blog-design.md`

## 部署(Cloudflare Pages)

1. 推送本仓库到 GitHub
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git,选择本仓库
3. 构建配置:Framework preset 选 **Astro**;Build command `npm run build`;Build output directory `dist`
4. 保存后每次 push 自动部署,PR 自动生成预览
5. 可选:Custom domains 绑定 `cxy.blog`
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README 与 Cloudflare Pages 部署说明"
```
