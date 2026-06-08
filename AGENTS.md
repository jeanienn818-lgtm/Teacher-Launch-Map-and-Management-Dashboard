# Agent 指南 — Onboarding Summit Map 2.5

## 项目是什么

北美新教师 **Onboarding Summit 培训地图**（V2.5）：梯子式主线 + 分支任务、目标收入 Slots 计算器、学习覆盖层与完成庆祝。产品代码只在 `src/v2/`。

## 先读这些文件

1. `PROJECT_MAP.md` — 全量文件对照表
2. `src/App.tsx` — 路由与演示教师
3. `src/v2/page.tsx` — 地图页状态机
4. `src/v2/components/stepMap.tsx` — 中心地图（悬停 Step 箱子展开任务圆）
5. `src/v2/data.ts` — 节点与演示数据

## 默认开发

```bash
npm install
npm run dev -- --port 5179 --strictPort
```

验证地图：`/launch-map`

## 约束

- 用户要求「只改地图」时，仅动 `stepMap.tsx` 与地图相关 CSS，勿改 `data.ts` 任务标题除非明确要求
- 不要提交 `.env` 或密钥
- 遵循现有 V2 class 命名（`--v28`、`--v212` 等）

## 当前地图交互（V2.14+）

- 默认：每步仅显示 **Step 箱子**
- 悬停箱子：显示该步全部主线（大橘圈）+ 非主线（小蓝圈）
- 主线未完成：呼吸动效 `map-hotspot--pulse`
- 离开 `stair-map-shell`：隐藏所有任务
- 悬停其它箱子：切换展示步骤
