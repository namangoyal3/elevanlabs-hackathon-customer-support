interface Props {
  onDismiss: () => void;
}

export function EscalationAlert({ onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="bg-alert/90 shadow-card animate-rise-in border-alert/70 mx-4 mt-4 flex items-start justify-between gap-3 rounded-lg border px-5 py-3 text-alert-fg backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-alert-fg/15 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base"
        >
          ⚠
        </span>
        <div>
          <p className="text-alert-fg font-semibold leading-tight">Customer frustration detected</p>
          <p className="text-alert-fg/85 mt-0.5 text-sm leading-snug">
            Consider acknowledging or escalating to a supervisor.
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-alert-fg/80 hover:text-alert-fg shrink-0 text-sm transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
