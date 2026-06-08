import { useEffect, useMemo, useRef } from 'react'
import type { LearningMaterial } from '../types'
import type { LearningSessionProps } from './types'

export interface ImageLearningViewProps extends LearningSessionProps {
  nodeId: string
  kicker: string
  pageTitle: string
  material: Extract<LearningMaterial, { kind: 'image' }>
  /** When false, hide Mark as completed / completed pill in the header. */
  showMarkCompleted?: boolean
  /** When true, mark the map task complete once the certificate is shown (no overlay close). */
  autoMarkOnView?: boolean
}

function fileNameFromPath(path: string): string {
  const name = path.split('/').pop()
  return name?.replace(/\s+/g, '-') ?? 'certificate.png'
}

async function downloadImageFile(imageUrl: string, filename: string) {
  try {
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  } catch {
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = filename
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

export function ImageLearningView({
  nodeId,
  kicker,
  pageTitle,
  onBack,
  onMarkCompleted,
  assetBase,
  material,
  completed = false,
  showMarkCompleted = true,
  autoMarkOnView = false,
}: ImageLearningViewProps) {
  const autoMarkedRef = useRef(false)
  const imageUrl = useMemo(() => {
    const path = material.file.startsWith('/') ? material.file : `/${material.file}`
    return `${assetBase.replace(/\/$/, '')}${encodeURI(path)}`
  }, [assetBase, material.file])

  const downloadName = useMemo(() => fileNameFromPath(material.file), [material.file])

  useEffect(() => {
    if (!autoMarkOnView || completed || autoMarkedRef.current) return
    autoMarkedRef.current = true
    onMarkCompleted(nodeId)
  }, [autoMarkOnView, completed, nodeId, onMarkCompleted])

  const isSummitCertificate = autoMarkOnView

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
        {isSummitCertificate ? (
          <div className="learning-header-actions">
            <button
              type="button"
              className="learning-download-primary"
              onClick={() => downloadImageFile(imageUrl, downloadName)}
            >
              Download certificate
            </button>
          </div>
        ) : showMarkCompleted ? (
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
          <h2 className="learning-section-title">
            {isSummitCertificate ? 'Your achievement certificate' : 'Learning material'}
          </h2>
          <p className="learning-muted">
            {isSummitCertificate
              ? 'Congratulations — save your certificate below. This milestone is recorded on your map.'
              : 'Your achievement overview opens below.'}
          </p>
          <div className="learning-ppt-frame learning-image-frame">
            <img className="learning-image" src={imageUrl} alt={material.displayTitle} />
          </div>
          {isSummitCertificate ? (
            <div className="learning-cert-actions">
              <button
                type="button"
                className="learning-download-secondary"
                onClick={() => downloadImageFile(imageUrl, downloadName)}
              >
                Download certificate
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
