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

## 三个阶段

预检 → 核心实例化 → 模块加载,每一步失败都立即 panic,绝不带伤进入下一阶段。模块加载放在最后,是为了保证任何 mod 报错时,内核核心已经处于可诊断的状态。
