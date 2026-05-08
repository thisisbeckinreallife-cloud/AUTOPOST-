import { cn } from "@/lib/utils";

/**
 * Badge — Carbon Workshop.
 * Variantes con tokens semánticos soft + strong. Border 1px discreto.
 * Mantiene API legacy (default, success, warning, error, info) + StatusBadge.
 */
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "error" | "info" | "accent";
}

const variantClass: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-ink-3 text-ink-8 border border-ink-4",
  accent:  "bg-accent-soft text-accent-strong border border-accent/20",
  success: "bg-success-soft text-success-strong border border-success/20",
  warning: "bg-warning-soft text-warning-strong border border-warning/20",
  error:   "bg-error-soft text-error-strong border border-error/20",
  info:    "bg-info-soft text-info-strong border border-info/20",
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-full",
        "px-3 h-6 text-xs font-medium whitespace-nowrap",
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    PUBLISHED:         "success",
    ACTIVE:            "success",
    COMPLETED:         "success",
    SCHEDULED:         "info",
    ENQUEUED:          "info",
    PARSING:           "info",
    PARSED:            "info",
    PUBLISHING:        "warning",
    RUNNING:           "warning",
    DRAFT:             "default",
    VALIDATED:         "default",
    READY:             "default",
    FAILED:            "error",
    VALIDATION_FAILED: "error",
    TOKEN_EXPIRED:     "warning",
    REVOKED:           "error",
    ERROR:             "error",
    CANCELLED:         "default",
    PENDING:           "default",
  };

  return (
    <Badge variant={map[status] ?? "default"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
