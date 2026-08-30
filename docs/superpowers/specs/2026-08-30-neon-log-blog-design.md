# NEON_LOG 个人博客 — 设计文档

日期:2026-08-30
状态:已获用户确认
参考:仓库根目录 `原稿.txt`(4 类页面 × 暗色/亮色两套 HTML 初稿);页面切换方案参考 [blog.whyself.cn](https://blog.whyself.cn/)

## 1. 项目定位

**作品集/简历展示型个人博客**。视觉完成度与工程亮点优先,内容真实性次要(使用占位文章填充,保证每个版式有真实观感)。

- 站点概念:`NEON_LOG` — "Archive of a Cyber-Architect",赛博朋克视觉体系
- 内容语言:文章正文中文为主;界面保留原稿的英文科技风标签(如 `LEARNING_MATRIX`、`SYS_LOGS`)
- 域名/仓库名:`cxy.blog`

## 2. 技术栈

| 层 | 选择 | 理由 |
|---|---|---|
| 框架 | Astro 5,`output: 'static'` | 内容型站点首选;原稿 HTML/Tailwind 结构可直接迁移 |
| 语言 | TypeScript(strict) | 组件 props、content schema 全程类型化 |
| 样式 | Tailwind CSS v4(CSS-first `@theme` 配置) | 原稿即 Tailwind 类名;v4 的 CSS 变量机制与双主题天然契合 |
| 前端运行时 | 无框架,原生 TS 脚本 | 零框架运行时,交互靠少量岛屿脚本 |
| 图标 | `astro-icon` + `@iconify-json/material-symbols` | 按需内联 SVG,不加载整个图标字体 |
| 内容 | Markdown + Astro Content Collections + zod schema | 构建期校验 |
| 部署 | Cloudflare Pages(Git 集成) | 免费、全球 CDN、PR 预览;构建命令 `npm run build`,输出 `dist/` |

不引入 React/Vue/Svelte 等任何 UI 框架,不引入搜索与评论系统(明确不做)。

## 3. 双主题设计令牌系统

核心约束:**主题差异 100% 收敛进 `src/styles/tokens.css`**,组件只使用语义类(`text-primary`、`bg-surface`、`font-display`),不出现 `dark:` 变体双写。

### 3.1 切换机制

- `<html data-theme="dark" class="dark">`,`data-theme` 与 class 同步设置(兼容两类选择器写法)
- 组件样式通过 Tailwind v4 `@theme` 把语义名映射到 CSS 变量;变量值在 `[data-theme="dark"]` / `[data-theme="light"]` 两个块中定义
- 装饰性差异也走变量:`--fx-scanline-display`(暗色扫描线覆盖层)/ `--fx-grid-opacity`(亮色网格底纹),一个元素按主题显隐

### 3.2 令牌对照表(源自原稿)

| 语义 | 暗色(霓虹) | 亮色(粉彩) |
|---|---|---|
| `--color-primary` | `#ddb7ff`(紫) | `#854d67`(玫瑰) |
| `--color-secondary` | `#4cd7f6`(青) | `#16667e`(青蓝) |
| `--color-tertiary` | `#ffb0cd`(粉) | `#6f5092`(紫) |
| `--color-surface` | `#0b1326` | `#f8f9fe` |
| `--color-on-surface` | `#dae2fd` | `#191c1f` |
| `--color-surface-container` | `#171f33` | `#eceef3` |
| `--color-outline` | `#988d9f` | `#837378` |
| `--font-display`(标题) | Sora | Space Grotesk |
| `--font-body`(正文) | Inter | Hanken Grotesk |
| `--font-mono`(代码/标签) | JetBrains Mono(两主题共用) | 同左 |
| 装饰效果 | 扫描线 + 辉光 + 角括号 | 网格底纹 + 柔光玻璃卡 |

其余 surface 层级(container-low/high/highest、outline-variant 等)按原稿 M3 令牌全量收录进 `tokens.css`。中文回退:所有字体栈追加 `"Noto Sans SC"`(经 Google Fonts 引入)。

玻璃卡(`.glass-panel`)、辉光(`.glow-*`)、角括号(`.corner-bracket-*`)、扫描线、网格底纹作为全局工具类写在 `base.css`,参数取变量,两主题下自动呈现原稿各自的形态。

## 4. 主题切换与页面过渡动效(参考 whyself 方案)

### 4.1 主题初始化(防闪烁)

`BaseLayout` head 内联脚本:读 `localStorage.theme` → 回退 `prefers-color-scheme` → 设 `data-theme` + class + `meta[name=theme-color]`。暗色为默认。

### 4.2 主题切换 = 圆形扩散揭示

点击主题按钮时,以点击坐标为圆心做 clip-path 圆形扩散揭示新主题:

- `document.startViewTransition(() => applyTheme(next))`
- `transition.ready` 后在 `documentElement` 上 animate:`clipPath: ["circle(0px at x y)", "circle(Rpx at x y)"]`,`R` 为点击点到最远角的距离
- 参数:duration **520ms**,easing **cubic-bezier(0.22, 1, 0.36, 1)**,`pseudoElement: "::view-transition-new(root)"`
- CSS 配套:`::view-transition-old(root), ::view-transition-new(root) { animation: none }` 关闭默认交叉淡化
- 同步更新 `meta[name=theme-color]`;切换完成后才写 `localStorage`;派发 `themechange` 事件供其他脚本响应
- 不支持 `startViewTransition` 的浏览器:直接切换主题,无动画、无报错

### 4.3 页面导航过渡

- 使用 Astro `<ClientRouter />`;TopNav 加 `transition:persist`,跨页面保持存活
- 全局自定义过渡:主内容区新页面淡入 + 12px 上移,240ms ease-out
- ClientRouter 导航后在 `astro:after-swap` 重新应用主题(防止 DOM 替换后主题回退)

### 4.4 降级与无障碍

- 浏览器不支持 View Transitions:页面导航为普通 MPA 跳转,主题切换为即时切换
- `prefers-reduced-motion: reduce`:禁用扩散动画、导航过渡、平滑滚动

## 5. 页面清单(12 路由)

| 路由 | 布局 | 内容 | 原稿来源 |
|---|---|---|---|
| `/` | Base | Hero(`NEON_LOG` + 副标题)+ 三目录 Bento 卡(Notes/Docs/Essays + 条目计数)+ 最新文章列表 + 侧栏(装饰搜索框、头像卡、标签云) | 首页两版 |
| `/notes/` | Base | `LEARNING_MATRIX` 标题 + 分类筛选 chips(客户端过滤当前页卡片)+ 响应式卡片网格 | Notes 两版 |
| `/notes/[slug]/` | Post | 笔记详情 | 新增 |
| `/docs/` | Base | 按分组的文档卡片列表 | 新增 |
| `/docs/[slug]/` | Doc | 三栏:左侧文档树(分组导航)+ 正文 + 右侧 TOC(≥1280px 显示) | Docs 两版 |
| `/essays/` | Base | 中央时间线:玻璃卡条目 + 可配图条目 + `LOAD_ARCHIVE` 按钮(链到 /archive/) | Essays 两版 |
| `/essays/[slug]/` | Post | 随笔详情 | 新增 |
| `/archive/` | Base | 全站文章按年份倒序分组 | 新增 |
| `/tags/` | Base | 标签云(带计数) | 新增 |
| `/tags/[tag]/` | Base | 单标签下的全部文章 | 新增 |
| `/about/` | Base | 头像、简介、技能栈、社交链接 | 新增 |
| `/404` | Base | 终端风 `ERR_404: NODE_NOT_FOUND` + 返回首页 | 新增 |

布局复用:

- `BaseLayout`:head(主题脚本/字体/meta)+ `ClientRouter` + TopNav + Footer + 装饰层
- `PostLayout`(笔记/随笔详情):面包屑 → 标题 → 标签行(日期/阅读时长/tags)→ 阅读进度条 → 正文(prose)→ 上一篇/下一篇
- `DocLayout`(文档详情):DocTree + 正文 + TOC 三栏;正文区与 PostLayout 同规格;不做版本徽章

导航结构:TopNav 四项 Home / Notes / Docs / Essays,当前项下划线高亮;移动端折叠为汉堡菜单。Footer:版权行 + 链接组(GITHUB 指向真实仓库,其余为 `href="#"` 装饰链接)。

列表页(首页最新文章、notes、docs、tags)不做分页,全量渲染——内容量级为作品集占位,无分页必要。

## 6. 内容模型

三个集合(`notes` / `docs` / `essays`)共用统一简化 schema(`src/content.config.ts`,zod):

```ts
title:       z.string(),
description: z.string(),          // 列表卡片摘要
date:        z.coerce.date(),
tags:        z.array(z.string()).default([]),
category:    z.string().optional(), // 仅 docs:文档树分组名
image:       z.string().optional(), // 仅 essays:时间线条目配图
draft:       z.boolean().default(false),
```

- 明确不做学习进度条(SYNC_PROGRESS)与文档版本徽章;列表卡片改为显示 `description` 摘要
- 派生数据(构建时计算,`src/lib/`):正文字数 → 预计阅读时长(中文按 400 字/分钟,向上取整);标签 → 计数聚合(标签云、标签页)
- `draft: true` 的文章在 production build 中被过滤
- 占位内容:notes 4 篇、docs 3 组 6 篇、essays 4 篇(含 1 篇配图)。文案沿用原稿示例主题;**配图不外链原稿的 googleusercontent 地址(会过期),改为本地生成的 SVG/渐变占位图,风格贴原稿霓虹气质**

## 7. 阅读体验包(文章/文档详情页)

- **代码高亮**:Shiki(Astro 内置 markdown 渲染),配置双主题 `css-variables` 模式(`defaultColor: false`),高亮色随站点主题经 CSS 变量联动,切换主题无需重渲染
- **代码块增强**:`remark-rehype` 后处理注入头部栏(语言名)+ 复制按钮;点击后图标变 ✓,2 秒还原
- **阅读进度条**:详情页顶部 fixed 2px 细条,宽度 = 滚动进度;`scroll` 监听 `{ passive: true }`,仅详情页挂载
- **预计阅读时长**:显示在标题下方标签行(`~5 MIN`)
- **TOC scrollspy**:详情页右侧目录,`IntersectionObserver` 高亮当前小节,点击平滑滚动
- **返回顶部按钮**:滚动超过一屏出现,easeInOutCubic 平滑滚动(680ms,与 whyself 同曲线)

## 8. 错误处理与降级

| 场景 | 行为 |
|---|---|
| content frontmatter 不符合 schema | 构建失败并报出文件与字段(zod 校验),不允许坏数据上线 |
| 访问不存在路由 | 渲染 `/404` |
| `draft: true` | build 与所有列表查询中过滤 |
| JS 被禁用 | 内容完整可读;主题跟随系统初始值;筛选/复制/进度条/TOC 高亮等增强缺失但不报错(渐进增强) |
| View Transitions 不支持 | 主题即时切换、导航为普通跳转 |
| 字体加载失败 | 字体栈回退系统字体(`system-ui` / `monospace`),布局不塌 |
| 图片缺失/加载慢 | 所有 `<img>` 带 width/height 与明确的 surface 底色,防 CLS |

## 9. 测试与验收

- `astro check`(类型 + 诊断)与 `astro build` 零错误通过
- 路由核对:12 个路由全部可访问,404 生效
- 双主题核对:每个路由在 dark/light 下与原稿视觉气质一致(色彩、字体、装饰效果)
- 响应式核对:375px / 768px / 1280px 三档断点;移动端菜单与 TOC 折叠行为正确
- 动效核对:主题圆形扩散、页面过渡、进度条、scrollspy 在 Chrome 最新版工作;Firefox(Sans View Transitions 的路径)降级正常
- Lighthouse:Performance ≥ 95(首页,桌面)
- `prefers-reduced-motion` 模拟核对

## 10. 范围外(明确不做)

- 全文搜索(Pagefind)、RSS、评论系统
- 学习进度条、文档版本徽章
- 任何需要服务端/Serverless 的功能(Cloudflare Pages 仅作静态托管)
- 深层 i18n 多语言路由
