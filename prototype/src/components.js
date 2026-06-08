window.App = window.App || {};
const { useMemo } = React;

const {
  useAppState,
  navTo,
  formatStatus,
  contentTypeName,
  priorityPill,
  statusTone,
  buttonLabelForStatus,
} = App.ui;

function Pill({ tone = "strong", children }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function CardTitle({ title, right }) {
  return (
    <div className="row" style={{ alignItems: "baseline" }}>
      <div className="h2">{title}</div>
      {right ? <div className="small muted">{right}</div> : null}
    </div>
  );
}

function GlobalHintBar({ variant = "strong" }) {
  const stage = useAppState((s) => App.Const.stages.find((x) => x.key === s.user.stageKey));
  const starter = useMemo(() => App.store.getStarterPack(), [useAppState((s) => s.user.stageKey), useAppState((s) => s.progress.contentStatus)]);
  const reward = useMemo(() => App.store.getRewardStatus(), [useAppState((s) => s.user.stageKey), useAppState((s) => s.user.growthPointsThisMonth)]);

  let title = "本月优先完成";
  let text = "主修2-3证书、基础Mock、规则学习模块。";
  if (starter.status !== "已完成") {
    title = "新老师起步包未完成";
    text = `建议优先完成起步包（已完成 ${starter.doneCount}/3）。`;
  } else if (!reward.inTop30Reward) {
    title = "前30%奖励进度";
    text = `你距离前30%奖励还差 ${reward.missingPoints} 成长积分。`;
  } else {
    title = "前30%奖励状态";
    text = "你已进入本月同阶段新老师前30%奖励区，继续保持可获得抽奖资格。";
  }

  return (
    <div className={`hintBar ${variant}`}>
      <div className="hintTitle">{title}</div>
      <div className="hintText">
        {text} <span className="subtleLink" onClick={() => navTo("/tasks")}>去看看任务</span>
      </div>
      <div className="pillRow" style={{ marginTop: 8 }}>
        <Pill tone="brand">{stage?.month}</Pill>
        <Pill tone="strong">系统 Tier：{useAppState((s) => s.user.tierKey)}</Pill>
        {starter.status !== "已完成" ? <Pill tone="warn">起步包：{starter.status}</Pill> : <Pill tone="good">起步包：已完成</Pill>}
      </div>
    </div>
  );
}

function BottomTabBar({ activeKey }) {
  return (
    <div className="bottomTabs">
      <div className="bottomTabsInner">
        {App.Const.bottomTabs.map((t) => (
          <button
            key={t.key}
            className={`tabBtn ${activeKey === t.key ? "active" : ""}`}
            onClick={() => navTo(`/${t.key}`)}
          >
            {t.label}
            <span className="sub">{t.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StageStatusCard() {
  const stage = useAppState((s) => App.Const.stages.find((x) => x.key === s.user.stageKey));
  const points = useAppState((s) => s.user.growthPointsThisMonth);
  const reward = useMemo(() => App.store.getRewardStatus(), [points, useAppState((s) => s.user.stageKey)]);

  const rewardLine = reward.inTop30Reward
    ? "已进入前30%奖励区"
    : `距离前30%奖励还差 ${reward.missingPoints} 成长积分`;

  return (
    <div className="card soft" onClick={() => navTo("/tasks", { tab: "by_stage" })} style={{ cursor: "pointer" }}>
      <div className="row">
        <div className="col">
          <div className="h2">当前阶段：{stage?.month}</div>
          <div className="small muted">{stage?.title}</div>
        </div>
        {stage?.key === "M3" ? <Pill tone="purple">Rising Star 成长中</Pill> : <Pill tone="brand">本月目标</Pill>}
      </div>
      <div className="divider" />
      <div className="row">
        <div className="col">
          <div className="small muted">当前成长积分（本月）</div>
          <div className="h2">{points} 分</div>
        </div>
        <div
          className={`pill ${reward.inTop30Reward ? "good" : "warn"}`}
          onClick={(e) => {
            e.stopPropagation();
            navTo("/growth");
          }}
          style={{ cursor: "pointer" }}
        >
          {rewardLine}
        </div>
      </div>
      <div className="btnRow">
        <button className="btn primary" onClick={(e) => (e.stopPropagation(), navTo("/tasks", { tab: "by_stage" }))}>
          去按阶段看任务
        </button>
        <button className="btn ghost" onClick={(e) => (e.stopPropagation(), navTo("/growth"))}>
          去看奖励与成长
        </button>
      </div>
    </div>
  );
}

function IncomeEstimateCard() {
  const tierKey = useAppState((s) => s.user.tierKey);
  const inputs = useAppState((s) => s.income.inputs);
  const result = useMemo(() => App.store.getIncomeEstimate(), [tierKey, inputs]);
  const pbjglr = (inputs.expectedPB || 0) + (inputs.expectedJG || 0) + (inputs.expectedLR || 0);

  return (
    <div className="card strong" onClick={() => navTo("/income")} style={{ cursor: "pointer" }}>
      <div className="row">
        <div className="h2">收入预估</div>
        <Pill tone="strong">系统自动读取 Tier：{tierKey}</Pill>
      </div>
      <div className="row" style={{ marginTop: 10, alignItems: "flex-end" }}>
        <div className="col">
          <div className="small muted">预计总收入</div>
          <div className="money">${result.total}</div>
        </div>
        <div className="col" style={{ alignItems: "flex-end" }}>
          <div className="xs faint">最终收入请以实际对账单为准</div>
          <button className="btn gold" onClick={(e) => (e.stopPropagation(), navTo("/income"))}>
            查看和调整预估
          </button>
        </div>
      </div>
      <div className="pillRow">
        <Pill tone="brand">本月预计完课 {inputs.expectedClasses} 节</Pill>
        <Pill tone="strong">预计转化 {inputs.expectedConversions} 单</Pill>
        <Pill tone="purple">PB/JG/LR 共 {pbjglr} 节</Pill>
      </div>
    </div>
  );
}

function TaskCard({ task, compact = false, onOpen }) {
  const state = useAppState((s) => s);
  const status = state.progress.taskStatus[task.id] || "not_started";
  const pp = priorityPill(task.priority);

  const action = buttonLabelForStatus(status);
  const open = () => {
    if (onOpen) return onOpen(task);
    // 默认：打开对应内容详情 / 规则模块详情指向相关页
    if (task.id === "task-rule-pack") return navTo("/dino-u");
    if (task.contentId) return navTo("/content", { id: task.contentId });
    return navTo("/tasks");
  };

  return (
    <div className="taskCard">
      <div className="taskTop">
        <div style={{ flex: 1 }}>
          <div className="taskName">{task.name}</div>
          <div className="taskMeta">
            {contentTypeName(task.type)} · <span className="muted">{task.stageKeys.map((k) => App.Const.stages.find((s) => s.key === k)?.month).filter(Boolean).join("/")}</span>
          </div>
        </div>
        <div className="col" style={{ alignItems: "flex-end", gap: 8 }}>
          <Pill tone={pp.tone}>{pp.label}</Pill>
          <Pill tone={statusTone(status)}>{formatStatus(status)}</Pill>
        </div>
      </div>
      {!compact ? (
        <>
          <div className="taskReason">{task.reason}</div>
          <div className="taskReason">完成收益：{task.benefit}</div>
        </>
      ) : null}
      <div className="taskFooter">
        <div className="points">+{task.points} 成长积分</div>
        <button className="btn primary" onClick={open}>
          {action}
        </button>
      </div>
    </div>
  );
}

function TopThreeTasksCardGroup() {
  const tasks = useMemo(() => App.store.getTopThreeTasks(), [useAppState((s) => s.user.stageKey), useAppState((s) => s.progress.contentStatus), useAppState((s) => s.user.growthPointsThisMonth)]);

  return (
    <div className="card">
      <CardTitle title="你现在先做这 3 件事" right="永远只展示 3 个" />
      <div className="small muted" style={{ marginTop: 6 }}>
        先做“最该做什么”，培训形式是次要信息。
      </div>
      <div className="divider" />
      <div className="list">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

function StarterPackCard() {
  const starter = useMemo(() => App.store.getStarterPack(), [useAppState((s) => s.progress.contentStatus)]);
  const stageKey = useAppState((s) => s.user.stageKey);
  const isM0 = stageKey === "M0";

  const missing = [];
  const s = useAppState((x) => x.progress.contentStatus);
  if (!starter.certOk) missing.push("主修2-3证书");
  if (!starter.mockOk) missing.push("基础Mock：主修试听 Lv2-3");
  if (!starter.ruleOk) missing.push("规则学习模块");

  return (
    <div className={`card ${isM0 ? "highlight" : ""}`} onClick={() => navTo("/starter-pack")} style={{ cursor: "pointer" }}>
      <div className="row">
        <div className="h2">新老师起步包</div>
        <Pill tone={starter.status === "已完成" ? "good" : starter.status === "部分完成" ? "warn" : "bad"}>{starter.status}</Pill>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <div className="col">
          <div className="small muted">进度</div>
          <div className="h2">
            已完成 {starter.doneCount} / {starter.total} 项
          </div>
          <div className="small muted" style={{ marginTop: 2 }}>
            {missing.length ? `还差：${missing.join("、")}` : "已完成全部起步包内容"}
          </div>
        </div>
        <button className={`btn ${starter.status === "已完成" ? "ghost" : "primary"}`} onClick={(e) => (e.stopPropagation(), navTo("/starter-pack"))}>
          {starter.status === "已完成" ? "去查看" : "去完成"}
        </button>
      </div>
    </div>
  );
}

function RewardStatusCard({ variant = "card" }) {
  const reward = useMemo(() => App.store.getRewardStatus(), [useAppState((s) => s.user.growthPointsThisMonth), useAppState((s) => s.user.stageKey)]);
  const topTasks = useMemo(() => App.store.getTopThreeTasks(), [useAppState((s) => s.user.stageKey), useAppState((s) => s.progress.contentStatus), useAppState((s) => s.user.growthPointsThisMonth)]);
  const rec = topTasks[0]?.name;

  const body = reward.inTop30Reward ? (
    <>
      <div className="h3">你已进入本月同阶段新老师前30%奖励区</div>
      <div className="small muted" style={{ marginTop: 6 }}>
        继续保持，可获得抽奖资格。
      </div>
    </>
  ) : (
    <>
      <div className="h3">你距离前30%奖励还差 {reward.missingPoints} 成长积分</div>
      <div className="small muted" style={{ marginTop: 6 }}>
        推荐优先完成：{rec || "高成长积分任务"}
      </div>
    </>
  );

  if (variant === "inline") return body;

  return (
    <div className="card highlight" onClick={() => navTo("/growth")} style={{ cursor: "pointer" }}>
      <div className="row">
        <div className="h2">前30%奖励提醒</div>
        <Pill tone="warn">奖励</Pill>
      </div>
      <div className="divider" />
      {body}
      <div className="btnRow">
        <button className="btn gold block" onClick={(e) => (e.stopPropagation(), navTo("/growth"))}>
          去看我的奖励与成长
        </button>
      </div>
    </div>
  );
}

function RecentProgressCardList() {
  const items = useAppState((s) => (s.progress.timeline || []).slice(0, 3));
  return (
    <div className="card soft" onClick={() => navTo("/growth")} style={{ cursor: "pointer" }}>
      <CardTitle title="最近成长记录" right="最近 1–3 条" />
      <div className="divider" />
      <div className="list">
        {items.map((it, idx) => (
          <div key={idx} className="timelineItem">
            <div className="row">
              <div className="small muted">{it.at}</div>
              <div className="points">+{it.points} 分</div>
            </div>
            <div style={{ marginTop: 4, fontWeight: 900 }}>{it.text}</div>
            {it.badge ? <div className="small muted" style={{ marginTop: 4 }}>{it.badge}</div> : null}
          </div>
        ))}
      </div>
      <div className="btnRow">
        <button className="btn ghost block" onClick={(e) => (e.stopPropagation(), navTo("/growth"))}>
          查看全部成长记录
        </button>
      </div>
    </div>
  );
}

function SegmentedTabs({ value, onChange, leftLabel, rightLabel }) {
  return (
    <div className="segTabs" role="tablist" aria-label="学习任务切换">
      <button className={`segTab ${value === "by_stage" ? "active" : ""}`} onClick={() => onChange("by_stage")}>
        {leftLabel}
      </button>
      <button className={`segTab ${value === "by_goal" ? "active" : ""}`} onClick={() => onChange("by_goal")}>
        {rightLabel}
      </button>
    </div>
  );
}

function ContentCard({ content, onOpen }) {
  const status = useAppState((s) => s.progress.contentStatus[content.id] || "not_started");
  const typeName = contentTypeName(content.type);
  const open = () => (onOpen ? onOpen(content) : navTo("/content", { id: content.id }));

  return (
    <div className="taskCard" onClick={open} style={{ cursor: "pointer" }}>
      <div className="taskTop">
        <div style={{ flex: 1 }}>
          <div className="taskName">{content.name}</div>
          <div className="taskMeta">
            {typeName} · 适合：{(content.suitableStages || []).map((k) => App.Const.stages.find((s) => s.key === k)?.month).filter(Boolean).join("/")}
          </div>
        </div>
        <div className="col" style={{ alignItems: "flex-end", gap: 8 }}>
          <Pill tone={statusTone(status)}>{formatStatus(status)}</Pill>
          <div className="points">+{content.points} 分</div>
        </div>
      </div>
      <div className="taskReason">{content.short}</div>
      <div className="pillRow">
        {(content.tags || []).slice(0, 3).map((t) => (
          <Pill key={t} tone={t.includes("必备") ? "warn" : t.includes("热门") ? "brand" : "strong"}>
            {t}
          </Pill>
        ))}
      </div>
      <div className="btnRow">
        <button className="btn primary block" onClick={(e) => (e.stopPropagation(), open())}>
          {buttonLabelForStatus(status)}
        </button>
      </div>
    </div>
  );
}

function BadgeWall() {
  const badges = useAppState((s) => s.progress.badges);
  const groups = [
    { key: "certificate", title: "证书勋章" },
    { key: "mock", title: "Mock 勋章" },
    { key: "workshop", title: "Workshop 勋章" },
    { key: "dinoU", title: "Dino U 勋章" },
  ];

  return (
    <div className="card soft">
      <CardTitle title="勋章墙" right="完成内容即可点亮" />
      <div className="divider" />
      <div className="list">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="h3" style={{ marginBottom: 8 }}>
              {g.title}
            </div>
            <div className="badgeGrid">
              {(badges[g.key] || []).length ? (
                (badges[g.key] || []).slice(0, 6).map((cid) => {
                  const c = App.util.getContentById(cid);
                  return (
                    <div key={cid} className="badge badgeOn" onClick={() => navTo("/content", { id: cid })} style={{ cursor: "pointer" }}>
                      <div className="badgeName">{c?.name || "已点亮"}</div>
                      <div className="badgeMeta">已点亮</div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="badge">
                    <div className="badgeName">未点亮</div>
                    <div className="badgeMeta">完成相关内容</div>
                  </div>
                  <div className="badge">
                    <div className="badgeName">未点亮</div>
                    <div className="badgeMeta">完成相关内容</div>
                  </div>
                  <div className="badge">
                    <div className="badgeName">未点亮</div>
                    <div className="badgeMeta">完成相关内容</div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrowthTimeline() {
  const items = useAppState((s) => s.progress.timeline || []);
  return (
    <div className="card soft">
      <CardTitle title="成长记录时间轴" right="最近 20 条" />
      <div className="divider" />
      <div className="list">
        {items.map((it, idx) => (
          <div key={idx} className="timelineItem">
            <div className="row">
              <div className="small muted">{it.at}</div>
              <div className="points">+{it.points} 分</div>
            </div>
            <div style={{ marginTop: 4, fontWeight: 900 }}>{it.text}</div>
            {it.badge ? <div className="small muted" style={{ marginTop: 4 }}>{it.badge}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function IncomeBreakdownCard({ breakdown }) {
  return (
    <div className="card soft">
      <CardTitle title="收入构成（预估）" right="仅供参考" />
      <div className="divider" />
      <div className="tableRow">
        <div className="k">Base（完课 × 7）</div>
        <div className="v">${breakdown.base}</div>
      </div>
      <div className="tableRow">
        <div className="k">Tier incentive（分段）</div>
        <div className="v">${breakdown.tierIncentive}</div>
      </div>
      <div className="tableRow">
        <div className="k">Convert incentive（转化 × 5）</div>
        <div className="v">${breakdown.convertIncentive}</div>
      </div>
      <div className="tableRow">
        <div className="k">PB/JG/LR incentive（合计 × 2）</div>
        <div className="v">${breakdown.extraIncentive}</div>
      </div>
      <div className="divider" />
      <div className="tableRow">
        <div className="k">预计总收入</div>
        <div className="v" style={{ fontSize: 18 }}>${breakdown.total}</div>
      </div>
      <div className="small muted" style={{ marginTop: 8 }}>
        以下为预估收入，仅供参考。最终收入请以实际对账单为准。
      </div>
    </div>
  );
}

App.components = {
  Pill,
  CardTitle,
  GlobalHintBar,
  BottomTabBar,
  StageStatusCard,
  IncomeEstimateCard,
  TopThreeTasksCardGroup,
  StarterPackCard,
  RewardStatusCard,
  RecentProgressCardList,
  SegmentedTabs,
  TaskCard,
  ContentCard,
  BadgeWall,
  GrowthTimeline,
  IncomeBreakdownCard,
};
