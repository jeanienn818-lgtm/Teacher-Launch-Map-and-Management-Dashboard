import type { LearningRoute } from './types'
import { DinoTprLearningView } from './DinoTprLearningView'
import { DinoVideoOnlyLearningView } from './DinoVideoOnlyLearningView'
import { ImageLearningView } from './ImageLearningView'
import { PdfLearningView } from './PdfLearningView'

interface LearningOverlayProps {
  route: LearningRoute
  assetBase: string
  completed: boolean
  onClose: () => void
  onMarkCompleted: (nodeId: string) => void
}

export function LearningOverlay({ route, assetBase, completed, onClose, onMarkCompleted }: LearningOverlayProps) {
  const handleComplete = (nodeId: string) => {
    onMarkCompleted(nodeId)
    onClose()
  }

  return (
    <div className="learning-overlay-root" role="presentation">
      <div className="learning-overlay-backdrop" onClick={onClose} aria-hidden />
      <div className="learning-overlay-panel" role="dialog" aria-modal="true" aria-label="Learning module">
        {route.kind === 'image' ? (
          <ImageLearningView
            nodeId={route.nodeId}
            kicker={route.kicker}
            pageTitle={route.title}
            material={route.material}
            assetBase={assetBase}
            completed={completed}
            showMarkCompleted={false}
            autoMarkOnView={route.nodeId === 'peak-summit'}
            onBack={onClose}
            onMarkCompleted={onMarkCompleted}
          />
        ) : route.kind === 'pdf' ? (
          <PdfLearningView
            nodeId={route.nodeId}
            kicker={route.kicker}
            pageTitle={route.title}
            material={route.material}
            assetBase={assetBase}
            completed={completed}
            showMarkCompleted={route.key === 'cert-lv23' || route.key === 'cert-lv46'}
            onBack={onClose}
            onMarkCompleted={handleComplete}
          />
        ) : route.kind === 'video-docx' ? (
          <DinoTprLearningView
            assetBase={assetBase}
            completed={completed}
            onBack={onClose}
            onMarkCompleted={handleComplete}
            completionNodeId={route.nodeId}
          />
        ) : (
          <DinoVideoOnlyLearningView
            assetBase={assetBase}
            completed={completed}
            onBack={onClose}
            onMarkCompleted={handleComplete}
            completionNodeId={route.nodeId}
            kicker={route.kicker}
            headline={route.title}
            subline={route.subline}
            videoRelPath={route.videoRelPath}
            fileHintName={route.fileHintName}
          />
        )}
      </div>
    </div>
  )
}
