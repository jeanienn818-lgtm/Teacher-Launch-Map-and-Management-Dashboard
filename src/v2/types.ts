export type NodeStatus = 'not_started' | 'in_progress' | 'completed'

export type FlowNodeType = 'main' | 'branch'

/** Attached learning assets for integrated training flows */
export type LearningMaterial =
  | {
      kind: 'pdf'
      file: string
      displayTitle: string
    }
  | {
      kind: 'video-docx'
      videoFile: string
      docxFile: string
      displayTitle: string
    }
  | {
      kind: 'video-only'
      videoFile: string
      displayTitle: string
    }
  | {
      kind: 'image'
      file: string
      displayTitle: string
    }

export interface FlowNode {
  id: string
  title: string
  shortTitle?: string
  /** One-line reason for hover tooltip */
  whyMatters?: string
  description: string
  benefit: string
  tags: string[]
  status: NodeStatus
  points: number
  priority: 1 | 2 | 3 | 4
  type: FlowNodeType
  group: 'certificate' | 'mock' | 'workshop' | 'dino' | 'reward' | 'summit'
  /** Main stair only: 1–5 for ordering “best next” along the summit path */
  stairOrder?: number
  learningMaterial?: LearningMaterial
}

export interface TeacherSnapshot {
  teacherShowName: string
  teacherId: string
  completedClassesUntilCutoff: number
  /** Completed Dino U modules for demo state when the pack is still in progress */
  dinoModulesCompleted: number
}

export interface IncomePlanInput {
  plannedClasses: number
  plannedPeakClasses: number
  plannedConversions: number
  /** Combined PB / JG / LR 25-minute completions · +$2 each */
  plannedPbjgLrClasses: number
  /** Short-notice completions (within 24h of class time) · +$2 each */
  plannedShortNoticeClasses: number
}

export interface HotTask {
  id: string
  title: string
  label: string
  /** Optional focus target for quick navigation */
  nodeId?: string
}
