import * as React from "react";

/**
 * Divider — separador "── O con email ──" usado en login/signup
 * tras los OAuth buttons.
 */
export function AuthDivider({ label = "O con email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-6 text-ink-6 font-np-mono text-np-caption uppercase tracking-wider">
      <span aria-hidden="true" className="flex-1 h-px bg-ink-3" />
      <span>{label}</span>
      <span aria-hidden="true" className="flex-1 h-px bg-ink-3" />
    </div>
  );
}
