import { AlertCircle, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable accessible alert banner with optional retry and dismiss controls.
 */
export default function ErrorAlert({
  message,
  onDismiss,
  onRetry,
  retryLabel = "Retry",
  retryDisabled = false,
  className,
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "p-3 rounded-xl border border-destructive/25 bg-destructive/10 text-red-700 dark:text-red-300 text-xs flex items-start justify-between gap-3",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
        <p className="leading-relaxed break-words">{message}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={retryDisabled}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/15 hover:bg-destructive/25 text-red-700 dark:text-red-200 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="size-3" />
            <span>{retryLabel}</span>
          </button>
        ) : null}

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="p-1 rounded-md text-red-600/80 dark:text-red-300/80 hover:text-red-700 dark:hover:text-red-200 hover:bg-destructive/15 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
