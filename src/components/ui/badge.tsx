import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const variantClass = {
  default: "bg-zinc-500/15 text-zinc-400",
  success: "bg-green-500/15 text-green-400",
  warning: "bg-amber-500/15 text-amber-400",
  error: "bg-red-500/15 text-red-400",
  info: "bg-blue-500/15 text-blue-400",
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
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
    PUBLISHED: "success",
    ACTIVE: "success",
    COMPLETED: "success",
    SCHEDULED: "info",
    ENQUEUED: "info",
    PARSING: "info",
    PARSED: "info",
    PUBLISHING: "warning",
    RUNNING: "warning",
    DRAFT: "default",
    VALIDATED: "default",
    READY: "default",
    FAILED: "error",
    VALIDATION_FAILED: "error",
    TOKEN_EXPIRED: "warning",
    REVOKED: "error",
    ERROR: "error",
    CANCELLED: "default",
    PENDING: "default",
  };

  return (
    <Badge variant={map[status] ?? "default"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
