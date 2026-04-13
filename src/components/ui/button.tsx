import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-white hover:bg-brand-400 shadow-glow-sm hover:shadow-glow active:bg-brand-600 hover:-translate-y-px active:translate-y-0",
        destructive:
          "bg-red-600 text-white hover:bg-red-500 active:bg-red-700",
        outline:
          "border border-white/[0.1] bg-transparent text-zinc-300 hover:border-white/[0.18] hover:text-white hover:bg-white/[0.04]",
        ghost:
          "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
        link:
          "text-brand-400 underline-offset-4 hover:underline hover:text-brand-300",
        secondary:
          "bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 border border-white/[0.04]",
        gradient:
          "bg-gradient-brand-vivid text-white shadow-glow-sm hover:shadow-glow hover:-translate-y-px active:translate-y-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = "Button";
