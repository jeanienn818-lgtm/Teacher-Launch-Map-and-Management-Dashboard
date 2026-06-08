import type { FlowNode, LearningMaterial } from '../types'

export type PdfLearningRoute = {
  kind: 'pdf'
  key: 'cert-lv23' | 'cert-lv46' | 'mock-lv23' | 'mock-lv46'
  nodeId: string
  title: string
  kicker: string
  material: Extract<LearningMaterial, { kind: 'pdf' }>
}

export type VideoOnlyLearningRoute = {
  kind: 'video-only'
  nodeId: string
  title: string
  kicker: string
  subline: string
  videoRelPath: string
  fileHintName: string
}

export type ImageLearningRoute = {
  kind: 'image'
  nodeId: 'peak-summit'
  title: string
  kicker: string
  material: Extract<LearningMaterial, { kind: 'image' }>
}

export type LearningRoute =
  | PdfLearningRoute
  | VideoOnlyLearningRoute
  | ImageLearningRoute
  | { kind: 'video-docx'; key: 'dino-tpr'; nodeId: 'dino-tpr' }

export interface LearningSessionProps {
  onBack: () => void
  onMarkCompleted: (nodeId: string) => void
  assetBase: string
  /** When true, hide primary completion CTA (already done on map) */
  completed?: boolean
}

function fileHintFromPath(path: string): string {
  const name = path.split('/').pop()
  return name ?? path
}

function learningKicker(node: Pick<FlowNode, 'id' | 'group'>): string {
  if (node.group === 'summit') return 'Peak Summit · Step 6'
  if (node.group === 'mock') return 'Mock · Step 3'
  if (node.group === 'certificate') {
    return node.id === 'cert-lv23' ? 'Certificate · Step 1' : 'Certificate · Step 2'
  }
  if (node.group === 'dino') {
    if (node.id === 'dino-profile-avatar-matters') return 'Dino U · Step 1'
    return 'Dino U'
  }
  return 'Training'
}

function pdfLearningRoute(node: Pick<FlowNode, 'id' | 'title' | 'learningMaterial' | 'group'>): PdfLearningRoute | null {
  if (!node.learningMaterial || node.learningMaterial.kind !== 'pdf') return null
  const key = node.id as PdfLearningRoute['key']
  if (key !== 'cert-lv23' && key !== 'cert-lv46' && key !== 'mock-lv23' && key !== 'mock-lv46') return null
  return {
    kind: 'pdf',
    key,
    nodeId: node.id,
    title: node.title,
    kicker: learningKicker(node),
    material: node.learningMaterial,
  }
}

function imageLearningRoute(node: Pick<FlowNode, 'id' | 'title' | 'learningMaterial' | 'group'>): ImageLearningRoute | null {
  if (!node.learningMaterial || node.learningMaterial.kind !== 'image') return null
  if (node.id !== 'peak-summit') return null
  return {
    kind: 'image',
    nodeId: 'peak-summit',
    title: node.title,
    kicker: learningKicker(node),
    material: node.learningMaterial,
  }
}

function videoOnlyLearningRoute(
  node: Pick<FlowNode, 'id' | 'title' | 'learningMaterial' | 'group'>,
): VideoOnlyLearningRoute | null {
  if (!node.learningMaterial || node.learningMaterial.kind !== 'video-only') return null
  return {
    kind: 'video-only',
    nodeId: node.id,
    title: node.title,
    kicker: learningKicker(node),
    subline: node.learningMaterial.displayTitle,
    videoRelPath: node.learningMaterial.videoFile,
    fileHintName: fileHintFromPath(node.learningMaterial.videoFile),
  }
}

export function nodeHasLearningMaterial(
  node: Pick<FlowNode, 'id' | 'title' | 'learningMaterial' | 'group'>,
): LearningRoute | null {
  const pdf = pdfLearningRoute(node)
  if (pdf) return pdf
  const videoOnly = videoOnlyLearningRoute(node)
  if (videoOnly) return videoOnly
  const image = imageLearningRoute(node)
  if (image) return image
  if (node.id === 'dino-tpr') return { kind: 'video-docx', key: 'dino-tpr', nodeId: 'dino-tpr' }
  return null
}

export function isLearningRouteForNode(route: LearningRoute | null, nodeId: string): boolean {
  return route?.nodeId === nodeId
}

export type FlowNodeWithLearning = FlowNode
