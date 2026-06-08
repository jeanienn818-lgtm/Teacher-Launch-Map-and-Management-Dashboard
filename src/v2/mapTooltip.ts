export type TooltipPlacement = 'above' | 'below' | 'left' | 'right'

const PAD = 10

/**
 * Position a tooltip inside `shellRect` near `anchorRect`.
 * Tries above → below → right → left; clamps to shell padding.
 */
export function computeTooltipPlacement(
  shellRect: DOMRect,
  anchorRect: DOMRect,
  tipWidth: number,
  tipHeight: number,
  gap = 10,
): { placement: TooltipPlacement; left: number; top: number } {
  const sw = shellRect.width
  const sh = shellRect.height

  const ax = anchorRect.left - shellRect.left + anchorRect.width / 2
  const ay = anchorRect.top - shellRect.top + anchorRect.height / 2

  const al = anchorRect.left - shellRect.left
  const ar = anchorRect.right - shellRect.left
  const at = anchorRect.top - shellRect.top
  const ab = anchorRect.bottom - shellRect.top

  const tryPlace = (left: number, top: number): boolean =>
    left >= PAD && top >= PAD && left + tipWidth <= sw - PAD && top + tipHeight <= sh - PAD

  const clamp = (left: number, top: number) => ({
    left: Math.min(Math.max(left, PAD), sw - tipWidth - PAD),
    top: Math.min(Math.max(top, PAD), sh - tipHeight - PAD),
  })

  const candidates: Array<{ placement: TooltipPlacement; left: number; top: number }> = [
    { placement: 'above', left: ax - tipWidth / 2, top: at - gap - tipHeight },
    { placement: 'below', left: ax - tipWidth / 2, top: ab + gap },
    { placement: 'right', left: ar + gap, top: ay - tipHeight / 2 },
    { placement: 'left', left: al - gap - tipWidth, top: ay - tipHeight / 2 },
  ]

  for (const c of candidates) {
    const p = clamp(c.left, c.top)
    if (tryPlace(p.left, p.top)) return { placement: c.placement, ...p }
  }

  const fallback = clamp(ax - tipWidth / 2, ab + gap)
  return { placement: 'below', ...fallback }
}
