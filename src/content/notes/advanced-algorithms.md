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
