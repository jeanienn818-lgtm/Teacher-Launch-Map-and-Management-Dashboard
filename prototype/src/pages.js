window.App = window.App || {};

const { useMemo } = React;
const { useAppState, navTo, useRoute, formatStatus, contentTypeName, stageProgressForCurrentStage } = App.ui;
const {
  GlobalHintBar,
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
  Pill,
  CardTitle,
} = App.components;

function PageHeader({ title, right }) {
  return (
    <div className="pageTitleRow">
      <div className="pageTitle">{title}</div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

function Section({ title, desc, children, right }) {
  return (
    <div className="card soft">
      <div className="row" style={{ alignItems: "baseline" }}>
        <div className="h2">{title}</div>
        {right ? right : null}
      </div>
      {desc ? (
        <div className="small muted" style={{ marginTop: 6 }}>
          {desc}
        </div>
      ) : null}
      <div className="divider" />
      {children}
    </div>
  );
}

function HomePage() {
  const stageKey = useAppState((s) => s.user.stageKey);
  const stage = App.Const.stages.find((x) => x.key === stageKey);
  const cycleStage = () => {
    const idx = App.Const.stages.findIndex((s) => s.key === stageKey);
    const next = App.Const.stages[(idx + 1) % App.Const.stages.length];
    App.store.setStage(next.key);
  };

  return (
    <div className="container topSafe">
      <PageHeader
        title="首页"
        right={
          <button className="btn ghost" onClick={cycleStage} style={{ padding: "8px 10px", borderRadius: 12 }}>
            演示：切换到 {App.Const.stages[(App.Const.stages.findIndex((s) => s.key === stageKey) + 1) % 4].month}
          </button>
        }
      />

      <GlobalHintBar />

      {/* 1. 当前阶段卡 */}
      <StageStatusCard />

      {/* 2. 收入预估卡 */}
      <IncomeEstimateCard />

      {/* 3. 你现在先做这3件事 */}
      <TopThreeTasksCardGroup />

      {/* 4. 新老师起步包状态 */}
      <StarterPackCard />

      {/* 5. 前30%奖励提醒 */}
      <RewardStatusCard />

      {/* 6. 最近成长记录 */}
      <RecentProgressCardList />

      <div style={{ marginTop: 12 }} className="small faint">
        说明：这是交互原型（假数据）。Tier 为系统自动读取，不能手动修改。
      </div>
    </div>
  );
}

function TasksPage() {
  const route = useRoute();
  const qsTab = route.query.tab;
  const storedTab = useAppState((s) => s.ui.tasksTab);
  const tab = qsTab === "by_goal" || qsTab === "by_stage" ? qsTab : storedTab;
  const stageKey = useAppState((s) => s.user.stageKey);
  const stage = App.Const.stages.find((x) => x.key === stageKey);
  const state = useAppState((s) => s);

  const progress = useMemo(() => stageProgressForCurrentStage(state), [state.user.stageKey, state.progress.taskStatus]);

  const stageTasks = useMemo(() => {
    const all = App.FakeDB.tasks.filter((t) => t.stageKeys.includes(stageKey));
    const toList = (p) => all.filter((t) => t.priority === p);
    return { must: toList("must"), strong: toList("strong"), recommended: toList("recommended") };
  }, [stageKey]);

  const selectedGoalKey = useAppState((s) => s.ui.selectedGoalKey);
  const goalTasks = useMemo(() => {
    const all = App.FakeDB.tasks.filter((t) => (t.goalKeys || []).includes(selectedGoalKey));
    const score = (t) => (t.priority === "must" ? 3 : t.priority === "strong" ? 2 : 1) + (t.stageKeys.includes(stageKey) ? 0.6 : 0);
    const dedup = new Map();
    for (const t of all) dedup.set(t.id, t);
    return Array.from(dedup.values())
      .sort((a, b) => score(b) - score(a))
      .map((t) => ({ ...t, why: t.reason, suit: t.stageKeys.map((k) => App.Const.stages.find((s) => s.key === k)?.month).filter(Boolean).join("/") }));
  }, [selectedGoalKey, stageKey]);

  useMemo(() => {
    if (tab !== storedTab) App.store.setTasksTab(tab);
  }, [tab]);

  return (
    <div className="container topSafe">
      <div className="stickyTop">
        <PageHeader title="学习任务" right={<span className="small muted">当前：{stage?.month}</span>} />
        <GlobalHintBar variant="strong" />
        <SegmentedTabs
          value={tab}
          onChange={(v) => {
            App.store.setTasksTab(v);
            navTo("/tasks", { tab: v });
          }}
          leftLabel="按阶段看"
          rightLabel="按目标找"
        />
        <div style={{ height: 10 }} />
      </div>

      {tab === "by_stage" ? (
        <>
          <div className="card soft">
            <div className="row">
              <div className="col">
                <div className="h2">{stage?.month} · {stage?.title}</div>
                <div className="small muted">阶段目标：{stage?.goal}</div>
              </div>
              <div className="col" style={{ alignItems: "flex-end" }}>
                <Pill tone="brand">完成率 {progress.pct}%</Pill>
                <div className="xs faint" style={{ marginTop: 4 }}>
                  {progress.done}/{progress.total} 已完成
                </div>
              </div>
            </div>
          </div>

          <Section title="必做" desc="优先完成这些任务，帮助你快速站稳脚跟。">
            <div className="list">{stageTasks.must.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          </Section>
          <Section title="强烈建议" desc="高性价比任务：对订课机会与表现提升更明显。">
            <div className="list">{stageTasks.strong.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          </Section>
          <Section title="推荐完成" desc="在完成必做/强烈建议后，按节奏补齐。">
            <div className="list">{stageTasks.recommended.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          </Section>

          <div className="card soft">
            <CardTitle title="更多入口（次级）" right="不抢第一视觉" />
            <div className="divider" />
            <div className="grid2">
              <button className="btn primary" onClick={() => navTo("/certificates")}>查看全部证书</button>
              <button className="btn primary" onClick={() => navTo("/mock")}>查看全部 Mock</button>
              <button className="btn primary" onClick={() => navTo("/workshops")}>查看全部 Workshops</button>
              <button className="btn primary" onClick={() => navTo("/dino-u")}>查看全部 Dino U</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="card soft">
            <div className="h2">按目标找</div>
            <div className="small muted" style={{ marginTop: 6 }}>
              先看“我该做什么”，结果按推荐优先级排序（不是按培训形式）。
            </div>
            <div className="pillRow">
              {App.Const.goals.map((g) => (
                <button
                  key={g.key}
                  className={`btn ${selectedGoalKey === g.key ? "primary" : "ghost"}`}
                  style={{ borderRadius: 999, padding: "8px 10px" }}
                  onClick={() => App.store.setSelectedGoal(g.key)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <Section title="推荐结果" desc="按推荐任务优先级展示：必做 > 强烈建议 > 推荐；同时考虑当前阶段匹配。">
            <div className="list">
              {goalTasks.map((t) => (
                <div key={t.id} className="taskCard">
                  <div className="taskTop">
                    <div style={{ flex: 1 }}>
                      <div className="taskName">{t.name}</div>
                      <div className="taskMeta">
                        类型：{contentTypeName(t.type)} · 适合阶段：{t.suit}
                      </div>
                      <div className="taskReason">为什么推荐：{t.why}</div>
                      <div className="taskReason">完成收益：{t.benefit}</div>
                    </div>
                    <div className="col" style={{ alignItems: "flex-end", gap: 8 }}>
                      <Pill tone={App.ui.priorityPill(t.priority).tone}>{App.ui.priorityPill(t.priority).label}</Pill>
                      <Pill tone={App.ui.statusTone(state.progress.taskStatus[t.id] || "not_started")}>{formatStatus(state.progress.taskStatus[t.id] || "not_started")}</Pill>
                    </div>
                  </div>
                  <div className="taskFooter">
                    <div className="points">+{t.points} 成长积分</div>
                    <button className="btn primary" onClick={() => (t.id === "task-rule-pack" ? navTo("/dino-u") : t.contentId ? navTo("/content", { id: t.contentId }) : navTo("/tasks"))}>
                      去完成
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function GrowthPage() {
  const stageKey = useAppState((s) => s.user.stageKey);
  const stage = App.Const.stages.find((x) => x.key === stageKey);
  const pointsAll = useAppState((s) => s.user.growthPointsAllTime);
  const pointsMonth = useAppState((s) => s.user.growthPointsThisMonth);
  const reward = useMemo(() => App.store.getRewardStatus(), [pointsMonth, stageKey]);
  const isM3 = stageKey === "M3";
  const starter = useMemo(() => App.store.getStarterPack(), [useAppState((s) => s.progress.contentStatus)]);

  return (
    <div className="container topSafe">
      <PageHeader title="我的成长" right={<button className="btn ghost" onClick={() => App.store.resetAll()} style={{ padding: "8px 10px" }}>重置演示数据</button>} />

      {/* 1. 成长积分总览 */}
      <div className="card soft">
        <div className="row">
          <div className="col">
            <div className="small muted">当前累计成长积分</div>
            <div className="money">{pointsAll}</div>
          </div>
          <div className="col" style={{ alignItems: "flex-end" }}>
            <div className="small muted">本月成长积分</div>
            <div className="money">{pointsMonth}</div>
          </div>
        </div>
        <div className="pillRow">
          <Pill tone="brand">{stage?.month}</Pill>
          <Pill tone={starter.status === "已完成" ? "good" : "warn"}>起步包：{starter.status}</Pill>
        </div>
      </div>

      {/* 2. 前30%奖励状态 */}
      <div className="card highlight" onClick={() => navTo("/tasks")} style={{ cursor: "pointer" }}>
        <div className="row">
          <div className="h2">前30%奖励状态</div>
          <Pill tone="warn">奖励</Pill>
        </div>
        <div className="divider" />
        {reward.inTop30Reward ? (
          <>
            <div className="h3">已进入前30%奖励区</div>
            <div className="small muted" style={{ marginTop: 6 }}>继续完成高影响力任务，保持排名。</div>
          </>
        ) : (
          <>
            <div className="h3">距离前30%奖励还差 {reward.missingPoints} 分</div>
            <div className="small muted" style={{ marginTop: 6 }}>
              建议：再完成某项证书 / Mock / 主题学习，可更快提升排名。
            </div>
          </>
        )}
        <div className="btnRow">
          <button className="btn gold block" onClick={(e) => (e.stopPropagation(), navTo("/tasks"))}>去完成推荐任务</button>
        </div>
      </div>

      {/* 3. Rising Star 状态 */}
      <div className="card soft">
        <div className="row">
          <div className="h2">Rising Star 状态</div>
          {isM3 ? <Pill tone="purple">Rising Star 成长中</Pill> : <Pill tone="strong">灰态</Pill>}
        </div>
        <div className="divider" />
        {isM3 ? (
          <div className="small muted">你处于 Month3：持续完成高成长积分任务，冲刺 Rising Star 标签。</div>
        ) : (
          <div className="small muted">继续成长，向 Rising Star 前进（Month3 将重点展示）。</div>
        )}
      </div>

      {/* 4. 勋章墙 */}
      <BadgeWall />

      {/* 5. 成长记录时间轴 */}
      <GrowthTimeline />
    </div>
  );
}

function IncomeDetailPage() {
  const tierKey = useAppState((s) => s.user.tierKey);
  const inputs = useAppState((s) => s.income.inputs);
  const breakdown = useMemo(() => App.store.getIncomeEstimate(), [tierKey, inputs]);

  const update = (k) => (e) => App.store.setIncomeInputs({ [k]: App.util.clampInt(e.target.value) });

  return (
    <div className="container topSafe">
      <PageHeader title="收入预估详情" right={<button className="btn ghost" onClick={() => navTo("/home")} style={{ padding: "8px 10px" }}>返回首页</button>} />

      {/* 1. 收入预估器主区 */}
      <div className="card strong">
        <div className="row">
          <div className="h2">收入预估器</div>
          <Pill tone="strong">Tier（系统自动）：{tierKey}</Pill>
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>
          可调整字段：本月预计完课量、预计转化、PB/JG/LR。Tier 不可手动修改。
        </div>
        <div className="divider" />
        <div className="grid2">
          <div>
            <div className="small muted">本月预计完课量</div>
            <input className="input" inputMode="numeric" value={inputs.expectedClasses} onChange={update("expectedClasses")} />
          </div>
          <div>
            <div className="small muted">本月预计试听转化单数</div>
            <input className="input" inputMode="numeric" value={inputs.expectedConversions} onChange={update("expectedConversions")} />
          </div>
          <div>
            <div className="small muted">本月预计 PB 课量</div>
            <input className="input" inputMode="numeric" value={inputs.expectedPB} onChange={update("expectedPB")} />
          </div>
          <div>
            <div className="small muted">本月预计 JG 课量</div>
            <input className="input" inputMode="numeric" value={inputs.expectedJG} onChange={update("expectedJG")} />
          </div>
          <div>
            <div className="small muted">本月预计 LR 课量</div>
            <input className="input" inputMode="numeric" value={inputs.expectedLR} onChange={update("expectedLR")} />
          </div>
          <div>
            <div className="small muted">预计总收入</div>
            <div className="money">${breakdown.total}</div>
            <div className="xs faint">实际收入以对账单为准</div>
          </div>
        </div>
      </div>

      {/* 2. 收入构成结果区 */}
      <IncomeBreakdownCard breakdown={breakdown} />

      {/* 3. 提升收入与机会的关键动作 */}
      <div className="card soft">
        <CardTitle title="提升收入与机会的关键动作" right="建议优先级不分先后" />
        <div className="divider" />
        <div className="list">
          {[
            { t: "拿更多高价值证书", d: "扩大可授课范围，增加订课机会。", to: "/certificates" },
            { t: "提升试听转化", d: "转化激励直接影响预估收入，且带来更多机会。", to: "/tasks?tab=by_goal" },
            { t: "多完课", d: "完课量是收入的底盘（Base）。", to: "/tasks" },
            { t: "多考取 PB / JG / LR 对应证书", d: "额外激励与机会提示更明显。", to: "/certificates" },
            { t: "完成基础 Mock 和进阶 Mock", d: "表现更稳、积分更高，冲刺奖励更快。", to: "/mock" },
          ].map((x) => (
            <div key={x.t} className="taskCard">
              <div className="taskName">{x.t}</div>
              <div className="taskReason">{x.d}</div>
              <div className="btnRow">
                <button className="btn primary" onClick={() => navTo(x.to.split("?")[0], x.to.includes("?") ? { tab: "by_goal" } : undefined)}>
                  去查看相关任务
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 会影响收入与机会的提醒 */}
      <div className="card soft">
        <CardTitle title="会影响收入与机会的提醒" right="温和提醒" />
        <div className="divider" />
        <div className="small muted">
          取消、缺勤、投诉、迟到等会造成课酬扣减，并影响后续订课机会。实际收入请以对账单为准。
        </div>
      </div>

      {/* 5. 机会提示区 */}
      <div className="card soft">
        <CardTitle title="机会提示" right="把“机会”说清楚" />
        <div className="divider" />
        <div className="list">
          <div className="taskCard">
            <div className="taskName">证书与订课机会关系</div>
            <div className="taskReason">证书覆盖越广，可获得的订课池越大；热门证书对“高价值课”更有帮助。</div>
            <button className="btn primary" onClick={() => navTo("/certificates")}>去看证书</button>
          </div>
          <div className="taskCard">
            <div className="taskName">PPT 核心时段的重要性</div>
            <div className="taskReason">稳定出勤与准时会影响机会分配，建议提前规划与备课。</div>
            <button className="btn ghost" onClick={() => navTo("/content", { id: "dino-income-risk" })}>查看相关内容</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarterPackDetailPage() {
  const starter = useMemo(() => App.store.getStarterPack(), [useAppState((s) => s.progress.contentStatus)]);
  const s = useAppState((x) => x.progress.contentStatus);
  const cert = App.util.getContentById("cert-core-2-3");
  const mock = App.util.getContentById("mock-trial-2-3");
  const kickoff = App.util.getContentById("workshop-kickoff");
  const portal = App.util.getContentById("dino-portal-intro");
  const cancel = App.util.getContentById("dino-cancellation-video");

  const ruleDone = starter.ruleOk;
  const ruleMissing = ruleDone ? "已完成" : s["workshop-kickoff"] === "not_started" ? "优先：Kick Off（方式一）或补齐 Dino U 两项（方式二）" : "继续完成方式一/二之一";

  return (
    <div className="container topSafe">
      <PageHeader title="新老师起步包" right={<button className="btn ghost" onClick={() => navTo("/home")} style={{ padding: "8px 10px" }}>返回首页</button>} />

      <div className="card highlight">
        <div className="row">
          <div className="h2">起步包说明</div>
          <Pill tone={starter.status === "已完成" ? "good" : starter.status === "部分完成" ? "warn" : "bad"}>{starter.status}</Pill>
        </div>
        <div className="small muted" style={{ marginTop: 8 }}>
          起步包固定 3 项。完成后系统会自动给出“下一步建议”，帮助你快速进入稳定增长节奏。
        </div>
        <div className="pillRow">
          <Pill tone="brand">已完成 {starter.doneCount}/3</Pill>
          <Pill tone="strong">规则模块：{ruleMissing}</Pill>
        </div>
      </div>

      <Section title="三个核心任务块" desc="完成方式一或方式二即可完成「规则学习模块」。">
        <div className="list">
          <ContentCard content={cert} />
          <ContentCard content={mock} />
          <div className="taskCard">
            <div className="taskName">规则学习模块</div>
            <div className="taskMeta">方式一：{kickoff.name}</div>
            <div className="taskMeta">方式二：{portal.name} + {cancel.name}</div>
            <div className="taskReason">
              {ruleDone ? "已完成该模块（方式一或方式二）" : "完成方式一或方式二，即可完成该模块。"}
            </div>
            <div className="btnRow">
              <button className="btn primary" onClick={() => navTo("/workshops")}>去看 Kick Off</button>
              <button className="btn ghost" onClick={() => navTo("/dino-u")}>去看 Dino U 两项</button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="当前完成状态" desc="起步包状态会联动首页提示条与任务推荐。">
        <div className="list">
          <div className="taskCard">
            <div className="row">
              <div className="taskName">主修2-3级别学习及考证</div>
              <Pill tone={App.ui.statusTone(s["cert-core-2-3"])}>{formatStatus(s["cert-core-2-3"])}</Pill>
            </div>
          </div>
          <div className="taskCard">
            <div className="row">
              <div className="taskName">基础 Mock：主修试听 Lv2-3</div>
              <Pill tone={App.ui.statusTone(s["mock-trial-2-3"])}>{formatStatus(s["mock-trial-2-3"])}</Pill>
            </div>
          </div>
          <div className="taskCard">
            <div className="row">
              <div className="taskName">规则学习模块</div>
              <Pill tone={starter.ruleOk ? "good" : "warn"}>{starter.ruleOk ? "已完成" : "未完成"}</Pill>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="下一步建议"
        desc={starter.status === "已完成" ? "起步包完成后，建议优先拿试听证书或拓展主修等级。" : "先把起步包补齐，系统会自动推荐下一步。"}
        right={<Pill tone="brand">系统推荐</Pill>}
      >
        <div className="list">
          {starter.status === "已完成" ? (
            <>
              <ContentCard content={App.util.getContentById("cert-trial-2-3")} />
              <ContentCard content={App.util.getContentById("cert-core-4-6")} />
            </>
          ) : (
            <div className="taskCard">
              <div className="taskName">优先补齐缺失项</div>
              <div className="taskReason">回到首页看“你现在先做这3件事”，会自动只显示 3 个最优先任务。</div>
              <button className="btn primary" onClick={() => navTo("/home")}>回到首页</button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function CertificatesPage() {
  const list = App.FakeDB.contents.filter((c) => c.type === "certificate");
  const mustIds = ["cert-core-2-3", "cert-trial-2-3", "cert-core-4-6"];
  const must = mustIds.map((id) => App.util.getContentById(id)).filter(Boolean);
  const hot = list.filter((c) => (c.tags || []).includes("当前热门推荐"));
  const all = list;

  return (
    <div className="container topSafe">
      <PageHeader title="证书" right={<button className="btn ghost" onClick={() => navTo("/tasks")} style={{ padding: "8px 10px" }}>返回任务</button>} />

      <div className="card soft">
        <div className="h2">页面说明</div>
        <div className="small muted" style={{ marginTop: 6 }}>
          证书会影响可授课范围与订课机会；“大量订课必备证书”和“当前热门推荐”标签可重叠显示。
        </div>
      </div>

      <Section title="大量订课必备证书" desc="先拿到这些证书，订课机会会更明显。">
        <div className="list">{must.map((c) => <ContentCard key={c.id} content={c} />)}</div>
      </Section>

      <Section title="当前热门推荐" desc="近期更值得优先做的证书/方向。">
        <div className="list">{hot.map((c) => <ContentCard key={c.id} content={c} />)}</div>
      </Section>

      <Section title="全部证书列表" desc="可逐步补齐覆盖。">
        <div className="list">{all.map((c) => <ContentCard key={c.id} content={c} />)}</div>
      </Section>
    </div>
  );
}

function MockPage() {
  const list = App.FakeDB.contents.filter((c) => c.type === "mock");
  const basicIds = ["mock-trial-2-3", "mock-trial-1", "mock-trial-4-6"];
  const advIds = ["mock-graded-reading-4-6", "mock-literature-5-8", "cert-core-7-8"];
  const basic = basicIds.map((id) => App.util.getContentById(id)).filter(Boolean);
  const adv = advIds.map((id) => App.util.getContentById(id)).filter(Boolean);

  return (
    <div className="container topSafe">
      <PageHeader title="Mock" right={<button className="btn ghost" onClick={() => navTo("/tasks")} style={{ padding: "8px 10px" }}>返回任务</button>} />

      <div className="card soft">
        <div className="h2">页面说明</div>
        <div className="small muted" style={{ marginTop: 6 }}>
          进阶 Mock 的成长积分高于基础 Mock；基础 Mock 的「主修试听 Lv2-3」属于起步包内容。
        </div>
      </div>

      <Section title="基础 Mock 区" desc="先把基础跑通，课堂更稳。">
        <div className="list">{basic.map((c) => <ContentCard key={c.id} content={c} />)}</div>
      </Section>

      <Section title="进阶 Mock 区" desc="高成长积分任务，适合冲刺前30%奖励。">
        <div className="list">{adv.map((c) => <ContentCard key={c.id} content={c} />)}</div>
      </Section>

      <Section title="全部 Mock 列表" desc="按节奏逐步完成。">
        <div className="list">{list.map((c) => <ContentCard key={c.id} content={c} />)}</div>
      </Section>
    </div>
  );
}

function WorkshopsPage() {
  const list = App.FakeDB.contents.filter((c) => c.type === "workshop");
  const kickoff = App.util.getContentById("workshop-kickoff");
  return (
    <div className="container topSafe">
      <PageHeader title="Workshops" right={<button className="btn ghost" onClick={() => navTo("/tasks")} style={{ padding: "8px 10px" }}>返回任务</button>} />

      <div className="card soft">
        <div className="h2">页面说明</div>
        <div className="small muted" style={{ marginTop: 6 }}>
          Workshop 更偏“主题训练”。优先根据任务推荐做，不需要先做“形式选择题”。
        </div>
      </div>

      <div className="card highlight">
        <div className="row">
          <div className="h2">基础规则主题高亮</div>
          <Pill tone="warn">起步包</Pill>
        </div>
        <div className="divider" />
        <ContentCard content={kickoff} />
      </div>

      <Section title="全部 Workshops 列表" desc="完成后会点亮对应勋章。">
        <div className="list">{list.map((c) => <ContentCard key={c.id} content={c} />)}</div>
      </Section>
    </div>
  );
}

function DinoUPage() {
  const portal = App.util.getContentById("dino-portal-intro");
  const cancel = App.util.getContentById("dino-cancellation-video");
  const extra = App.util.getContentById("dino-income-risk");
  const ruleDone = useMemo(() => App.store.getStarterPack().ruleOk, [useAppState((s) => s.progress.contentStatus)]);

  return (
    <div className="container topSafe">
      <PageHeader title="Dino U" right={<button className="btn ghost" onClick={() => navTo("/tasks")} style={{ padding: "8px 10px" }}>返回任务</button>} />

      <div className="card soft">
        <div className="h2">页面说明</div>
        <div className="small muted" style={{ marginTop: 6 }}>
          若未参加 <b>New Teacher Kick Off</b>，可通过完成下面两项完成「规则学习模块」。
        </div>
        <div className="pillRow">
          <Pill tone={ruleDone ? "good" : "warn"}>规则学习模块：{ruleDone ? "已完成" : "未完成"}</Pill>
        </div>
      </div>

      <div className="card highlight">
        <div className="row">
          <div className="h2">基础规则学习区</div>
          <Pill tone="warn">高亮</Pill>
        </div>
        <div className="divider" />
        <div className="list">
          <ContentCard content={portal} />
          <ContentCard content={cancel} />
        </div>
      </div>

      <Section title="视频 + 文字区" desc="用于强调关键规则与风险点（示意）。">
        <div className="taskCard">
          <div className="taskName">视频重点：取消/缺勤/投诉会影响收入与机会</div>
          <div className="taskReason">建议看完后结合自己的排课习惯做一次自查，避免常见扣减。</div>
          <button className="btn ghost" onClick={() => navTo("/content", { id: extra.id })}>查看相关内容</button>
        </div>
      </Section>

      <Section title="图片 + 文字区" desc="用于快速理解操作流程（示意）。">
        <div className="taskCard">
          <div className="taskName">操作速查：老师端 Portal 常用入口</div>
          <div className="taskReason">把常用入口固定成“肌肉记忆”，能显著减少新手期错误。</div>
          <button className="btn primary" onClick={() => navTo("/content", { id: portal.id })}>去查看</button>
        </div>
      </Section>
    </div>
  );
}

function ContentDetailPage() {
  const route = useRoute();
  const id = route.query.id;
  const content = App.util.getContentById(id);
  const status = useAppState((s) => (id ? s.progress.contentStatus[id] : "not_started")) || "not_started";
  const reward = useMemo(() => App.store.getRewardStatus(), [useAppState((s) => s.user.growthPointsThisMonth), useAppState((s) => s.user.stageKey)]);

  const nextIds = (content?.next || []).filter(Boolean);
  const nextList = nextIds.map((x) => App.util.getContentById(x)).filter(Boolean);

  if (!content) {
    return (
      <div className="container topSafe">
        <PageHeader title="内容详情" right={<button className="btn ghost" onClick={() => navTo("/tasks")} style={{ padding: "8px 10px" }}>返回任务</button>} />
        <div className="card soft">
          <div className="h2">未找到内容</div>
          <div className="small muted" style={{ marginTop: 8 }}>请从任务/列表入口进入。</div>
        </div>
      </div>
    );
  }

  const mark = (to) => App.store.markContentStatus(content.id, to);

  return (
    <div className="container topSafe">
      <PageHeader title="内容详情" right={<button className="btn ghost" onClick={() => navTo("/tasks")} style={{ padding: "8px 10px" }}>返回任务</button>} />

      {/* 1. 标题区 */}
      <div className="card strong">
        <div className="row">
          <div className="col">
            <div className="h2">{content.name}</div>
            <div className="small muted">{contentTypeName(content.type)} · 适合阶段：{(content.suitableStages || []).map((k) => App.Const.stages.find((s) => s.key === k)?.month).filter(Boolean).join("/")}</div>
          </div>
          <Pill tone={App.ui.statusTone(status)}>{formatStatus(status)}</Pill>
        </div>
        <div className="pillRow">
          {(content.tags || []).map((t) => (
            <Pill key={t} tone={t.includes("必备") ? "warn" : t.includes("热门") ? "brand" : t.includes("起步包") ? "warn" : "strong"}>{t}</Pill>
          ))}
          <Pill tone="brand">+{content.points} 成长积分</Pill>
        </div>
      </div>

      {/* 2. 内容摘要 */}
      <Section title="内容摘要" desc="不要抢主视觉：保持短、清晰、可行动。">
        <div className="small muted">{content.short}</div>
      </Section>

      {/* 3. 完成收益 */}
      <Section title="完成收益" desc="为什么值得现在做">
        <div className="taskCard">
          <div className="taskName">{content.benefit}</div>
          <div className="taskReason">提示：越接近前30%奖励，做高成长积分任务越“划算”。</div>
          {!reward.inTop30Reward ? <div className="pillRow"><Pill tone="warn">距离前30%奖励还差 {reward.missingPoints} 分</Pill></div> : <div className="pillRow"><Pill tone="good">已进入前30%奖励区</Pill></div>}
        </div>
      </Section>

      {/* 4. 当前状态 + 交互 */}
      <Section title="当前状态" desc="用于演示状态流转与自动推荐逻辑（可交互）。" right={<Pill tone="brand">可交互</Pill>}>
        <div className="taskCard">
          <div className="row">
            <div className="taskName">当前：{formatStatus(status)}</div>
            <div className="points">+{content.points} 分</div>
          </div>
          <div className="btnRow">
            <button className="btn ghost" onClick={() => mark("in_progress")}>标记：进行中</button>
            <button className="btn primary" onClick={() => mark("completed")}>标记：已完成</button>
            <button className="btn ghost" onClick={() => mark("substituted")}>标记：已替代完成</button>
          </div>
        </div>
      </Section>

      {/* 6. 替代 / 重复说明 */}
      <Section title="替代 / 重复说明" desc="说明类内容不抢主视觉，但必须存在。">
        <div className="list">
          <div className="taskCard">
            <div className="taskName">替代完成</div>
            <div className="taskReason">
              {content.replaces && content.replaces.length
                ? `完成本内容可替代：${content.replaces.map((id) => App.util.getContentById(id)?.name || id).join("、")}`
                : "暂无替代项。"}
            </div>
          </div>
          <div className="taskCard">
            <div className="taskName">重复主题</div>
            <div className="taskReason">
              {content.repeats && content.repeats.length
                ? `与以下内容主题重复/互补：${content.repeats.map((id) => App.util.getContentById(id)?.name || id).join("、")}`
                : "暂无重复主题说明。"}
            </div>
          </div>
        </div>
      </Section>

      {/* 7. 下一步推荐（关键要求） */}
      <Section title="下一步推荐" desc="完成后系统必须明确告诉你：下一步去哪。">
        <div className="list">
          {nextList.length ? (
            nextList.map((c) => <ContentCard key={c.id} content={c} />)
          ) : (
            <div className="taskCard">
              <div className="taskName">下一步：回到任务页</div>
              <div className="taskReason">系统会根据阶段、起步包与奖励进度，继续给你“最该做的 3 件事”。</div>
              <button className="btn primary" onClick={() => navTo("/tasks")}>去学习任务页</button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

App.pages = {
  HomePage,
  TasksPage,
  GrowthPage,
  IncomeDetailPage,
  StarterPackDetailPage,
  CertificatesPage,
  MockPage,
  WorkshopsPage,
  DinoUPage,
  ContentDetailPage,
};
