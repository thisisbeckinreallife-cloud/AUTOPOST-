import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Input — Carbon Workshop.
 * Touch target 44px (WCAG AA). Border ink-4 → ink-5 hover → accent focus.
 * Soporta opcionalmente label, helperText, error, e icon (legacy API).
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, label, helperText, error, id, disabled, type = "text", ...props }, ref) => {
    const reactId = useId();
    const inputId = id ?? reactId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-8">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-6 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            disabled={disabled}
            className={cn(
              "h-11 w-full rounded-md bg-ink-1 text-sm text-ink-9 placeholder:text-ink-6",
              "border transition-colors duration-200 ease-out",
              error ? "border-error" : "border-ink-4 hover:border-ink-5",
              "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-ring",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon ? "pl-10 pr-3" : "px-3",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-error-strong" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-ink-7">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
