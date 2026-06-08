import { useEffect, useMemo, type CSSProperties } from 'react'
import { getCelebrationDisplayMs } from '../celebration/celebrationTiming'

export interface ActiveCelebration {
  level: 1 | 2 | 3 | 4
  nodeId: string
  toastPrimary: string
  toastSecondary?: string
}

interface CelebrationLayerProps {
  active: ActiveCelebration | null
  onDismiss: () => void
}

function ConfettiBurst({ intensity }: { intensity: 'medium' | 'strong' }) {
  const pieces = useMemo(() => {
    const count = intensity === 'strong' ? 32 : 16
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35
      const dist = intensity === 'strong' ? 92 + Math.random() * 110 : 64 + Math.random() * 72
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist * -0.85
      const delay = Math.random() * 0.12
      const duration = intensity === 'strong' ? 2.45 + Math.random() * 0.35 : 2.05 + Math.random() * 0.25
      const hue = [38, 43, 210, 145, 32][i % 5]!
      return { i, dx, dy, delay, duration, hue }
    })
  }, [intensity])

  return (
    <div className="celebration-confetti-root" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.i}
          className="celebration-confetti-piece"
          style={
            {
              '--cele-dx': `${p.dx}px`,
              '--cele-dy': `${p.dy}px`,
              '--cele-delay': `${p.delay}s`,
              '--cele-dur': `${p.duration}s`,
              '--cele-hue': `${p.hue}`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

function FireworksBurst() {
  const bursts = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        i,
        left: 12 + ((i * 41) % 76),
        top: 20 + ((i * 23) % 42),
        delay: (i % 8) * 0.07,
        dur: 0.85 + (i % 4) * 0.12,
      })),
    [],
  )

  return (
    <div className="celebration-fireworks-root" aria-hidden>
      {bursts.map((b) => (
        <span
          key={b.i}
          className="celebration-firework-burst"
          style={
            {
              left: `${b.left}%`,
              top: `${b.top}%`,
              '--cele-fw-delay': `${b.delay}s`,
              '--cele-fw-dur': `${b.dur}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

function SummitTrophyGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="44"
      height="44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-.88 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.45 1 .88 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

export function CelebrationLayer({ active, onDismiss }: CelebrationLayerProps) {
  useEffect(() => {
    if (!active) return
    const ms = getCelebrationDisplayMs(active.level)
    const t = window.setTimeout(onDismiss, ms)
    return () => window.clearTimeout(t)
  }, [active, onDismiss])

  if (!active) return null

  const showConfetti = active.level >= 2

  return (
    <div className="celebration-layer-root" aria-live="polite">
      {showConfetti ? <ConfettiBurst intensity={active.level === 3 || active.level === 4 ? 'strong' : 'medium'} /> : null}

      {active.level === 4 ? <FireworksBurst /> : null}

      {active.level === 3 ? (
        <div className="celebration-l3-scrim" aria-hidden />
      ) : active.level === 4 ? (
        <div className="celebration-summit-scrim" aria-hidden />
      ) : null}

      {active.level === 3 ? (
        <div className="celebration-l3-center" role="dialog" aria-labelledby="celebration-bonus-title">
          <div className="celebration-l3-card">
            <p className="celebration-l3-kicker">Onboarding bonus</p>
            <h2 id="celebration-bonus-title" className="celebration-l3-title">
              {active.toastPrimary}
            </h2>
            <p className="celebration-l3-sub">
              You unlocked your <span className="celebration-l3-money">$15</span> onboarding bonus!
            </p>
            <p className="celebration-l3-foot">
              Fixed <span className="celebration-l3-money">$15</span> onboarding reward — separate from the Top 30% Lucky Draw.
            </p>
            <button type="button" className="celebration-ok-btn" onClick={onDismiss}>
              OK
            </button>
          </div>
        </div>
      ) : active.level === 4 ? (
        <div className="celebration-summit-center" role="dialog" aria-labelledby="celebration-summit-title">
          <div className="celebration-summit-card">
            <SummitTrophyGlyph className="celebration-summit-trophy" />
            <h2 id="celebration-summit-title" className="celebration-summit-title">
              {active.toastPrimary}
            </h2>
            <p className="celebration-summit-tagline-v26">
              Open more PPT timeslots and enjoy teaching with VIPTeacher!
            </p>
            <button type="button" className="celebration-ok-btn celebration-ok-btn--summit" onClick={onDismiss}>
              OK
            </button>
          </div>
        </div>
      ) : (
        <div className={`celebration-toast celebration-toast--map-float celebration-toast--l${active.level}`}>
          <strong className="celebration-toast-title">{active.toastPrimary}</strong>
          <button type="button" className="celebration-ok-btn celebration-ok-btn--toast" onClick={onDismiss}>
            OK
          </button>
        </div>
      )}
    </div>
  )
}
