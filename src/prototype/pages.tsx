import type { ChangeEvent, ReactNode } from 'react'
import { BadgeWall, CardTitle, ContentCard, GlobalHintBar, GoalButtons, GrowthTimeline, IncomeBreakdownCard, IncomeEstimateCard, Pill, RecentProgressCardList, RewardStatusCard, SegmentedTabs, StageStatusCard, StarterPackCard, TaskCard, TopThreeTasksCardGroup } from './components'
import { contents, getContent, STAGES, tasks } from './data'
import { useAppStore } from './store'
import { contentTypeName, formatStatus, navTo, priorityPill, resolveActiveTab, stageLabel, statusTone, useRoute } from './ui'

export function Toast() {
  const { state } = useAppStore()
  if (!state.ui.toast) return null
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: 14, zIndex: 20, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div className="card soft" style={{ maxWidth: 480, width: 'calc(100% - 24px)' }}>
        <div className="row"><div style={{ fontWeight: 900 }}>下一步推荐</div><Pill tone="brand">自动</Pill></div>
        <div className="small muted" style={{ marginTop: 6 }}>{state.ui.toast}</div>
      </div>
    </div>
  )
}

function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return <div className="pageTitleRow"><div className="pageTitle">{title}</div>{right}</div>
}

function Section({ title, desc, children, right }: { title: string; desc?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="card soft">
      <div className="row"><div className="h2">{title}</div>{right}</div>
      {desc ? <div className="small muted" style={{ marginTop: 6 }}>{desc}</div> : null}
      <div className="divider" />
      {children}
    </div>
  )
}

export function HomePage() {
  const { state, setStage } = useAppStore()
  const currentIndex = STAGES.findIndex((stage) => stage.key === state.user.stageKey)
  const nextStage = STAGES[(currentIndex + 1) % STAGES.length]
  return (
    <div className="container topSafe">
      <PageHeader title="首页" right={<button className="btn ghost" onClick={() => setStage(nextStage.key)}>演示：切换到 {nextStage.month}</button>} />
      <GlobalHintBar />
      <StageStatusCard />
      <IncomeEstimateCard />
      <TopThreeTasksCardGroup />
      <StarterPackCard />
      <RewardStatusCard />
      <RecentProgressCardList />
    </div>
  )
}

export function TasksPage() {
  const route = useRoute()
  const { state, setTasksTab } = useAppStore()
  const tab = route.query.tab === 'by_goal' ? 'by_goal' : route.query.tab === 'by_stage' ? 'by_stage' : state.ui.tasksTab
  const stage = STAGES.find((item) => item.key === state.user.stageKey) ?? STAGES[0]
  const stageTasks = tasks.filter((task) => task.stageKeys.includes(state.user.stageKey))
  const doneCount = stageTasks.filter((task) => state.progress.taskStatus[task.id] === 'completed').length
  const progress = stageTasks.length ? Math.round((doneCount / stageTasks.length) * 100) : 0
  const goalTasks = tasks
    .filter((task) => task.goalKeys.includes(state.ui.selectedGoalKey))
    .sort((a, b) => (b.priority === 'must' ? 3 : b.priority === 'strong' ? 2 : 1) - (a.priority === 'must' ? 3 : a.priority === 'strong' ? 2 : 1))

  return (
    <div className="container topSafe">
      <div className="stickyTop">
        <PageHeader title="学习任务" right={<span className="small muted">当前：{stage.month}</span>} />
        <GlobalHintBar />
        <SegmentedTabs value={tab} onChange={(value) => { setTasksTab(value); navTo('/tasks', { tab: value }) }} />
      </div>

      {tab === 'by_stage' ? (
        <>
          <div className="card soft">
            <div className="row">
              <div><div className="h2">{stage.month} · {stage.title}</div><div className="small muted">阶段目标：{stage.goal}</div></div>
              <div><Pill tone="brand">完成率 {progress}%</Pill></div>
            </div>
          </div>
          <Section title="必做"><div className="list">{stageTasks.filter((task) => task.priority === 'must').map((task) => <TaskCard key={task.id} task={task} />)}</div></Section>
          <Section title="强烈建议"><div className="list">{stageTasks.filter((task) => task.priority === 'strong').map((task) => <TaskCard key={task.id} task={task} />)}</div></Section>
          <Section title="推荐完成"><div className="list">{stageTasks.filter((task) => task.priority === 'recommended').map((task) => <TaskCard key={task.id} task={task} />)}</div></Section>
          <div className="card soft">
            <CardTitle title="更多入口（次级）" />
            <div className="divider" />
            <div className="grid2">
              <button className="btn primary" onClick={() => navTo('/certificates')}>查看全部证书</button>
              <button className="btn primary" onClick={() => navTo('/mock')}>查看全部 Mock</button>
              <button className="btn primary" onClick={() => navTo('/workshops')}>查看全部 Workshops</button>
              <button className="btn primary" onClick={() => navTo('/dino-u')}>查看全部 Dino U</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="card soft">
            <div className="h2">按目标找</div>
            <div className="small muted" style={{ marginTop: 6 }}>先看“我该做什么”，结果按推荐优先级排序。</div>
            <GoalButtons />
          </div>
          <Section title="推荐结果">
            <div className="list">
              {goalTasks.map((task) => (
                <div key={task.id} className="taskCard">
                  <div className="taskTop">
                    <div style={{ flex: 1 }}>
                      <div className="taskName">{task.name}</div>
                      <div className="taskMeta">类型：{contentTypeName(task.type)} · 适合阶段：{task.stageKeys.map(stageLabel).join('/')}</div>
                      <div className="taskReason">为什么推荐：{task.reason}</div>
                      <div className="taskReason">完成收益：{task.benefit}</div>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end' }}>
                      <Pill tone={priorityPill(task.priority).tone}>{priorityPill(task.priority).label}</Pill>
                      <Pill tone={statusTone(state.progress.taskStatus[task.id] ?? 'not_started')}>{formatStatus(state.progress.taskStatus[task.id] ?? 'not_started')}</Pill>
                    </div>
                  </div>
                  <div className="taskFooter">
                    <div className="points">+{task.points} 成长积分</div>
                    <button className="btn primary" onClick={() => task.contentId ? navTo('/content', { id: task.contentId }) : navTo('/dino-u')}>去完成</button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

export function GrowthPage() {
  const { state, rewardStatus, starterPack, resetAll } = useAppStore()
  return (
    <div className="container topSafe">
      <PageHeader title="我的成长" right={<button className="btn ghost" onClick={resetAll}>重置演示数据</button>} />
      <div className="card soft">
        <div className="row">
          <div><div className="small muted">当前累计成长积分</div><div className="money">{state.user.growthPointsAllTime}</div></div>
          <div><div className="small muted">本月成长积分</div><div className="money">{state.user.growthPointsThisMonth}</div></div>
        </div>
        <div className="pillRow">
          <Pill tone="brand">{stageLabel(state.user.stageKey)}</Pill>
          <Pill tone={starterPack.status === '已完成' ? 'good' : 'warn'}>起步包：{starterPack.status}</Pill>
        </div>
      </div>
      <div className="card highlight">
        <div className="row"><div className="h2">前30%奖励状态</div><Pill tone="warn">奖励</Pill></div>
        <div className="divider" />
        <div className="h3">{rewardStatus.inTop30Reward ? '已进入前30%奖励区' : `距离前30%奖励还差 ${rewardStatus.missingPoints} 分`}</div>
        <div className="small muted" style={{ marginTop: 6 }}>再完成某项证书 / Mock / 主题学习，可更快提升排名。</div>
      </div>
      <div className="card soft">
        <div className="row"><div className="h2">Rising Star 状态</div><Pill tone={state.user.stageKey === 'M3' ? 'purple' : 'strong'}>{state.user.stageKey === 'M3' ? 'Rising Star 成长中' : '继续成长'}</Pill></div>
      </div>
      <BadgeWall />
      <GrowthTimeline />
    </div>
  )
}

export function IncomePage() {
  const { state, incomeEstimate, setIncomeInputs } = useAppStore()
  const bind = (key: keyof typeof state.income.inputs) => (event: ChangeEvent<HTMLInputElement>) => setIncomeInputs({ [key]: Number(event.target.value) || 0 })
  return (
    <div className="container topSafe">
      <PageHeader title="收入预估详情" right={<button className="btn ghost" onClick={() => navTo('/home')}>返回首页</button>} />
      <div className="card strong">
        <div className="row"><div className="h2">收入预估器</div><Pill tone="strong">Tier（系统自动）：{state.user.tierKey}</Pill></div>
        <div className="divider" />
        <div className="grid2">
          <div><div className="small muted">本月预计完课量</div><input className="input" value={state.income.inputs.expectedClasses} onChange={bind('expectedClasses')} /></div>
          <div><div className="small muted">本月预计试听转化单数</div><input className="input" value={state.income.inputs.expectedConversions} onChange={bind('expectedConversions')} /></div>
          <div><div className="small muted">本月预计 PB 课量</div><input className="input" value={state.income.inputs.expectedPB} onChange={bind('expectedPB')} /></div>
          <div><div className="small muted">本月预计 JG 课量</div><input className="input" value={state.income.inputs.expectedJG} onChange={bind('expectedJG')} /></div>
          <div><div className="small muted">本月预计 LR 课量</div><input className="input" value={state.income.inputs.expectedLR} onChange={bind('expectedLR')} /></div>
          <div><div className="small muted">预计总收入</div><div className="money">${incomeEstimate.total}</div></div>
        </div>
      </div>
      <IncomeBreakdownCard />
      <Section title="提升收入与机会的关键动作">
        <div className="list">
          {['拿更多高价值证书', '提升试听转化', '多完课', '多考取 PB / JG / LR 对应证书', '完成基础 Mock 和进阶 Mock'].map((item) => <div key={item} className="taskCard"><div className="taskName">{item}</div></div>)}
        </div>
      </Section>
      <div className="card soft"><div className="h2">会影响收入与机会的提醒</div><div className="divider" /><div className="small muted">取消、缺勤、投诉、迟到等会造成课酬扣减，并影响后续订课机会。</div></div>
      <div className="card soft"><div className="h2">机会提示区</div><div className="divider" /><div className="small muted">证书与订课机会关系、PPT 核心时段的重要性，可从任务页继续查看相关内容。</div></div>
    </div>
  )
}

export function StarterPackPage() {
  const { state, starterPack } = useAppStore()
  const missing = [
    !starterPack.certOk ? '主修2-3级别学习及考证' : null,
    !starterPack.mockOk ? '基础 Mock：主修试听 Lv2-3' : null,
    !starterPack.ruleOk ? '规则学习模块' : null,
  ].filter(Boolean)
  return (
    <div className="container topSafe">
      <PageHeader title="新老师起步包" right={<button className="btn ghost" onClick={() => navTo('/home')}>返回首页</button>} />
      <div className="card highlight">
        <div className="row"><div className="h2">起步包说明</div><Pill tone={starterPack.status === '已完成' ? 'good' : 'warn'}>{starterPack.status}</Pill></div>
        <div className="small muted" style={{ marginTop: 8 }}>已完成 {starterPack.doneCount}/3，{missing.length ? `还差：${missing.join('、')}` : '全部完成'}</div>
      </div>
      <Section title="三个核心任务块">
        <div className="list">
          <ContentCard content={getContent('cert-core-2-3')!} />
          <ContentCard content={getContent('mock-trial-2-3')!} />
          <div className="taskCard"><div className="taskName">规则学习模块</div><div className="taskReason">方式一：New Teacher Kick Off；方式二：Teacher Portal Introduction + Understanding Class Cancellations。</div></div>
        </div>
      </Section>
      <Section title="当前完成状态"><div className="small muted">规则学习模块当前：{starterPack.ruleOk ? '已完成' : '未完成'}；当前阶段：{stageLabel(state.user.stageKey)}</div></Section>
      <Section title="下一步建议"><div className="list">{starterPack.status === '已完成' ? [getContent('cert-trial-2-3')!, getContent('cert-core-4-6')!].map((item) => <ContentCard key={item.id} content={item} />) : <div className="taskCard"><div className="taskName">优先补齐缺失项</div></div>}</div></Section>
    </div>
  )
}

export function CertificatesPage() {
  const mustIds = ['cert-core-2-3', 'cert-trial-2-3', 'cert-core-4-6']
  return (
    <div className="container topSafe">
      <PageHeader title="证书" right={<button className="btn ghost" onClick={() => navTo('/tasks')}>返回任务</button>} />
      <div className="card soft"><div className="h2">页面说明</div></div>
      <Section title="大量订课必备证书"><div className="list">{mustIds.map((id) => <ContentCard key={id} content={getContent(id)!} />)}</div></Section>
      <Section title="当前热门推荐"><div className="list">{contents.filter((item) => item.type === 'certificate' && item.tags.includes('当前热门推荐')).map((item) => <ContentCard key={item.id} content={item} />)}</div></Section>
      <Section title="全部证书列表"><div className="list">{contents.filter((item) => item.type === 'certificate').map((item) => <ContentCard key={item.id} content={item} />)}</div></Section>
    </div>
  )
}

export function MockPage() {
  const ids = {
    basic: ['mock-trial-2-3', 'mock-trial-1', 'mock-trial-4-6'],
    advanced: ['mock-graded-reading-4-6', 'mock-literature-5-8', 'mock-cert-7-8'],
  }
  return (
    <div className="container topSafe">
      <PageHeader title="Mock" right={<button className="btn ghost" onClick={() => navTo('/tasks')}>返回任务</button>} />
      <div className="card soft"><div className="h2">页面说明</div></div>
      <Section title="基础 Mock 区"><div className="list">{ids.basic.map((id) => <ContentCard key={id} content={getContent(id)!} />)}</div></Section>
      <Section title="进阶 Mock 区"><div className="list">{ids.advanced.map((id) => <ContentCard key={id} content={getContent(id)!} />)}</div></Section>
      <Section title="全部 Mock 列表"><div className="list">{contents.filter((item) => item.type === 'mock').map((item) => <ContentCard key={item.id} content={item} />)}</div></Section>
    </div>
  )
}

export function WorkshopsPage() {
  return (
    <div className="container topSafe">
      <PageHeader title="Workshops" right={<button className="btn ghost" onClick={() => navTo('/tasks')}>返回任务</button>} />
      <div className="card soft"><div className="h2">页面说明</div></div>
      <div className="card highlight"><div className="h2">基础规则主题高亮</div><div className="divider" /><ContentCard content={getContent('workshop-kickoff')!} /></div>
      <Section title="全部 Workshops 列表"><div className="list">{contents.filter((item) => item.type === 'workshop').map((item) => <ContentCard key={item.id} content={item} />)}</div></Section>
    </div>
  )
}

export function DinoUPage() {
  return (
    <div className="container topSafe">
      <PageHeader title="Dino U" right={<button className="btn ghost" onClick={() => navTo('/tasks')}>返回任务</button>} />
      <div className="card soft"><div className="h2">页面说明</div><div className="small muted" style={{ marginTop: 6 }}>若未参加 New Teacher Kick Off，可通过完成下面两项完成规则学习模块。</div></div>
      <div className="card highlight"><div className="h2">基础规则学习区</div><div className="divider" /><div className="list"><ContentCard content={getContent('dino-portal-intro')!} /><ContentCard content={getContent('dino-cancellation-video')!} /></div></div>
      <Section title="视频 + 文字区"><div className="taskCard"><div className="taskName">常见问题清单：迟到/投诉/缺勤如何影响收入</div></div></Section>
      <Section title="图片 + 文字区"><div className="taskCard"><div className="taskName">Teacher Portal Introduction</div></div></Section>
    </div>
  )
}

export function ContentDetailPage() {
  const route = useRoute()
  const { state, rewardStatus, markContentStatus } = useAppStore()
  const content = route.query.id ? getContent(route.query.id) : undefined
  if (!content) return <div className="container topSafe"><PageHeader title="内容详情" /></div>
  const status = state.progress.contentStatus[content.id] ?? 'not_started'
  return (
    <div className="container topSafe">
      <PageHeader title="内容详情" right={<button className="btn ghost" onClick={() => navTo('/tasks')}>返回任务</button>} />
      <div className="card strong">
        <div className="row"><div><div className="h2">{content.name}</div><div className="small muted">{contentTypeName(content.type)} · 适合阶段：{content.suitableStages.map(stageLabel).join('/')}</div></div><Pill tone={statusTone(status)}>{formatStatus(status)}</Pill></div>
        <div className="pillRow">{content.tags.map((tag) => <Pill key={tag} tone="strong">{tag}</Pill>)}<Pill tone="brand">+{content.points} 成长积分</Pill></div>
      </div>
      <Section title="内容摘要"><div className="small muted">{content.short}</div></Section>
      <Section title="完成收益"><div className="taskCard"><div className="taskName">{content.benefit}</div><div className="taskReason">{rewardStatus.inTop30Reward ? '已进入前30%奖励区' : `距离前30%奖励还差 ${rewardStatus.missingPoints} 分`}</div></div></Section>
      <Section title="当前状态" right={<Pill tone="brand">可交互</Pill>}>
        <div className="taskCard">
          <div className="row"><div className="taskName">当前：{formatStatus(status)}</div><div className="points">+{content.points} 分</div></div>
          <div className="btnRow">
            <button className="btn ghost" onClick={() => markContentStatus(content.id, 'in_progress')}>标记：进行中</button>
            <button className="btn primary" onClick={() => markContentStatus(content.id, 'completed')}>标记：已完成</button>
            <button className="btn ghost" onClick={() => markContentStatus(content.id, 'substituted')}>标记：已替代完成</button>
          </div>
        </div>
      </Section>
      <Section title="替代 / 重复说明"><div className="taskCard"><div className="taskReason">{content.replaces.length ? `替代：${content.replaces.map((item) => getContent(item)?.name).join('、')}` : '暂无替代项。'}</div><div className="taskReason">{content.repeats.length ? `重复主题：${content.repeats.map((item) => getContent(item)?.name).join('、')}` : '暂无重复主题说明。'}</div></div></Section>
      <Section title="下一步推荐"><div className="list">{content.next.length ? content.next.map((item) => getContent(item)).filter(Boolean).map((item) => <ContentCard key={item!.id} content={item!} />) : <div className="taskCard"><div className="taskName">回到任务页继续</div></div>}</div></Section>
    </div>
  )
}

export { resolveActiveTab }
