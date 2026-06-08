import type { FlowNode, HotTask, IncomePlanInput, TeacherSnapshot, LearningMaterial } from './types'
import { MATERIAL_PATHS } from './learning/materialPaths'

export interface DemoTeacherPreset {
  id: string
  /** Short label for the demo switcher */
  label: string
  snapshot: TeacherSnapshot
}

/** Lifetime classes (as of the 4th) calibrated to land in Tier 1 / 2 / 3. */
export const DEMO_TEACHER_PRESETS: DemoTeacherPreset[] = [
  {
    id: 'tier1',
    label: 'Tier 1',
    snapshot: {
      teacherShowName: 'Ms. Jamie Brooks',
      teacherId: 'TC-NA-201104',
      completedClassesUntilCutoff: 48,
      dinoModulesCompleted: 0,
    },
  },
  {
    id: 'tier2',
    label: 'Tier 2',
    snapshot: {
      teacherShowName: 'Mr. David Park',
      teacherId: 'TC-NA-308772',
      completedClassesUntilCutoff: 145,
      dinoModulesCompleted: 0,
    },
  },
  {
    id: 'tier3',
    label: 'Tier 3',
    snapshot: {
      teacherShowName: 'Ms. Avery Chen',
      teacherId: 'TC-NA-104928',
      completedClassesUntilCutoff: 328,
      dinoModulesCompleted: 0,
    },
  },
]

export const DEFAULT_DEMO_TEACHER_ID = 'tier3'

export const DEMO_TEACHER_SESSION_KEY = 'tlm_demo_teacher_id'

/** Default demo teacher (Tier 3 · Avery). */
export const teacherSnapshot: TeacherSnapshot =
  DEMO_TEACHER_PRESETS.find((p) => p.id === DEFAULT_DEMO_TEACHER_ID)!.snapshot

export function getDemoTeacherPreset(id: string): DemoTeacherPreset {
  return DEMO_TEACHER_PRESETS.find((p) => p.id === id) ?? DEMO_TEACHER_PRESETS.find((p) => p.id === DEFAULT_DEMO_TEACHER_ID)!
}

export function readDemoTeacherIdFromSession(): string {
  if (typeof window === 'undefined') return DEFAULT_DEMO_TEACHER_ID
  try {
    const stored = window.sessionStorage.getItem(DEMO_TEACHER_SESSION_KEY)
    if (stored && DEMO_TEACHER_PRESETS.some((p) => p.id === stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_DEMO_TEACHER_ID
}

export function writeDemoTeacherIdToSession(id: string) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(DEMO_TEACHER_SESSION_KEY, id)
  } catch {
    /* ignore */
  }
}

export const defaultIncomePlan: IncomePlanInput = {
  plannedClasses: 120,
  plannedPeakClasses: 78,
  plannedConversions: 14,
  plannedPbjgLrClasses: 40,
  plannedShortNoticeClasses: 8,
}

/** Reset calculator when switching teacher */
export const emptyIncomePlan: IncomePlanInput = {
  plannedClasses: 0,
  plannedPeakClasses: 0,
  plannedConversions: 0,
  plannedPbjgLrClasses: 0,
  plannedShortNoticeClasses: 0,
}

const certLv23Learning: LearningMaterial = {
  kind: 'pdf',
  file: MATERIAL_PATHS.certificateLv23Pdf,
  displayTitle: 'Level 2 Educator Playbook',
}

const certLv46Learning: LearningMaterial = {
  kind: 'pdf',
  file: MATERIAL_PATHS.certificateLv46Pdf,
  displayTitle: 'Reading Classics Educator Playbook',
}

const mockLv23Learning: LearningMaterial = {
  kind: 'pdf',
  file: MATERIAL_PATHS.mockLv23Pdf,
  displayTitle: 'Lv3 Super Salad Bowl — trial class guide',
}

const mockLv46Learning: LearningMaterial = {
  kind: 'pdf',
  file: MATERIAL_PATHS.mockLv46Pdf,
  displayTitle: 'Tigerschool Trial Lv3 — practice material',
}

const dinoTprLearning: LearningMaterial = {
  kind: 'video-docx',
  videoFile: MATERIAL_PATHS.dinoTprVideo,
  docxFile: MATERIAL_PATHS.dinoTprDocx,
  displayTitle: 'Using TPR (Total Physical Response)',
}

const dinoProfileLearning: LearningMaterial = {
  kind: 'video-only',
  videoFile: MATERIAL_PATHS.updateProfileVideo,
  displayTitle: 'Update your profile',
}

const dinoClassroomFunctionLearning: LearningMaterial = {
  kind: 'video-only',
  videoFile: MATERIAL_PATHS.classroomFunctionVideo,
  displayTitle: 'Classroom Function',
}

/** Five ascending stair milestones before Peak Summit (Step 6). Certificate Lv1 is not on the main path. */
export const mainFlowNodes: FlowNode[] = [
  {
    id: 'cert-lv23',
    title: 'Core subject certificate Lv2–3',
    whyMatters: 'Unlocks core booking coverage—the foundation of your earning runway.',
    description: 'Foundational scope that unlocks core bookings sooner.',
    benefit: 'Unlocks core booking opportunities sooner.',
    tags: ['Required', 'Certificate'],
    status: 'completed',
    points: 120,
    priority: 1,
    type: 'main',
    group: 'certificate',
    stairOrder: 1,
    learningMaterial: certLv23Learning,
  },
  {
    id: 'cert-lv46',
    title: 'Core Subject Reading Classics Certification',
    whyMatters: 'Widens teachable levels so more peak slots can convert into paid hours.',
    description: 'Broadens the levels you can teach so more slots can fill.',
    benefit: 'Expands teaching scope and earning potential.',
    tags: ['Required', 'Certificate'],
    status: 'in_progress',
    points: 120,
    priority: 1,
    type: 'main',
    group: 'certificate',
    stairOrder: 2,
    learningMaterial: certLv46Learning,
  },
  {
    id: 'mock-lv23',
    title: 'Required mock: Core trial class Lv2–3',
    whyMatters: 'Sharpen trial quality—parents decide quickly based on this performance.',
    description: 'Structured practice on the trial format parents see first.',
    benefit: 'Improves conversion and steady in-class performance.',
    tags: ['Required', 'Mock'],
    status: 'not_started',
    points: 110,
    priority: 2,
    type: 'main',
    group: 'mock',
    stairOrder: 3,
    learningMaterial: mockLv23Learning,
  },
  {
    id: 'workshop-core',
    title: 'Core workshop track',
    shortTitle: 'New Teacher Kick Off · Teaching Skills',
    whyMatters: 'Locks in platform rhythm and classroom habits before bookings scale.',
    description: 'Two guided workshops that lock in platform rhythm and classroom habits.',
    benefit: 'Helps you settle into a steady teaching rhythm faster.',
    tags: ['Workshop track'],
    status: 'in_progress',
    points: 80,
    priority: 3,
    type: 'main',
    group: 'workshop',
    stairOrder: 4,
  },
  {
    id: 'workshop-regular-bookings',
    title: 'Required workshop: How to gain regular bookings',
    whyMatters: 'Turns trials and peaks into predictable recurring bookings.',
    description: 'Focused workshop on converting visibility into steady weekly classes.',
    benefit: 'Improves retention and fills your ongoing schedule more reliably.',
    tags: ['Required', 'Workshop'],
    status: 'not_started',
    points: 72,
    priority: 3,
    type: 'main',
    group: 'workshop',
    stairOrder: 5,
  },
]

const peakSummitLearning: LearningMaterial = {
  kind: 'image',
  file: MATERIAL_PATHS.teacherAchievementImage,
  displayTitle: 'Teacher Achievement',
}

/** Step 6 — destination node (unlocked when Steps 1–5 core + branch tasks are all complete). */
export const peakSummitBase: FlowNode = {
  id: 'peak-summit',
  title: 'Peak Summit',
  whyMatters:
    'Destination milestone after Steps 1–5—complete every core and bonus task on the stair, then unlock the summit for bookings and rewards.',
  description: 'Unlocked when all core stair milestones and Step 1–5 branch tasks are complete.',
  benefit: 'Steadier ongoing bookings and clearer alignment with Top 30% and lucky-draw paths.',
  tags: ['Summit'],
  status: 'not_started',
  points: 0,
  priority: 1,
  type: 'main',
  group: 'summit',
  stairOrder: 6,
  learningMaterial: peakSummitLearning,
}

export const branchFlowNodes: FlowNode[] = [
  {
    id: 'dino-profile-avatar-matters',
    title: 'Profile Avatar Matters',
    whyMatters: 'A clear, professional profile presence helps parents connect with you before the first class.',
    description: 'Short Dino U guidance on profile presentation and trust.',
    benefit: 'Quick win that supports booking confidence.',
    tags: ['Dino U', 'Quick'],
    status: 'not_started',
    points: 12,
    priority: 4,
    type: 'branch',
    group: 'dino',
    learningMaterial: dinoProfileLearning,
  },
  {
    id: 'mock-lv46',
    title: 'Tigerschool Trial Class Lv2',
    whyMatters: 'Optional polish where bookings ramp fastest.',
    description: 'Optional polish on upper-level delivery and pacing.',
    benefit: 'Sharpens classroom consistency where bookings ramp fastest.',
    tags: ['Optional mock', 'Mock'],
    status: 'not_started',
    points: 48,
    priority: 2,
    learningMaterial: mockLv46Learning,
    type: 'branch',
    group: 'mock',
  },
  {
    id: 'dino-tpr',
    title: 'TPR',
    whyMatters: 'Supports younger learners—smooth classes → better reviews.',
    description: 'Total Physical Response essentials for engaging younger students.',
    benefit: 'Stronger engagement without slowing peak pacing.',
    tags: ['Dino U', 'Quick'],
    status: 'not_started',
    points: 16,
    priority: 4,
    type: 'branch',
    group: 'dino',
    learningMaterial: dinoTprLearning,
  },
  {
    id: 'dino-classroom-function',
    title: 'Classroom Function',
    whyMatters: 'Clear classroom routines reduce friction and protect booking quality.',
    description: 'Short orientation to classroom tools and flow.',
    benefit: 'Fewer mid-class surprises as your schedule fills.',
    tags: ['Dino U', 'Quick'],
    status: 'not_started',
    points: 16,
    priority: 4,
    type: 'branch',
    group: 'dino',
    learningMaterial: dinoClassroomFunctionLearning,
  },
  {
    id: 'branch-ws-regular-students',
    title: 'How to gain regular students',
    whyMatters: 'Recurring students stabilize income and simplify planning.',
    description: 'Workshop-style guidance on building a steady returning roster.',
    benefit: 'Pairs with your core workshop track for stronger retention.',
    tags: ['Workshop', 'Branch'],
    status: 'not_started',
    points: 16,
    priority: 3,
    type: 'branch',
    group: 'workshop',
  },
  {
    id: 'branch-ws-regular-bookings',
    title: 'Time Management',
    whyMatters: 'Turns trials and peaks into predictable recurring bookings.',
    description: 'Focused guidance on converting visibility into steady weekly classes.',
    benefit: 'Improves retention and fills your ongoing schedule more reliably.',
    tags: ['Workshop', 'Branch'],
    status: 'not_started',
    points: 14,
    priority: 3,
    type: 'branch',
    group: 'workshop',
  },
]

export const hotTasks: HotTask[] = [
  { id: 'h1', title: 'Finish Core subject certificate Lv4–6', label: 'Main stair · Step 2', nodeId: 'cert-lv46' },
  { id: 'h2', title: 'Book required mock: Core trial Lv2–3', label: 'Main stair · Step 3', nodeId: 'mock-lv23' },
  { id: 'h3', title: 'Complete a Dino U bonus module', label: 'Fast points', nodeId: 'dino-tpr' },
]

/** Growth Points threshold for Top 30% reward zone (demo calibration). */
export const rewardThreshold = 176

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

/** Demo dashboard with curriculum seed progress and the selected preset teacher. */
export function cloneDemoDashboardFromSeed(demoTeacherId: string = DEFAULT_DEMO_TEACHER_ID) {
  const preset = getDemoTeacherPreset(demoTeacherId)
  return {
    teacher: deepClone(preset.snapshot),
    mainFlow: deepClone(mainFlowNodes),
    branchFlow: deepClone(branchFlowNodes),
    peakSummit: deepClone(peakSummitBase),
  }
}

/** New teacher session: clean progress, same curriculum definitions. */
export function createFreshDashboardForTeacher(teacherShowName: string) {
  const id = `TC-NA-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  const main = deepClone(mainFlowNodes).map((n) => ({ ...n, status: 'not_started' as const }))
  const branch = deepClone(branchFlowNodes).map((n) => ({ ...n, status: 'not_started' as const }))
  const summit = { ...deepClone(peakSummitBase), status: 'not_started' as const }
  return {
    teacher: {
      teacherShowName: teacherShowName.trim() || 'Teacher',
      teacherId: id,
      completedClassesUntilCutoff: 0,
      dinoModulesCompleted: 0,
    } satisfies TeacherSnapshot,
    mainFlow: main,
    branchFlow: branch,
    peakSummit: summit,
  }
}
