import { useEffect, useState } from 'react'
import type { TeacherSnapshot } from '../types'
import { TierDetailsModal } from './TierDetailsModal'

interface PageHeaderProps {
  snapshot: TeacherSnapshot
  tierLabel: string
  /** Called when the teacher name is committed and differs from the current session — parent resets dashboard. */
  onRenameTeacher?: (nextTrimmedName: string) => void
}

export function PageHeader({ snapshot, tierLabel, onRenameTeacher }: PageHeaderProps) {
  const [tierOpen, setTierOpen] = useState(false)
  const [draftName, setDraftName] = useState(snapshot.teacherShowName)

  useEffect(() => {
    setDraftName(snapshot.teacherShowName)
  }, [snapshot.teacherShowName, snapshot.teacherId])

  const commitName = () => {
    const next = draftName.trim()
    if (!next) {
      setDraftName(snapshot.teacherShowName)
      return
    }
    if (next === snapshot.teacherShowName.trim()) return
    if (!onRenameTeacher) return
    const ok = window.confirm(
      'Switch to this teacher name? All progress, calculator inputs, and demo completions will reset for a new session.',
    )
    if (ok) onRenameTeacher(next)
    else setDraftName(snapshot.teacherShowName)
  }

  return (
    <>
      <header className="launch-header-v24 launch-header--v213">
        <div className="launch-header-left">
          <h1 className="launch-header-title">Teacher Launch Map · V2.5</h1>
          <div className="launch-header-identity">
            <label className="launch-header-name-label" htmlFor="teacher-show-name">
              Teacher name
            </label>
            <input
              id="teacher-show-name"
              className="launch-header-name-input"
              type="text"
              autoComplete="name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
            />
            <span className="launch-header-id">Teacher ID · {snapshot.teacherId}</span>
          </div>
        </div>
        <div className="launch-header-tier-panel">
          <div className="launch-header-tier-metric">
            <span className="launch-header-tier-label">Lifetime completed classes (as of the 4th)</span>
            <strong className="launch-header-tier-value">{snapshot.completedClassesUntilCutoff}</strong>
          </div>
          <div className="launch-header-tier-metric">
            <span className="launch-header-tier-label">Current Tier</span>
            <strong className="launch-header-tier-current">{tierLabel}</strong>
          </div>
          <button type="button" className="launch-header-details-btn" onClick={() => setTierOpen(true)}>
            View details
          </button>
        </div>
      </header>
      <TierDetailsModal open={tierOpen} onClose={() => setTierOpen(false)} />
    </>
  )
}
