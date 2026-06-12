import { useEffect, useMemo, useState } from 'react'
import type { LearningSessionProps } from './types'
import { DinoTprStaticSections } from './dinoTprStaticContent'
import { MATERIAL_PATHS } from './materialPaths'

function absUrl(assetBase: string, path: string) {
  if (path.startsWith('http')) return path
  return new URL(path, assetBase).toString()
}

export function DinoTprLearningView({
  onBack,
  onMarkCompleted,
  assetBase,
  completed = false,
  completionNodeId = 'dino-tpr',
}: LearningSessionProps & { completionNodeId?: string }) {
  const [docHtml, setDocHtml] = useState<string | null>(null)
  const [docError, setDocError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const videoSrc = useMemo(() => absUrl(assetBase, MATERIAL_PATHS.dinoTprVideo), [assetBase])
  const docxSrc = useMemo(() => absUrl(assetBase, MATERIAL_PATHS.dinoTprDocx), [assetBase])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setDocError(null)
    fetch(docxSrc)
      .then((r) => {
        if (!r.ok) throw new Error('Could not load document')
        return r.arrayBuffer()
      })
      .then((buf) => import('mammoth').then((m) => m.default.convertToHtml({ arrayBuffer: buf })))
      .then((result) => {
        if (!cancelled) {
          setDocHtml(result.value)
          if (result.messages.length) {
            // Mammoth warnings are non-fatal
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDocHtml(null)
          setDocError('Using curated on-page content — add the DOCX to public/Materials for the live import.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [docxSrc])

  return (
    <div className="learning-fullscreen">
      <header className="learning-header">
        <div className="learning-header-left">
          <button type="button" className="learning-back-btn" onClick={onBack}>
            ← Back to map
          </button>
          <div>
            <p className="learning-kicker">Dino U</p>
            <h1 className="learning-title">TPR — Total Physical Response</h1>
            <p className="learning-sub">Video + reading · bonus module</p>
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
            Use captions in your browser if available. Files should live in <code>public/Materials/</code> (e.g.{' '}
            <code>Dino-U TPR.mp4</code>).
          </p>
        </section>

        <section className="learning-text-card">
          <h2 className="learning-section-title">Reading &amp; guidance</h2>
          {loading ? <p className="learning-muted">Loading document…</p> : null}
          {docError ? <p className="learning-inline-note">{docError}</p> : null}
          {docHtml ? (
            <article className="learning-mammoth-html" dangerouslySetInnerHTML={{ __html: docHtml }} />
          ) : !loading ? (
            <DinoTprStaticSections />
          ) : null}
        </section>
      </div>
    </div>
  )
}
