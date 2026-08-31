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
