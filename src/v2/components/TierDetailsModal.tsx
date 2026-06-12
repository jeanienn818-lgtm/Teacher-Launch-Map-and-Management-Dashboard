import {
  TIER_INCENTIVE_SEGMENT_LABELS,
  TIER_LIFETIME_CLASS_RANGES,
  TIER_SEGMENT_INCENTIVE_RATES_MATRIX,
} from '../tierIncentive'

/** Internal builds only — set VITE_SHOW_TIER_PAY_REFERENCE=true in .env.local */
const SHOW_TIER_PAY_REFERENCE = import.meta.env.VITE_SHOW_TIER_PAY_REFERENCE === 'true'

interface TierDetailsModalProps {
  open: boolean
  onClose: () => void
}

export function TierDetailsModal({ open, onClose }: TierDetailsModalProps) {
  if (!open) return null

  return (
    <>
      <button type="button" className="tier-modal-backdrop" aria-label="Close tier details" onClick={onClose} />
      <div className="tier-modal-panel" role="dialog" aria-modal="true" aria-labelledby="tier-modal-title">
        <div className="tier-modal-head">
          <h2 id="tier-modal-title">Tier details</h2>
          <button type="button" className="tier-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {SHOW_TIER_PAY_REFERENCE ? (
          <TierPayReferenceTables />
        ) : (
          <p className="tier-modal-lead tier-modal-lead--stub">
            Full tier and incentive reference is available in the authenticated teacher portal. This public preview
            shows your current tier in the header only.
          </p>
        )}
      </div>
    </>
  )
}

function TierPayReferenceTables() {
  return (
    <>
      <p className="tier-modal-lead">
        Your <strong>monthly pay tier</strong> is fixed from{' '}
        <strong>lifetime completed classes as of the 4th</strong> of each month. It is system-defined and cannot be
        edited on this dashboard.
      </p>

      <h3 className="tier-modal-subtitle">Tier 1–10 · Lifetime completed class ranges</h3>
      <div className="tier-modal-table-wrap">
        <table className="tier-modal-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Lifetime completed classes</th>
            </tr>
          </thead>
          <tbody>
            {TIER_LIFETIME_CLASS_RANGES.map((row) => (
              <tr key={row.tier}>
                <td>Tier {row.tier}</td>
                <td>
                  {row.maxClasses == null
                    ? `${row.minClasses}+`
                    : `${row.minClasses} – ${row.maxClasses - 1}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="tier-modal-subtitle">Activity-segmented tier incentive (USD / class)</h3>
      <p className="tier-modal-hint">
        Planned monthly classes are split into segments; each segment uses the rate for your tier row below.
      </p>
      <div className="tier-modal-table-wrap tier-modal-table-wrap--wide">
        <table className="tier-modal-table tier-modal-table--matrix">
          <thead>
            <tr>
              <th>Tier</th>
              {TIER_INCENTIVE_SEGMENT_LABELS.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIER_SEGMENT_INCENTIVE_RATES_MATRIX.map((rates, ti) => (
              <tr key={ti}>
                <td>Tier {ti + 1}</td>
                {rates.map((v, si) => (
                  <td key={si}>{v.toFixed(1)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
