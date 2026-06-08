export type GuideBarMode = 'default' | 'next' | 'reward' | 'booking'

interface StickyGuideBarProps {
  mode: GuideBarMode
  message: string
  subline?: string
}

export function StickyGuideBar({ mode, message, subline }: StickyGuideBarProps) {
  return (
    <div className="sticky-guide-bar" role="region" aria-label="Coaching guide">
      <div className="sticky-guide-inner">
        <div className="guide-pills">
          <span className="guide-pill">GUIDE</span>
          {mode === 'next' && <span className="guide-pill guide-pill--hot">NEXT STEP</span>}
          {mode === 'reward' && <span className="guide-pill guide-pill--amber">FOCUS</span>}
          {mode === 'booking' && <span className="guide-pill guide-pill--teal">FOCUS</span>}
          {mode === 'default' && <span className="guide-pill guide-pill--muted">OVERVIEW</span>}
        </div>
        <div className="guide-copy">
          <p className="guide-main">{message}</p>
          {subline ? <p className="guide-sub">{subline}</p> : null}
        </div>
      </div>
    </div>
  )
}
