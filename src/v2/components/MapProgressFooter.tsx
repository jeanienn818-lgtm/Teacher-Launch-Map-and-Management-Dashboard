export interface MapProgressFooterProps {
  growthScore: number
  completedTasks: number
  totalTasks: number
  mainProgress: number
  totalProgress: number
  certificateDone: number
  dinoDone: number
  dinoTotal: number
}

/** Compact horizontal journey summary integrated below the stair map (V2.12+). */
export function MapProgressFooter({
  growthScore,
  completedTasks,
  totalTasks,
  mainProgress,
  totalProgress,
  certificateDone,
  dinoDone,
  dinoTotal,
}: MapProgressFooterProps) {
  return (
    <div className="map-progress-footer-v212 map-progress-footer--v213" role="region" aria-label="Journey progress summary">
      <div className="map-progress-footer-v212__left">
        <div className="map-progress-footer-v212__metric">
          <span className="map-progress-footer-v212__label">Growth Points</span>
          <strong className="map-progress-footer-v212__value">{growthScore}</strong>
        </div>
        <div className="map-progress-footer-v212__metric map-progress-footer-v212__metric--tasks">
          <span className="map-progress-footer-v212__label">Tasks done</span>
          <strong className="map-progress-footer-v212__value">
            {completedTasks}/{totalTasks}
          </strong>
        </div>
      </div>

      <div className="map-progress-footer-v212__mid">
        <span className="map-progress-footer-v212__label">Core stair</span>
        <div className="map-progress-footer-v212__bar-row">
          <progress className="map-progress-footer-v212__bar" max={100} value={mainProgress} />
          <span className="map-progress-footer-v212__pct">{mainProgress}%</span>
        </div>
      </div>

      <div className="map-progress-footer-v212__right">
        <span className="map-progress-footer-v212__label">Total completion</span>
        <div className="map-progress-footer-v212__bar-row">
          <progress className="map-progress-footer-v212__bar" max={100} value={totalProgress} />
          <span className="map-progress-footer-v212__pct">{totalProgress}%</span>
        </div>
      </div>

      <div className="map-progress-footer-v212__meta">
        <span>Certificates {certificateDone}</span>
        <span className="map-progress-footer-v212__meta-sep">·</span>
        <span>Dino U {dinoDone}/{dinoTotal}</span>
      </div>
    </div>
  )
}
