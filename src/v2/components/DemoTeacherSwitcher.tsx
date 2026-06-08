import { DEMO_TEACHER_PRESETS } from '../data'
import { formatTierLabel, resolveTierFromCumulativeCompletions } from '../tierIncentive'

interface DemoTeacherSwitcherProps {
  selectedId: string
  onSelect: (demoTeacherId: string) => void
  /** Compact row under portal welcome vs full row in map header */
  variant?: 'header' | 'portal'
}

export function DemoTeacherSwitcher({ selectedId, onSelect, variant = 'header' }: DemoTeacherSwitcherProps) {
  return (
    <div
      className={`demo-teacher-switcher demo-teacher-switcher--${variant}`}
      role="group"
      aria-label="Choose demo teacher tier"
    >
      <span className="demo-teacher-switcher-label">Demo teacher</span>
      <div className="demo-teacher-switcher-options">
        {DEMO_TEACHER_PRESETS.map((preset) => {
          const tier = resolveTierFromCumulativeCompletions(preset.snapshot.completedClassesUntilCutoff)
          const tierLabel = formatTierLabel(tier)
          const active = preset.id === selectedId
          return (
            <button
              key={preset.id}
              type="button"
              className={`demo-teacher-switcher-btn${active ? ' demo-teacher-switcher-btn--active' : ''}`}
              aria-pressed={active}
              onClick={() => onSelect(preset.id)}
            >
              <span className="demo-teacher-switcher-btn-tier">{preset.label}</span>
              <span className="demo-teacher-switcher-btn-name">{preset.snapshot.teacherShowName}</span>
              <span className="demo-teacher-switcher-btn-meta">{tierLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
