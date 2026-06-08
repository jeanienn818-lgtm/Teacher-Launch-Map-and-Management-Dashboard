/** Session flag: one-time spotlight tour after portal entry (or after demo reset). */
export const LAUNCH_GUIDE_SESSION_KEY = 'tlm_v29_launch_guide_done'

export function isLaunchGuideDoneInSession(): boolean {
  if (typeof window === 'undefined') return true
  return sessionStorage.getItem(LAUNCH_GUIDE_SESSION_KEY) === '1'
}

export function markLaunchGuideDoneInSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LAUNCH_GUIDE_SESSION_KEY, '1')
}

export function clearLaunchGuideSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(LAUNCH_GUIDE_SESSION_KEY)
}
