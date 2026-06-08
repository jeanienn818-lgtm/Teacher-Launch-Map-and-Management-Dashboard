# Onboarding Summit Map 2.5 — 项目文件地图

> 自 `na-new-teacher-map` 整理迁移（2026-05）。活跃产品代码在 **`src/v2/`**；`prototype/` 与 `src/prototype/` 为早期静态原型，不参与主应用构建。

## 技术栈

| 项 | 说明 |
|----|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 路由 | 无 React Router；`App.tsx` 用 `history` + pathname 切换 |
| 文档解析 | mammoth（学习材料 DOCX） |

## 路由与入口

| 路径 | 页面 | 入口组件 |
|------|------|----------|
| `/` → 重定向 `/portal-home` | 教师门户首页 | `TeacherPortalHomePage` |
| `/portal-home` | 同上 | `src/v2/portal/TeacherPortalHomePage.tsx` |
| `/launch-map` | 培训地图仪表盘 | `TeacherTrainingDashboardV2` → `src/v2/page.tsx` |

**根入口链：** `index.html` → `src/main.tsx` → `src/App.tsx`

## 架构总览

```
App.tsx
├── /portal-home → TeacherPortalHomePage
└── /launch-map  → TeacherTrainingDashboardV2 (page.tsx)
        ├── DashboardLayout
        ├── PageHeader + DemoTeacherSwitcher
        ├── left: TargetIncomePlannerPanel（Slots 计算器）
        ├── center: StepMapSection（梯子地图 · 悬停箱子展开任务）
        ├── right: NextStep / Reward / QuickLinks / MoreActions
        ├── NodeDetailDrawer
        ├── LearningOverlay
        ├── CelebrationLayer
        └── StickyGuideBar（首次引导）
```

## 核心目录 `src/v2/`

### 页面与布局

| 文件 | 职责 |
|------|------|
| `page.tsx` | 地图页主状态：节点完成、抽屉、学习、庆祝、引导阶段 |
| `DashboardLayout.tsx` | 三栏布局壳 |
| `portal/TeacherPortalHomePage.tsx` | 门户首页、进入地图 CTA |
| `types.ts` | `FlowNode`、`TeacherSnapshot`、状态枚举 |
| `data.ts` | 节点图数据、演示教师预设、`DEMO_TEACHER_PRESETS` |
| `utils.ts` | 进度、Best next、成长分、推荐逻辑 |
| `tierIncentive.ts` | Tier 标签与激励档位 |
| `launchGuideSession.ts` | 首次引导 session 标记 |
| `stairLayout.ts` | 梯子几何、台阶百分比布局 |
| `mapTooltip.ts` | 地图 hover 浮层定位 |
| `mapCallout.ts` | 下一步 callout 文案 |
| `styles.css` | **全部 V2 UI 样式**（含地图、计算器、Peak 卡片） |

### 中心地图（最近交互：悬停 Step 箱子展开任务）

| 文件 | 职责 |
|------|------|
| `components/stepMap.tsx` | 梯子 SVG、Step 箱子、悬停揭示主线/分支圆点、tooltip |
| `components/MapProgressFooter.tsx` | 地图底部进度条（若启用） |

**步骤与任务映射（`stepMap.tsx`）：**

| Step | 箱子标签 (`MAIN_STEP_CATEGORIES`) | 主线 | 非主线 |
|------|-----------------------------------|------|--------|
| 1 | Basic Certificate | `mainNodes[0]` | Profile（`dinoAboveStep1`） |
| 2 | Workshop 1 | `mainNodes[1]` | Dino U（`dinoAboveStep2` + 装饰） |
| 3 | … | `mainNodes[2]` | Optional mock |
| 4 | … | `mainNodes[3]` | Workshop 分支（step4） |
| 5 | Workshop2 | `mainNodes[4]` | Workshop 分支（step5） |
| 6 | Peak Summit | `summitNode` | 无 |

### 左侧栏

| 文件 | 职责 |
|------|------|
| `components/left.tsx` | 目标收入 → Slots 计算器、Peak-time 风格 UI |
| `components/hint.tsx` | 提示组件 |

### 右侧栏

| 文件 | 职责 |
|------|------|
| `components/right.tsx` | Next step、奖励、快捷链接、更多收入方式 |
| `components/HonorWallPanel.tsx` | 荣誉墙 |
| `components/TierDetailsModal.tsx` | Tier 详情弹窗 |

### 通用 UI

| 文件 | 职责 |
|------|------|
| `components/PageHeader.tsx` | 顶栏、演示教师切换入口 |
| `components/DemoTeacherSwitcher.tsx` | Jamie / David / Avery 三档演示 |
| `components/nodeDrawer.tsx` | 节点详情抽屉 |
| `components/StatusBadge.tsx` | 状态徽章 |
| `components/StickyGuideBar.tsx` | 粘性引导条 |
| `components/CelebrationLayer.tsx` | 完成任务庆祝层 |

### 学习流

| 文件 | 职责 |
|------|------|
| `learning/LearningOverlay.tsx` | 学习覆盖层路由 |
| `learning/types.ts` | 学习路由、材料判定 |
| `learning/materialPaths.ts` | 静态资源路径 |
| `learning/DinoTprLearningView.tsx` | Dino TPR 学习页 |
| `learning/DinoVideoOnlyLearningView.tsx` | 纯视频学习 |
| `learning/CertificateStep2LearningView.tsx` | 证书 Step2 |
| `learning/dinoTprStaticContent.tsx` | TPR 静态内容 |

### 庆祝与音效

| 文件 | 职责 |
|------|------|
| `celebration/resolveCelebration.ts` | 庆祝等级与文案 |
| `sounds/playTaskCompletionSound.ts` | 完成音效 |

## 根级 `src/`（非 v2）

| 文件 | 职责 |
|------|------|
| `App.tsx` | 双路由、演示教师 session、`demoTeacherId` |
| `main.tsx` | React 挂载 |
| `index.css` | 全局基础样式 |
| `prototype/*` | 旧原型 TS 副本（未挂到主路由） |

## 静态资源 `public/`

| 路径 | 用途 |
|------|------|
| `public/favicon.svg` | 站点图标 |
| `public/icons.svg` | 图标精灵 |
| `public/learning/README.md` | 学习视频/材料放置说明 |
| `public/Materials/README.md` | DOCX/PPT 等材料说明 |

> 实际媒体文件需按 README 放入对应目录；构建时复制到 `dist/`。

## 独立原型 `prototype/`（Vanilla JS）

| 文件 | 说明 |
|------|------|
| `prototype/index.html` | 独立打开的原型页 |
| `prototype/src/app.js` | 原型应用逻辑 |
| `prototype/src/data.js` | 原型数据 |
| `prototype/src/components.js` | UI 组件 |
| `prototype/src/pages.js` | 页面 |
| `prototype/src/store.js` | 状态 |
| `prototype/src/styles.css` | 样式 |

## 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 依赖与脚本 |
| `vite.config.ts` | Vite + React 插件 |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | TS 工程 |
| `eslint.config.js` | ESLint |
| `index.html` | HTML 入口 |

## 常用命令

```bash
cd "/Users/jennysun/Onboarding Summit Map 2.5"
npm install
npm run dev -- --port 5179 --strictPort
# 地图页: http://localhost:5179/launch-map
# 门户:   http://localhost:5179/portal-home
npm run build
```

## 演示教师（`data.ts`）

| ID | 档位 | 说明 |
|----|------|------|
| `tier1-jamie` | Tier 1 | 48 课完成度示例 |
| `tier2-david` | Tier 2 | 145 课 |
| `tier3-avery` | Tier 3 | 328 课 |

选择结果写入 `sessionStorage`，由 `App.tsx` 传入地图页。

## 修改时注意

- **改地图交互** → `stepMap.tsx` + `styles.css`（`.map-step-*`）
- **改任务/进度数据** → `data.ts`（影响抽屉、学习、右侧推荐）
- **改 Slots 计算器** → `left.tsx` + `styles.css`（`.slot-planner-*`）
- **不要**为改地图去改 `prototype/` 除非同步原型演示

## 源项目路径

迁移前：`/Users/jennysun/na-new-teacher-map`
