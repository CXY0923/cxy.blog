# 站内搜索(QUERY_ARCHIVE)设计

日期:2026-09-01
状态:已确认(交互与检索范围经用户选择,技术路线经用户批准)

## 背景与目标

首页右栏 QUERY_ARCHIVE 面板当前是 `disabled` 占位输入框。目标:做一个真实可用的站内搜索——输入即出结果下拉,点击/回车跳转文章。

## 已确认的决策

- **交互形式**:输入即出结果下拉(不跳结果页)。下拉项含标题、日期、集合标签,命中片段高亮;点击或回车直接跳转。
- **检索范围**:标题 + 摘要 + 正文全文(构建期生成索引,过滤 draft)。
- **技术路线**:构建期 JSON 索引 + 纯原生 TS 子串匹配,零依赖。理由:15 篇量级索引仅几十 KB;`includes` 子串匹配天然支持中文(无需分词);静态部署(Cloudflare Pages)友好;与站点现有 vanilla `<script>` 模式一致。

## 组成

1. **`src/pages/search-index.json.ts`**(构建期端点)
   复用 `getPublished` 过滤草稿,输出 JSON 数组:
   `{ title, description, url, collection, date(ISO), text }`,`text` 为剥离 Markdown 语法后的正文纯文本。
2. **`src/lib/search.ts` + `search.test.ts`**(纯函数,可单测)
   `searchPosts(index, query)`:小写化子串匹配,评分 = 标题命中 ×3 + 摘要 ×2 + 正文 ×1,同分按日期新→旧;空查询返回 `[]`。
3. **`src/components/ui/SearchBox.astro`**(替换首页占位输入框)
   - 玻璃面板下拉,沿用主题令牌,两主题自适应;终端风格空态 `NO_MATCH_FOUND`。
   - 首次聚焦懒加载 `/search-index.json` 并模块级缓存;输入防抖 ~120ms。
   - 键盘:↑↓ 移动高亮、Enter 打开、Esc 关闭;点击外部收起。
4. **`src/pages/index.astro`**(修改)
   右栏 QUERY_ARCHIVE 内的占位 input 换成 `<SearchBox />`。

## 错误处理

索引拉取失败:下拉显示一行错误提示,输入框保持可用,可重试(下次聚焦重新拉取)。

## 范围外

导航栏搜索、`/search/` 独立结果页、模糊/拼音匹配——当前规模不需要,留待文章量增长后再评估。

## 验收

- 中英文关键词均能命中标题/摘要/正文,排序符合评分规则。
- 键盘全流程可用(↑↓ Enter Esc),点击外部收起。
- 明暗两主题下下拉样式正常;`draft` 文章不出现在结果中。
- `vitest run` 通过;`astro build` 通过。
