import { type ReactNode } from 'react'
import { GOALS, STAGES, getContent, type ContentItem, type TaskItem } from './data'
import { useAppStore } from './store'
import { buttonLabelForStatus, contentTypeName, formatStatus, navTo, priorityPill, statusTone } from './ui'

export function Pill({ tone = 'strong', children }: { tone?: string; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>
}

export function CardTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="row" style={{ alignItems: 'baseline' }}>
      <div className="h2">{title}</div>
      {right ? <div className="small muted">{right}</div> : null}
    </div>
  )
}

export function BottomTabBar({ activeKey }: { activeKey: string }) {
  const tabs = [
    { key: 'home', label: '首页', sub: '看收入/做任务' },
    { key: 'tasks', label: '学习任务', sub: '按阶段/按目标' },
    { key: 'growth', label: '我的成长', sub: '奖励/勋章' },
  ]
  return (
    <div className="bottomTabs">
      <div className="bottomTabsInner">
        {tabs.map((tab) => (
          <button key={tab.key} className={`tabBtn ${activeKey === tab.key ? 'active' : ''}`} onClick={() => navTo(`/${tab.key}`)}>
            {tab.label}
            <span className="sub">{tab.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function GlobalHintBar({ variant = 'strong' }: { variant?: string }) {
  const { state, starterPack, rewardStatus } = useAppStore()
  const stage = STAGES.find((item) => item.key === state.user.stageKey)
  const title = starterPack.status !== '已完成' ? '新老师起步包未完成' : rewardStatus.inTop30Reward ? '前30%奖励状态' : '前30%奖励进度'
  const text = starterPack.status !== '已完成'
    ? `建议优先完成起步包（已完成 ${starterPack.doneCount}/3）。`
    : rewardStatus.inTop30Reward
      ? '你已进入本月同阶段新老师前30%奖励区，继续保持可获得抽奖资格。'
      : `你距离前30%奖励还差 ${rewardStatus.missingPoints} 成长积分。`
  return (
    <div className={`hintBar ${variant}`}>
      <div className="hintTitle">{title}</div>
      <div className="hintText">{text}</div>
      <div className="pillRow" style={{ marginTop: 8 }}>
        <Pill tone="brand">{stage?.month}</Pill>
        <Pill tone="strong">系统 Tier：{state.user.tierKey}</Pill>
        <Pill tone={starterPack.status === '已完成' ? 'good' : 'warn'}>起步包：{starterPack.status}</Pill>
      </div>
    </div>
  )
}

export function StageStatusCard() {
  const { state, rewardStatus } = useAppStore()
  const stage = STAGES.find((item) => item.key === state.user.stageKey)
  return (
    <div className="card soft" onClick={() => navTo('/tasks', { tab: 'by_stage' })} style={{ cursor: 'pointer' }}>
      <div className="row">
        <div className="col">
          <div className="h2">当前阶段：{stage?.month}</div>
          <div className="small muted">{stage?.title}</div>
        </div>
        <Pill tone={stage?.key === 'M3' ? 'purple' : 'brand'}>{stage?.key === 'M3' ? 'Rising Star 成长中' : '本月目标'}</Pill>
      </div>
      <div className="divider" />
      <div className="row">
        <div>
          <div className="small muted">当前成长积分（本月）</div>
          <div className="h2">{state.user.growthPointsThisMonth} 分</div>
        </div>
        <div className={`pill ${rewardStatus.inTop30Reward ? 'good' : 'warn'}`} onClick={(event) => { event.stopPropagation(); navTo('/growth') }}>
          {rewardStatus.inTop30Reward ? '已进入前30%奖励区' : `距离前30%奖励还差 ${rewardStatus.missingPoints} 成长积分`}
        </div>
      </div>
    </div>
  )
}

export function IncomeEstimateCard() {
  const { state, incomeEstimate } = useAppStore()
  const extra = state.income.inputs.expectedPB + state.income.inputs.expectedJG + state.income.inputs.expectedLR
  return (
    <div className="card strong" onClick={() => navTo('/income')} style={{ cursor: 'pointer' }}>
      <div className="row">
        <div className="h2">收入预估</div>
        <Pill tone="strong">系统自动读取 Tier：{state.user.tierKey}</Pill>
      </div>
      <div className="row" style={{ marginTop: 10, alignItems: 'flex-end' }}>
        <div>
          <div className="small muted">预计总收入</div>
          <div className="money">${incomeEstimate.total}</div>
        </div>
        <button className="btn gold" onClick={(event) => { event.stopPropagation(); navTo('/income') }}>查看和调整预估</button>
      </div>
      <div className="pillRow">
        <Pill tone="brand">本月预计完课 {state.income.inputs.expectedClasses} 节</Pill>
        <Pill tone="strong">预计转化 {state.income.inputs.expectedConversions} 单</Pill>
        <Pill tone="purple">PB/JG/LR 共 {extra} 节</Pill>
      </div>
    </div>
  )
}

export function TaskCard({ task }: { task: TaskItem }) {
  const { state } = useAppStore()
  const status = state.progress.taskStatus[task.id] ?? 'not_started'
  const priority = priorityPill(task.priority)
  const handleOpen = () => {
    if (task.id === 'task-rule-pack') navTo('/dino-u')
    else if (task.contentId) navTo('/content', { id: task.contentId })
  }
  return (
    <div className="taskCard">
      <div className="taskTop">
        <div style={{ flex: 1 }}>
          <div className="taskName">{task.name}</div>
          <div className="taskMeta">{contentTypeName(task.type)} · {task.stageKeys.map((stageKey) => STAGES.find((stage) => stage.key === stageKey)?.month).filter(Boolean).join('/')}</div>
          <div className="taskReason">{task.reason}</div>
          <div className="taskReason">完成收益：{task.benefit}</div>
        </div>
        <div className="col" style={{ alignItems: 'flex-end' }}>
          <Pill tone={priority.tone}>{priority.label}</Pill>
          <Pill tone={statusTone(status)}>{formatStatus(status)}</Pill>
        </div>
      </div>
      <div className="taskFooter">
        <div className="points">+{task.points} 成长积分</div>
        <button className="btn primary" onClick={handleOpen}>{buttonLabelForStatus(status)}</button>
      </div>
    </div>
  )
}

export function TopThreeTasksCardGroup() {
  const { topThreeTasks } = useAppStore()
  return (
    <div className="card">
      <CardTitle title="你现在先做这 3 件事" right="永远只显示 3 个" />
      <div className="divider" />
      <div className="list">{topThreeTasks.map((task) => <TaskCard key={task.id} task={task} />)}</div>
    </div>
  )
}

export function StarterPackCard() {
  const { state, starterPack } = useAppStore()
  const missing: string[] = []
  if (!starterPack.certOk) missing.push('主修2-3证书')
  if (!starterPack.mockOk) missing.push('基础Mock：主修试听 Lv2-3')
  if (!starterPack.ruleOk) missing.push('规则学习模块')
  return (
    <div className={`card ${state.user.stageKey === 'M0' ? 'highlight' : ''}`} onClick={() => navTo('/starter-pack')} style={{ cursor: 'pointer' }}>
      <div className="row">
        <div className="h2">新老师起步包</div>
        <Pill tone={starterPack.status === '已完成' ? 'good' : starterPack.status === '部分完成' ? 'warn' : 'bad'}>{starterPack.status}</Pill>
      </div>
      <div className="small muted" style={{ marginTop: 8 }}>已完成 {starterPack.doneCount}/{starterPack.total} 项</div>
      <div className="small muted" style={{ marginTop: 4 }}>{missing.length ? `还差：${missing.join('、')}` : '已完成全部起步包内容'}</div>
    </div>
  )
}

export function RewardStatusCard() {
  const { rewardStatus, topThreeTasks } = useAppStore()
  return (
    <div className="card highlight" onClick={() => navTo('/growth')} style={{ cursor: 'pointer' }}>
      <div className="row">
        <div className="h2">前30%奖励提醒</div>
        <Pill tone="warn">奖励</Pill>
      </div>
      <div className="divider" />
      <div className="h3">{rewardStatus.inTop30Reward ? '你已进入本月同阶段新老师前30%奖励区' : `你距离前30%奖励还差 ${rewardStatus.missingPoints} 成长积分`}</div>
      <div className="small muted" style={{ marginTop: 6 }}>
        {rewardStatus.inTop30Reward ? '继续保持，可获得抽奖资格。' : `推荐优先完成：${topThreeTasks[0]?.name ?? '高成长积分任务'}`}
      </div>
    </div>
  )
}

export function RecentProgressCardList() {
  const { state } = useAppStore()
  return (
    <div className="card soft" onClick={() => navTo('/growth')} style={{ cursor: 'pointer' }}>
      <CardTitle title="最近成长记录" right="最近 1–3 条" />
      <div className="divider" />
      <div className="list">
        {state.progress.timeline.slice(0, 3).map((item) => (
          <div key={`${item.at}-${item.contentId}`} className="timelineItem">
            <div className="row">
              <div className="small muted">{item.at}</div>
              <div className="points">+{item.points} 分</div>
            </div>
            <div style={{ marginTop: 4, fontWeight: 900 }}>{item.text}</div>
            {item.badge ? <div className="small muted" style={{ marginTop: 4 }}>{item.badge}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SegmentedTabs({ value, onChange }: { value: 'by_stage' | 'by_goal'; onChange: (value: 'by_stage' | 'by_goal') => void }) {
  return (
    <div className="segTabs">
      <button className={`segTab ${value === 'by_stage' ? 'active' : ''}`} onClick={() => onChange('by_stage')}>按阶段看</button>
      <button className={`segTab ${value === 'by_goal' ? 'active' : ''}`} onClick={() => onChange('by_goal')}>按目标找</button>
    </div>
  )
}

export function ContentCard({ content }: { content: ContentItem }) {
  const { state } = useAppStore()
  const status = state.progress.contentStatus[content.id] ?? 'not_started'
  return (
    <div className="taskCard" onClick={() => navTo('/content', { id: content.id })} style={{ cursor: 'pointer' }}>
      <div className="taskTop">
        <div style={{ flex: 1 }}>
          <div className="taskName">{content.name}</div>
          <div className="taskMeta">{contentTypeName(content.type)} · 适合：{content.suitableStages.map((stageKey) => STAGES.find((stage) => stage.key === stageKey)?.month).filter(Boolean).join('/')}</div>
          <div className="taskReason">{content.short}</div>
        </div>
        <div className="col" style={{ alignItems: 'flex-end' }}>
          <Pill tone={statusTone(status)}>{formatStatus(status)}</Pill>
          <div className="points">+{content.points} 分</div>
        </div>
      </div>
      <div className="pillRow">
        {content.tags.map((tag) => <Pill key={tag} tone={tag.includes('必备') ? 'warn' : tag.includes('热门') ? 'brand' : 'strong'}>{tag}</Pill>)}
      </div>
    </div>
  )
}

export function BadgeWall() {
  const { state } = useAppStore()
  const groups: Array<keyof typeof state.progress.badges> = ['certificate', 'mock', 'workshop', 'dinoU']
  return (
    <div className="card soft">
      <CardTitle title="勋章墙" right="完成内容即可点亮" />
      <div className="divider" />
      <div className="list">
        {groups.map((group) => (
          <div key={group}>
            <div className="h3" style={{ marginBottom: 8 }}>{contentTypeName(group)}</div>
            <div className="badgeGrid">
              {(state.progress.badges[group].length ? state.progress.badges[group] : ['empty-1', 'empty-2', 'empty-3']).map((id) => (
                <div key={id} className={`badge ${id.startsWith('empty') ? '' : 'badgeOn'}`}>
                  <div className="badgeName">{id.startsWith('empty') ? '未点亮' : getContent(id)?.name}</div>
                  <div className="badgeMeta">{id.startsWith('empty') ? '完成相关内容' : '已点亮'}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GrowthTimeline() {
  const { state } = useAppStore()
  return (
    <div className="card soft">
      <CardTitle title="成长记录时间轴" right="最近 20 条" />
      <div className="divider" />
      <div className="list">
        {state.progress.timeline.map((item) => (
          <div key={`${item.at}-${item.contentId}-${item.text}`} className="timelineItem">
            <div className="row">
              <div className="small muted">{item.at}</div>
              <div className="points">+{item.points} 分</div>
            </div>
            <div style={{ marginTop: 4, fontWeight: 900 }}>{item.text}</div>
            {item.badge ? <div className="small muted" style={{ marginTop: 4 }}>{item.badge}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function IncomeBreakdownCard() {
  const { incomeEstimate } = useAppStore()
  return (
    <div className="card soft">
      <CardTitle title="收入构成（预估）" right="仅供参考" />
      <div className="divider" />
      <div className="tableRow"><div className="k">Base（完课 × 7）</div><div className="v">${incomeEstimate.base}</div></div>
      <div className="tableRow"><div className="k">Tier incentive（分段）</div><div className="v">${incomeEstimate.tierIncentive}</div></div>
      <div className="tableRow"><div className="k">Convert incentive（转化 × 5）</div><div className="v">${incomeEstimate.convertIncentive}</div></div>
      <div className="tableRow"><div className="k">PB/JG/LR incentive（合计 × 2）</div><div className="v">${incomeEstimate.extraIncentive}</div></div>
      <div className="divider" />
      <div className="tableRow"><div className="k">预计总收入</div><div className="v" style={{ fontSize: 18 }}>${incomeEstimate.total}</div></div>
    </div>
  )
}

export function GoalButtons() {
  const { state, setSelectedGoal } = useAppStore()
  return (
    <div className="pillRow">
      {GOALS.map((goal) => (
        <button key={goal.key} className={`btn ${state.ui.selectedGoalKey === goal.key ? 'primary' : 'ghost'}`} style={{ borderRadius: 999, padding: '8px 10px' }} onClick={() => setSelectedGoal(goal.key)}>
          {goal.name}
        </button>
      ))}
    </div>
  )
}
