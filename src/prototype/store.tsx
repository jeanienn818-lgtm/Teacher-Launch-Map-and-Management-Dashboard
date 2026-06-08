import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getContent, type GoalKey, type StageKey, type StatusKey } from './data'
import { tasks, tierRules } from './data'

type ContentStatusMap = Record<string, StatusKey>
type TaskStatusMap = Record<string, StatusKey>

type TimelineItem = {
  at: string
  text: string
  points: number
  badge: string | null
  contentId: string
}

type AppState = {
  user: {
    stageKey: StageKey
    tierKey: keyof typeof tierRules
    growthPointsAllTime: number
    growthPointsThisMonth: number
  }
  income: {
    inputs: {
      expectedClasses: number
      expectedConversions: number
      expectedPB: number
      expectedJG: number
      expectedLR: number
    }
  }
  progress: {
    contentStatus: ContentStatusMap
    taskStatus: TaskStatusMap
    badges: Record<'certificate' | 'mock' | 'workshop' | 'dinoU', string[]>
    timeline: TimelineItem[]
  }
  ui: {
    tasksTab: 'by_stage' | 'by_goal'
    selectedGoalKey: GoalKey
    toast: string | null
  }
}

type AppStore = {
  state: AppState
  incomeEstimate: ReturnType<typeof calcIncomeEstimate>
  starterPack: ReturnType<typeof getStarterPackMeta>
  rewardStatus: ReturnType<typeof getRewardStatus>
  topThreeTasks: typeof tasks
  setTasksTab: (tab: 'by_stage' | 'by_goal') => void
  setSelectedGoal: (goal: GoalKey) => void
  setIncomeInputs: (patch: Partial<AppState['income']['inputs']>) => void
  setStage: (stageKey: StageKey) => void
  clearToast: () => void
  markContentStatus: (contentId: string, status: StatusKey) => void
  resetAll: () => void
}

const AppStoreContext = createContext<AppStore | null>(null)

function clampInt(value: number | string) {
  const next = Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0
  return Math.max(0, next)
}

function money(value: number) {
  return Math.round(value * 100) / 100
}

function calcTierIncentive(tierKey: keyof typeof tierRules, expectedClasses: number) {
  const rules = tierRules[tierKey]
  let total = 0
  let previous = 0
  let remaining = expectedClasses
  for (const segment of rules) {
    const count = Math.max(0, Math.min(remaining, segment.upTo - previous))
    total += count * segment.perClass
    remaining -= count
    previous = segment.upTo
    if (remaining <= 0) break
  }
  return money(total)
}

function calcIncomeEstimate(tierKey: keyof typeof tierRules, inputs: AppState['income']['inputs']) {
  const expectedClasses = clampInt(inputs.expectedClasses)
  const expectedConversions = clampInt(inputs.expectedConversions)
  const expectedPB = clampInt(inputs.expectedPB)
  const expectedJG = clampInt(inputs.expectedJG)
  const expectedLR = clampInt(inputs.expectedLR)
  const base = money(expectedClasses * 7)
  const tierIncentive = calcTierIncentive(tierKey, expectedClasses)
  const convertIncentive = money(expectedConversions * 5)
  const extraIncentive = money((expectedPB + expectedJG + expectedLR) * 2)
  return { base, tierIncentive, convertIncentive, extraIncentive, total: money(base + tierIncentive + convertIncentive + extraIncentive) }
}

function defaultState(): AppState {
  return {
    user: { stageKey: 'M0', tierKey: 'Tier2', growthPointsAllTime: 62, growthPointsThisMonth: 46 },
    income: { inputs: { expectedClasses: 55, expectedConversions: 6, expectedPB: 5, expectedJG: 0, expectedLR: 2 } },
    progress: {
      contentStatus: {
        'cert-core-2-3': 'in_progress',
        'mock-trial-2-3': 'not_started',
        'mock-trial-1': 'not_started',
        'mock-trial-4-6': 'not_started',
        'mock-graded-reading-4-6': 'not_started',
        'mock-literature-5-8': 'not_started',
        'mock-cert-7-8': 'not_started',
        'workshop-kickoff': 'not_started',
        'dino-portal-intro': 'completed',
        'dino-cancellation-video': 'not_started',
        'cert-trial-2-3': 'not_started',
        'cert-core-4-6': 'not_started',
        'dino-income-risk': 'not_started',
      },
      taskStatus: {
        'task-rule-pack': 'in_progress',
        'task-cert-core-2-3': 'in_progress',
        'task-mock-trial-2-3': 'not_started',
        'task-cert-trial-2-3': 'not_started',
        'task-cert-core-4-6': 'not_started',
        'task-dino-income-risk': 'not_started',
        'task-mock-literature-5-8': 'not_started',
      },
      badges: { certificate: ['cert-core-2-3'], mock: [], workshop: [], dinoU: ['dino-portal-intro'] },
      timeline: [
        { at: 'Apr 20', text: '完成 Teacher Portal Introduction', points: 6, badge: 'Dino U 勋章点亮', contentId: 'dino-portal-intro' },
        { at: 'Apr 18', text: '开始 主修 2-3 级别证书', points: 0, badge: null, contentId: 'cert-core-2-3' },
      ],
    },
    ui: { tasksTab: 'by_stage', selectedGoalKey: 'qualify_fast', toast: null },
  }
}

function isDone(status?: StatusKey) {
  return status === 'completed' || status === 'passed' || status === 'substituted'
}

function ruleModuleDone(state: AppState) {
  const status = state.progress.contentStatus
  return isDone(status['workshop-kickoff']) || (isDone(status['dino-portal-intro']) && isDone(status['dino-cancellation-video']))
}

function getStarterPackMeta(state: AppState) {
  const status = state.progress.contentStatus
  const certOk = isDone(status['cert-core-2-3'])
  const mockOk = isDone(status['mock-trial-2-3'])
  const ruleOk = ruleModuleDone(state)
  const doneCount = [certOk, mockOk, ruleOk].filter(Boolean).length
  return {
    certOk,
    mockOk,
    ruleOk,
    doneCount,
    total: 3,
    status: doneCount === 0 ? '未完成' : doneCount < 3 ? '部分完成' : '已完成',
  }
}

function getRewardStatus(state: AppState) {
  const targetPoints = { M0: 80, M1: 110, M2: 140, M3: 170 }[state.user.stageKey]
  const missingPoints = Math.max(0, targetPoints - state.user.growthPointsThisMonth)
  return { targetPoints, missingPoints, inTop30Reward: missingPoints === 0 }
}

function recommendTopThreeTasks(state: AppState) {
  const status = state.progress.contentStatus
  const recommendedIds: string[] = []
  if (!ruleModuleDone(state)) recommendedIds.push('task-rule-pack')
  if (!isDone(status['cert-core-2-3'])) recommendedIds.push('task-cert-core-2-3')
  if (!isDone(status['mock-trial-2-3'])) recommendedIds.push('task-mock-trial-2-3')
  if (!isDone(status['cert-trial-2-3'])) recommendedIds.push('task-cert-trial-2-3')
  if (getRewardStatus(state).missingPoints <= 28 && getRewardStatus(state).missingPoints > 0) recommendedIds.push('task-mock-literature-5-8')
  const selected = recommendedIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((item): item is typeof tasks[number] => Boolean(item))
    .slice(0, 3)
  if (selected.length >= 3) return selected
  for (const task of tasks) {
    if (selected.some((item) => item.id === task.id)) continue
    if (!task.stageKeys.includes(state.user.stageKey)) continue
    if (state.progress.taskStatus[task.id] === 'completed') continue
    selected.push(task)
    if (selected.length >= 3) break
  }
  return selected
}

function syncTaskStatus(next: AppState) {
  const bindings: Array<[string, string]> = [
    ['task-cert-core-2-3', 'cert-core-2-3'],
    ['task-mock-trial-2-3', 'mock-trial-2-3'],
    ['task-cert-trial-2-3', 'cert-trial-2-3'],
    ['task-cert-core-4-6', 'cert-core-4-6'],
    ['task-dino-income-risk', 'dino-income-risk'],
    ['task-mock-literature-5-8', 'mock-literature-5-8'],
  ]
  for (const [taskId, contentId] of bindings) {
    const status = next.progress.contentStatus[contentId]
    next.progress.taskStatus[taskId] = isDone(status) ? 'completed' : status === 'in_progress' ? 'in_progress' : 'not_started'
  }
  next.progress.taskStatus['task-rule-pack'] = ruleModuleDone(next) ? 'completed' : next.progress.taskStatus['task-rule-pack']
}

function nextToast(state: AppState, contentId: string) {
  if (contentId === 'cert-core-2-3') return '已完成主修2-3证书：下一步优先做「基础 Mock：主修试听 Lv2-3」。'
  if (contentId === 'mock-trial-2-3') return '已完成基础 Mock：下一步优先补齐「规则学习模块（Kick Off / Dino U）」。'
  if (getStarterPackMeta(state).status === '已完成') return '起步包已完成：下一步推荐「试听证书 Lv2-3」或「主修4-6级别证书」。'
  if (getRewardStatus(state).missingPoints <= 18 && getRewardStatus(state).missingPoints > 0) return '你接近前30%奖励：下一步建议做高成长积分任务（如进阶 Mock）。'
  const content = getContent(contentId)
  const nextId = content?.next[0]
  const nextContent = nextId ? getContent(nextId) : undefined
  return nextContent ? `下一步推荐：${nextContent.name}` : null
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState)

  const value = useMemo<AppStore>(() => {
    const incomeEstimate = calcIncomeEstimate(state.user.tierKey, state.income.inputs)
    const starterPack = getStarterPackMeta(state)
    const rewardStatus = getRewardStatus(state)
    const topThreeTasks = recommendTopThreeTasks(state)
    return {
      state,
      incomeEstimate,
      starterPack,
      rewardStatus,
      topThreeTasks,
      setTasksTab: (tab) => setState((prev) => ({ ...prev, ui: { ...prev.ui, tasksTab: tab } })),
      setSelectedGoal: (goal) => setState((prev) => ({ ...prev, ui: { ...prev.ui, selectedGoalKey: goal } })),
      setIncomeInputs: (patch) => setState((prev) => ({ ...prev, income: { inputs: { ...prev.income.inputs, ...patch } } })),
      setStage: (stageKey) => setState((prev) => ({ ...prev, user: { ...prev.user, stageKey } })),
      clearToast: () => setState((prev) => ({ ...prev, ui: { ...prev.ui, toast: null } })),
      markContentStatus: (contentId, status) => {
        setState((prev) => {
          const next: AppState = {
            ...prev,
            progress: {
              ...prev.progress,
              contentStatus: { ...prev.progress.contentStatus, [contentId]: status },
              taskStatus: { ...prev.progress.taskStatus },
              badges: {
                certificate: [...prev.progress.badges.certificate],
                mock: [...prev.progress.badges.mock],
                workshop: [...prev.progress.badges.workshop],
                dinoU: [...prev.progress.badges.dinoU],
              },
              timeline: [...prev.progress.timeline],
            },
            ui: { ...prev.ui },
          }
          const content = getContent(contentId)
          const wasDone = isDone(prev.progress.contentStatus[contentId])
          if (content && !wasDone && isDone(status)) {
            next.user = {
              ...prev.user,
              growthPointsAllTime: prev.user.growthPointsAllTime + content.points,
              growthPointsThisMonth: prev.user.growthPointsThisMonth + content.points,
            }
            next.progress.badges[content.type] = Array.from(new Set([...next.progress.badges[content.type], contentId]))
            next.progress.timeline.unshift({
              at: '今天',
              text: `完成 ${content.name}`,
              points: content.points,
              badge: `${content.type === 'certificate' ? '证书' : content.type === 'mock' ? 'Mock' : content.type === 'workshop' ? 'Workshop' : 'Dino U'} 勋章点亮`,
              contentId,
            })
          }
          syncTaskStatus(next)
          next.ui.toast = nextToast(next, contentId)
          return next
        })
      },
      resetAll: () => setState(defaultState()),
    }
  }, [state])

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const context = useContext(AppStoreContext)
  if (!context) throw new Error('useAppStore must be used within AppStoreProvider')
  return context
}
