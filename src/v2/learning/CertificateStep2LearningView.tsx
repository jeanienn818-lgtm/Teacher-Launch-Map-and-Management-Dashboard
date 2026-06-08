import type { LearningMaterial } from '../types'
import type { LearningSessionProps } from './types'
import { PdfLearningView } from './PdfLearningView'

export function CertificateStep2LearningView({
  onBack,
  onMarkCompleted,
  assetBase,
  material,
  completed = false,
}: LearningSessionProps & { material: Extract<LearningMaterial, { kind: 'pdf' }> }) {
  return (
    <PdfLearningView
      nodeId="cert-lv46"
      kicker="Certificate · Step 2"
      pageTitle="Core Subject Reading Classics Certification"
      material={material}
      assetBase={assetBase}
      completed={completed}
      onBack={onBack}
      onMarkCompleted={onMarkCompleted}
    />
  )
}
