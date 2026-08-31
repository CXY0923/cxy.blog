---
title: '[草稿夹具] 不得出现在产物'
description: getPublished draft 过滤门的回归夹具——集合应收录本条目,渲染前应将其过滤。
date: 2026-08-31
draft: true
---

此文件是 draft 过滤的测试夹具:内容加载器应把本条目收进 essays 集合,而 `getPublished` 应在任何列表/详情渲染前将其排除——`dist/` 中不应存在对应页面。
