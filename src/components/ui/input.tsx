import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-slate-700 bg-surface-primary text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all",
            icon ? "pl-10 pr-3 py-2.5" : "px-3 py-2.5",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
