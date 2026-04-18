interface Props {
  onDismiss: () => void;
}

export function EscalationAlert({ onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="bg-alert animate-in fade-in slide-in-from-top-2 mx-4 mt-4 flex items-start justify-between gap-3 rounded-md px-4 py-3 text-white duration-200"
    >
      <div>
        <p className="font-semibold">⚠ Customer frustration detected</p>
        <p className="text-sm text-red-100">
          Consider offering to escalate or proactively acknowledging their concern.
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss escalation alert"
        className="text-sm underline decoration-red-200 hover:decoration-white"
      >
        Dismiss
      </button>
    </div>
  );
}
