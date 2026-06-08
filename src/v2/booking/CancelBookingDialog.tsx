interface CancelBookingDialogProps {
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
  onDismiss: () => void
}

export function CancelBookingDialog({
  title,
  body,
  confirmLabel = 'Cancel booking',
  onConfirm,
  onDismiss,
}: CancelBookingDialogProps) {
  return (
    <div className="mock-dialog-root" role="alertdialog" aria-modal="true" aria-labelledby="cancel-booking-title">
      <div className="mock-dialog-scrim" aria-hidden onClick={onDismiss} />
      <div className="mock-dialog-panel mock-dialog-panel--warn">
        <h3 id="cancel-booking-title" className="mock-dialog-title">
          {title}
        </h3>
        <p className="mock-dialog-body">{body}</p>
        <div className="mock-dialog-actions">
          <button type="button" className="mock-dialog-btn mock-dialog-btn--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="mock-dialog-btn mock-dialog-btn--secondary" onClick={onDismiss}>
            Keep booking
          </button>
        </div>
      </div>
    </div>
  )
}
