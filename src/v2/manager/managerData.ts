export type ManagerStepKey = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'summit'

export type ManagerSegment = '高增长老师' | '正常推进' | '需要关注' | '高风险'

export interface ManagerTeacherRecord {
  teacherName: string
  teacherId: string
  daysSinceOnboarding: number
  currentStep: ManagerStepKey
  completedStepIndex: number
  lastTrainingActivityDate: string
  daysStuck: number
  completedClasses: number
  peakTimeCompleted: number
  trialConversion: number
  hasFirstRegularStudent: boolean
  timeToFirstRegularStudent: number | null
  regularStudentGrowth: 'none' | 'new' | 'steady' | 'growing'
  stepDays: Record<ManagerStepKey, number>
}

export interface ManagerFunnelStep {
  key: ManagerStepKey
  label: string
  shortLabel: string
  order: number
}

export const MANAGER_FUNNEL_STEPS: ManagerFunnelStep[] = [
  { key: 'step1', label: 'Step 1 基础证书', shortLabel: '基础证书', order: 1 },
  { key: 'step2', label: 'Step 2 进阶证书', shortLabel: '进阶证书', order: 2 },
  { key: 'step3', label: 'Step 3 Paid Mock', shortLabel: 'Paid Mock', order: 3 },
  { key: 'step4', label: 'Step 4 Workshop 1', shortLabel: 'Workshop 1', order: 4 },
  { key: 'step5', label: 'Step 5 Workshop 2', shortLabel: 'Workshop 2', order: 5 },
  { key: 'summit', label: 'Peak Summit / 增长阶段', shortLabel: '增长阶段', order: 6 },
]

export const MANAGER_TEACHERS: ManagerTeacherRecord[] = [
  {
    teacherName: 'Ms. Avery Chen',
    teacherId: 'TC-NA-104928',
    daysSinceOnboarding: 43,
    currentStep: 'step2',
    completedStepIndex: 1,
    lastTrainingActivityDate: '2026-06-08',
    daysStuck: 9,
    completedClasses: 96,
    peakTimeCompleted: 54,
    trialConversion: 18,
    hasFirstRegularStudent: true,
    timeToFirstRegularStudent: 16,
    regularStudentGrowth: 'growing',
    stepDays: { step1: 5, step2: 9, step3: 0, step4: 0, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Mr. David Park',
    teacherId: 'TC-NA-308772',
    daysSinceOnboarding: 51,
    currentStep: 'step4',
    completedStepIndex: 3,
    lastTrainingActivityDate: '2026-06-05',
    daysStuck: 6,
    completedClasses: 145,
    peakTimeCompleted: 81,
    trialConversion: 26,
    hasFirstRegularStudent: true,
    timeToFirstRegularStudent: 11,
    regularStudentGrowth: 'growing',
    stepDays: { step1: 3, step2: 5, step3: 6, step4: 6, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Ms. Jamie Brooks',
    teacherId: 'TC-NA-201104',
    daysSinceOnboarding: 28,
    currentStep: 'step2',
    completedStepIndex: 1,
    lastTrainingActivityDate: '2026-06-09',
    daysStuck: 4,
    completedClasses: 48,
    peakTimeCompleted: 22,
    trialConversion: 9,
    hasFirstRegularStudent: true,
    timeToFirstRegularStudent: 23,
    regularStudentGrowth: 'steady',
    stepDays: { step1: 4, step2: 4, step3: 0, step4: 0, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Mr. Lucas Meyer',
    teacherId: 'TC-NA-442190',
    daysSinceOnboarding: 36,
    currentStep: 'step3',
    completedStepIndex: 2,
    lastTrainingActivityDate: '2026-05-29',
    daysStuck: 15,
    completedClasses: 34,
    peakTimeCompleted: 9,
    trialConversion: 4,
    hasFirstRegularStudent: false,
    timeToFirstRegularStudent: null,
    regularStudentGrowth: 'none',
    stepDays: { step1: 5, step2: 8, step3: 15, step4: 0, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Ms. Priya Shah',
    teacherId: 'TC-NA-771234',
    daysSinceOnboarding: 57,
    currentStep: 'step2',
    completedStepIndex: 1,
    lastTrainingActivityDate: '2026-05-18',
    daysStuck: 24,
    completedClasses: 11,
    peakTimeCompleted: 3,
    trialConversion: 1,
    hasFirstRegularStudent: false,
    timeToFirstRegularStudent: null,
    regularStudentGrowth: 'none',
    stepDays: { step1: 7, step2: 24, step3: 0, step4: 0, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Mr. Ethan Ross',
    teacherId: 'TC-NA-663810',
    daysSinceOnboarding: 49,
    currentStep: 'step5',
    completedStepIndex: 4,
    lastTrainingActivityDate: '2026-06-07',
    daysStuck: 5,
    completedClasses: 88,
    peakTimeCompleted: 47,
    trialConversion: 13,
    hasFirstRegularStudent: true,
    timeToFirstRegularStudent: 18,
    regularStudentGrowth: 'growing',
    stepDays: { step1: 4, step2: 6, step3: 8, step4: 5, step5: 5, summit: 0 },
  },
  {
    teacherName: 'Ms. Sofia Garcia',
    teacherId: 'TC-NA-519002',
    daysSinceOnboarding: 22,
    currentStep: 'step1',
    completedStepIndex: 0,
    lastTrainingActivityDate: '2026-06-06',
    daysStuck: 5,
    completedClasses: 18,
    peakTimeCompleted: 10,
    trialConversion: 3,
    hasFirstRegularStudent: false,
    timeToFirstRegularStudent: null,
    regularStudentGrowth: 'none',
    stepDays: { step1: 5, step2: 0, step3: 0, step4: 0, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Mr. Noah Kim',
    teacherId: 'TC-NA-839451',
    daysSinceOnboarding: 60,
    currentStep: 'step4',
    completedStepIndex: 3,
    lastTrainingActivityDate: '2026-05-23',
    daysStuck: 19,
    completedClasses: 39,
    peakTimeCompleted: 7,
    trialConversion: 5,
    hasFirstRegularStudent: true,
    timeToFirstRegularStudent: 42,
    regularStudentGrowth: 'new',
    stepDays: { step1: 6, step2: 10, step3: 9, step4: 19, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Ms. Emma Wilson',
    teacherId: 'TC-NA-114982',
    daysSinceOnboarding: 33,
    currentStep: 'step3',
    completedStepIndex: 2,
    lastTrainingActivityDate: '2026-06-04',
    daysStuck: 8,
    completedClasses: 62,
    peakTimeCompleted: 36,
    trialConversion: 11,
    hasFirstRegularStudent: true,
    timeToFirstRegularStudent: 27,
    regularStudentGrowth: 'steady',
    stepDays: { step1: 3, step2: 5, step3: 8, step4: 0, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Mr. Ben Carter',
    teacherId: 'TC-NA-490761',
    daysSinceOnboarding: 45,
    currentStep: 'step1',
    completedStepIndex: 0,
    lastTrainingActivityDate: '2026-05-16',
    daysStuck: 26,
    completedClasses: 6,
    peakTimeCompleted: 1,
    trialConversion: 0,
    hasFirstRegularStudent: false,
    timeToFirstRegularStudent: null,
    regularStudentGrowth: 'none',
    stepDays: { step1: 26, step2: 0, step3: 0, step4: 0, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Ms. Olivia Brown',
    teacherId: 'TC-NA-627305',
    daysSinceOnboarding: 55,
    currentStep: 'summit',
    completedStepIndex: 5,
    lastTrainingActivityDate: '2026-06-10',
    daysStuck: 2,
    completedClasses: 121,
    peakTimeCompleted: 68,
    trialConversion: 21,
    hasFirstRegularStudent: true,
    timeToFirstRegularStudent: 14,
    regularStudentGrowth: 'growing',
    stepDays: { step1: 3, step2: 5, step3: 5, step4: 6, step5: 4, summit: 2 },
  },
  {
    teacherName: 'Mr. Daniel Li',
    teacherId: 'TC-NA-735902',
    daysSinceOnboarding: 41,
    currentStep: 'step5',
    completedStepIndex: 4,
    lastTrainingActivityDate: '2026-05-27',
    daysStuck: 17,
    completedClasses: 53,
    peakTimeCompleted: 14,
    trialConversion: 6,
    hasFirstRegularStudent: false,
    timeToFirstRegularStudent: null,
    regularStudentGrowth: 'none',
    stepDays: { step1: 5, step2: 6, step3: 7, step4: 6, step5: 17, summit: 0 },
  },
  {
    teacherName: 'Ms. Mia Thompson',
    teacherId: 'TC-NA-882110',
    daysSinceOnboarding: 18,
    currentStep: 'step2',
    completedStepIndex: 1,
    lastTrainingActivityDate: '2026-06-11',
    daysStuck: 1,
    completedClasses: 27,
    peakTimeCompleted: 16,
    trialConversion: 5,
    hasFirstRegularStudent: true,
    timeToFirstRegularStudent: 15,
    regularStudentGrowth: 'new',
    stepDays: { step1: 4, step2: 1, step3: 0, step4: 0, step5: 0, summit: 0 },
  },
  {
    teacherName: 'Mr. Henry Adams',
    teacherId: 'TC-NA-901472',
    daysSinceOnboarding: 52,
    currentStep: 'step3',
    completedStepIndex: 2,
    lastTrainingActivityDate: '2026-05-20',
    daysStuck: 22,
    completedClasses: 24,
    peakTimeCompleted: 4,
    trialConversion: 2,
    hasFirstRegularStudent: false,
    timeToFirstRegularStudent: null,
    regularStudentGrowth: 'none',
    stepDays: { step1: 6, step2: 7, step3: 22, step4: 0, step5: 0, summit: 0 },
  },
]

export function managerTierFromCompletedClasses(completedClasses: number): 'Tier 1' | 'Tier 2' | 'Tier 3' {
  if (completedClasses >= 200) return 'Tier 3'
  if (completedClasses >= 80) return 'Tier 2'
  return 'Tier 1'
}

export function resolveManagerSegment(teacher: ManagerTeacherRecord): ManagerSegment {
  const tier = managerTierFromCompletedClasses(teacher.completedClasses)
  const highGrowth =
    tier !== 'Tier 1' ||
    teacher.completedClasses >= 80 ||
    (teacher.hasFirstRegularStudent && teacher.regularStudentGrowth === 'growing')
  if (highGrowth) return '高增长老师'

  const atRisk =
    teacher.daysStuck > 21 &&
    teacher.completedClasses < 25 &&
    !teacher.hasFirstRegularStudent &&
    teacher.peakTimeCompleted < 8
  if (atRisk) return '高风险'

  const needAttention =
    teacher.daysStuck > 14 &&
    (teacher.completedClasses < 55 || !teacher.hasFirstRegularStudent || teacher.peakTimeCompleted < 16)
  if (needAttention) return '需要关注'

  return '正常推进'
}

export function recommendedManagerAction(teacher: ManagerTeacherRecord): string {
  const segment = resolveManagerSegment(teacher)
  if (segment === '高增长老师') {
    return '邀请分享经验；沉淀成功案例；鼓励继续开放 Peak Time。'
  }
  if (segment === '正常推进') {
    return '持续轻提醒下一步；仅使用自动提醒即可。'
  }
  if (segment === '需要关注') {
    return '发送定向提醒；提供激励；推荐下一步培训动作。'
  }
  return '人工跟进；诊断卡点原因；考虑个性化支持。'
}

export function stepLabel(key: ManagerStepKey): string {
  return MANAGER_FUNNEL_STEPS.find((step) => step.key === key)?.shortLabel ?? key
}
