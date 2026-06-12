import { useMemo } from 'react'
import type { LearningSessionProps } from './types'

function absUrl(assetBase: string, path: string) {
  if (path.startsWith('http')) return path
  return new URL(path, assetBase).toString()
}

export interface DinoVideoOnlyLearningViewProps extends LearningSessionProps {
  completionNodeId: string
  kicker?: string
  headline: string
  subline?: string
  videoRelPath: string
  fileHintName: string
}

export function DinoVideoOnlyLearningView({
  onBack,
  onMarkCompleted,
  assetBase,
  completed = false,
  completionNodeId,
  kicker = 'Dino U',
  headline,
  subline = 'Video · bonus module',
  videoRelPath,
  fileHintName,
}: DinoVideoOnlyLearningViewProps) {
  const videoSrc = useMemo(() => absUrl(assetBase, videoRelPath), [assetBase, videoRelPath])

  return (
    <div className="learning-fullscreen">
      <header className="learning-header">
        <div className="learning-header-left">
          <button type="button" className="learning-back-btn" onClick={onBack}>
            ← Back to map
          </button>
          <div>
            <p className="learning-kicker">{kicker}</p>
            <h1 className="learning-title">{headline}</h1>
            <p className="learning-sub">{subline}</p>
          </div>
        </div>
        <div className="learning-header-actions">
          {!completed ? (
            <button type="button" className="learning-complete-primary" onClick={() => onMarkCompleted(completionNodeId)}>
              Mark as completed
            </button>
          ) : (
            <span className="learning-status-pill">Completed on map</span>
          )}
        </div>
      </header>

      <div className="learning-body">
        <section className="learning-video-card">
          <h2 className="learning-section-title">Module video</h2>
          <div className="learning-video-wrap">
            <video className="learning-video" controls playsInline preload="metadata" src={videoSrc}>
              <track kind="captions" />
            </video>
          </div>
          <p className="learning-video-hint">
            Files should live in <code>public/Materials/</code> (e.g. <code>{fileHintName}</code>).
          </p>
        </section>
      </div>
    </div>
  )
}
