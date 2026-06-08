/** Days to complete onboarding tasks and keep the $15 cash benefit. */
export const ONBOARDING_BONUS_WINDOW_DAYS = 60

const ONBOARDING_START_KEY_PREFIX = 'tlm_onboarding_start_ms_'

function storageKey(teacherId: string): string {
  return `${ONBOARDING_START_KEY_PREFIX}${teacherId}`
}

/** Anchor onboarding window per teacher (session). */
export function getOrInitOnboardingStartMs(teacherId: string, nowMs: number = Date.now()): number {
  if (typeof window === 'undefined') return nowMs
  const key = storageKey(teacherId)
  try {
    const raw = window.sessionStorage.getItem(key)
    if (raw) {
      const parsed = Number(raw)
      if (Number.isFinite(parsed) && parsed > 0) return parsed
    }
    window.sessionStorage.setItem(key, String(nowMs))
  } catch {
    /* ignore */
  }
  return nowMs
}

export function resetOnboardingBonusWindow(teacherId: string, nowMs: number = Date.now()): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(storageKey(teacherId), String(nowMs))
  } catch {
    /* ignore */
  }
}

/** Whole days left before the $15 onboarding benefit window closes (0 when expired). */
export function getOnboardingBonusDaysRemaining(
  teacherId: string,
  nowMs: number = Date.now(),
): number {
  const startMs = getOrInitOnboardingStartMs(teacherId, nowMs)
  const elapsedDays = Math.floor((nowMs - startMs) / (24 * 60 * 60 * 1000))
  return Math.max(0, ONBOARDING_BONUS_WINDOW_DAYS - elapsedDays)
}
