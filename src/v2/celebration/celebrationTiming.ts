/** Auto-dismiss for routine task toasts (Level 1 / 2 theme cards). */
export const CELEBRATION_ROUTINE_DISPLAY_MS = 3000

/** Extra time on top of per-level base for major milestones (7-task bonus + Step 6). */
export const CELEBRATION_EXTRA_DISPLAY_MS = 3000

/** Total on-screen duration for each celebration level (auto-dismiss + sound sync). */
export function getCelebrationDisplayMs(level: 1 | 2 | 3 | 4): number {
  if (level === 1 || level === 2) return CELEBRATION_ROUTINE_DISPLAY_MS
  const baseMs = level === 4 ? 5000 : 3400
  return baseMs + CELEBRATION_EXTRA_DISPLAY_MS
}
