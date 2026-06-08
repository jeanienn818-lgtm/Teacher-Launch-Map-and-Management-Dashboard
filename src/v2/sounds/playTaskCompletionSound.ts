/**
 * Task completion: two dings; trumpet fanfare when 7 tasks are done (synced to bonus card);
 * optional longer trumpet when Step 6 (`peak-summit`) completes.
 */
import { getCelebrationDisplayMs } from '../celebration/celebrationTiming'

let sharedCtx: AudioContext | null = null

/** Gap after dings before the 7-task fanfare starts. */
const SEVENTH_TRUMPET_START_DELAY_MS = 300

/** Small gap after 7-task fanfare ends before Step 6 fanfare (when both fire). */
const STEP6_AFTER_SEVENTH_BUFFER_MS = 200

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new AC()
    }
    return sharedCtx
  } catch {
    return null
  }
}

/** Two short bell-like dings (~0.35s total). */
export function playTwoCompletionDings(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  void ctx.resume().catch(() => {})
  try {
    const master = ctx.createGain()
    master.gain.value = 0.32
    master.connect(ctx.destination)

    const scheduleDing = (startAt: number, freq: number) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      const g = ctx.createGain()
      const t0 = ctx.currentTime + startAt
      osc.frequency.setValueAtTime(freq, t0)
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(0.13, t0 + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16)
      osc.connect(g)
      g.connect(master)
      osc.start(t0)
      osc.stop(t0 + 0.18)
    }

    scheduleDing(0, 784)
    scheduleDing(0.17, 1046.5)
  } catch {
    /* ignore */
  }
}

export type TrumpetFanfareKind = 'seventhTask' | 'step6'

/** Spread note timing so the fanfare ends near `durationMs` (7-task bonus card sync). */
function seventhTaskFanfareTimings(durationMs: number) {
  const totalSec = Math.max(1.2, durationMs / 1000)
  const gap = totalSec / 4
  const defaultDur = totalSec / 4
  const lastDur = totalSec / 2
  return { gap, defaultDur, lastDur }
}

/**
 * Synthesized brass fanfare — 7th-task length matches bonus card; Step 6 uses longer line.
 */
export function playTrumpetFanfare(kind: TrumpetFanfareKind, durationMs?: number): void {
  const ctx = getAudioContext()
  if (!ctx) return
  void ctx.resume().catch(() => {})

  const isShort = kind === 'seventhTask'
  const notes = isShort
    ? ([523, 659, 784] as const) // C5 E5 G5
    : ([392, 523, 659, 784, 880, 988, 1046.5] as const)

  const seventhTiming =
    isShort && durationMs != null ? seventhTaskFanfareTimings(durationMs) : null

  const gap = seventhTiming?.gap ?? (isShort ? 0.3 : 0.34)
  const defaultDur = seventhTiming?.defaultDur ?? (isShort ? 0.48 : 0.52)
  const lastDur = seventhTiming?.lastDur ?? (isShort ? 0.56 : 0.95)
  const masterGain = isShort ? 0.34 : 0.38
  const fanfareDurationSec = isShort
    ? (notes.length - 1) * gap + lastDur
    : (notes.length - 1) * 0.34 + 0.95

  try {
    const master = ctx.createGain()
    master.gain.value = masterGain
    master.connect(ctx.destination)

    if (isShort && durationMs != null && durationMs > 0) {
      const fadeStart = Math.max(0, fanfareDurationSec - 0.45)
      const t0 = ctx.currentTime
      master.gain.setValueAtTime(masterGain, t0)
      master.gain.setValueAtTime(masterGain * 0.85, t0 + fadeStart)
      master.gain.linearRampToValueAtTime(0.0001, t0 + fanfareDurationSec + 0.08)
    }

    const playHit = (startAt: number, freq: number, dur: number) => {
      const t0 = ctx.currentTime + startAt
      const mix = ctx.createGain()
      const weights = [0.48, 0.22, 0.09, 0.045] as const
      const oscs: OscillatorNode[] = []
      for (let h = 0; h < weights.length; h++) {
        const o = ctx.createOscillator()
        o.type = 'triangle'
        o.frequency.setValueAtTime(freq * (h + 1), t0)
        const g = ctx.createGain()
        g.gain.value = weights[h]!
        o.connect(g)
        g.connect(mix)
        oscs.push(o)
      }
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.setValueAtTime(3400, t0)
      lp.Q.value = 0.55
      mix.connect(lp)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, t0)
      env.gain.linearRampToValueAtTime(0.22, t0 + 0.035)
      env.gain.linearRampToValueAtTime(0.15, t0 + dur * 0.42)
      env.gain.exponentialRampToValueAtTime(0.0008, t0 + dur)
      lp.connect(env)
      env.connect(master)
      for (const o of oscs) {
        o.start(t0)
        o.stop(t0 + dur + 0.05)
      }
    }

    notes.forEach((f, i) => {
      const dur = i === notes.length - 1 ? lastDur : defaultDur
      const start = i * gap
      playHit(start, f, dur)
    })
  } catch {
    /* ignore */
  }
}

export interface CompletionSoundOptions {
  hitSevenMilestone: boolean
  isPeakSummit: boolean
}

export function playCompletionFeedback(opts: CompletionSoundOptions): void {
  playTwoCompletionDings()

  const seventhCardMs = getCelebrationDisplayMs(3)

  if (opts.hitSevenMilestone) {
    window.setTimeout(
      () => playTrumpetFanfare('seventhTask', seventhCardMs),
      SEVENTH_TRUMPET_START_DELAY_MS,
    )
  }

  if (opts.isPeakSummit) {
    const step6DelayMs = opts.hitSevenMilestone
      ? SEVENTH_TRUMPET_START_DELAY_MS + seventhCardMs + STEP6_AFTER_SEVENTH_BUFFER_MS
      : 320
    window.setTimeout(() => playTrumpetFanfare('step6'), step6DelayMs)
  }
}
