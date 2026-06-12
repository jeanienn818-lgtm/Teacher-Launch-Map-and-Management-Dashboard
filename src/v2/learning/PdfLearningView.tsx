import { useMemo } from 'react'
import type { LearningMaterial } from '../types'
import type { LearningSessionProps } from './types'

export interface PdfLearningViewProps extends LearningSessionProps {
  nodeId: string
  kicker: string
  pageTitle: string
  material: Extract<LearningMaterial, { kind: 'pdf' }>
  /** When false, hide Mark as completed / completed pill (e.g. Step 3 mock PDFs). */
  showMarkCompleted?: boolean
}

export function PdfLearningView({
  nodeId,
  kicker,
  pageTitle,
  onBack,
  onMarkCompleted,
  assetBase,
  material,
  completed = false,
  showMarkCompleted = true,
}: PdfLearningViewProps) {
  const fileUrl = useMemo(() => {
    if (material.file.startsWith('http')) return material.file
    return new URL(material.file, assetBase).toString()
  }, [assetBase, material.file])

  return (
    <div className="learning-fullscreen">
      <header className="learning-header">
        <div className="learning-header-left">
          <button type="button" className="learning-back-btn" onClick={onBack}>
            ← Back to map
          </button>
          <div>
            <p className="learning-kicker">{kicker}</p>
            <h1 className="learning-title">{pageTitle}</h1>
            <p className="learning-sub">{material.displayTitle}</p>
          </div>
        </div>
        {showMarkCompleted ? (
          <div className="learning-header-actions">
            {!completed ? (
              <button type="button" className="learning-complete-primary" onClick={() => onMarkCompleted(nodeId)}>
                Mark as completed
              </button>
            ) : (
              <span className="learning-status-pill">Completed on map</span>
            )}
          </div>
        ) : null}
      </header>

      <div className="learning-body learning-body--single">
        <section className="learning-ppt-card">
          <h2 className="learning-section-title">Learning material</h2>
          <p className="learning-muted">The PDF opens below in your browser&apos;s viewer (works on local dev).</p>
          <div className="learning-ppt-frame">
            <iframe title={material.displayTitle} className="learning-ppt-iframe" src={fileUrl} />
          </div>
        </section>
      </div>
    </div>
  )
}
