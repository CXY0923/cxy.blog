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
