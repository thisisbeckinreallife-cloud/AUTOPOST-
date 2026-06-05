import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/**
 * Button — Carbon Workshop.
 * Acento naranja-óxido sólido. Sin gradientes, sin glows, sin shimmer.
 *
 * Variants legacy retrocompatibles (default/destructive/outline/ghost/link/
 * secondary/gradient) reimplementadas con tokens nuevos para no romper
 * imports existentes durante la migración.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-sans font-medium whitespace-nowrap select-none",
    "rounded-md transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink-1",
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-fg",
          "hover:bg-primary-hover hover:-translate-y-px",
          "active:bg-primary-active active:translate-y-0",
        ],
        destructive: [
          "bg-error text-ink-9",
          "hover:opacity-90 hover:-translate-y-px",
          "active:translate-y-0",
        ],
        outline: [
          "bg-transparent text-ink-9 border border-ink-4",
          "hover:border-ink-5 hover:bg-ink-2",
          "active:bg-ink-3",
        ],
        ghost: [
          "bg-transparent text-ink-8",
          "hover:bg-ink-2 hover:text-ink-9",
          "active:bg-ink-3",
        ],
        link: [
          "bg-transparent text-accent underline-offset-4",
          "hover:underline hover:text-accent-strong",
        ],
        secondary: [
          "bg-ink-3 text-ink-9 border border-ink-4",
          "hover:bg-ink-4 hover:border-ink-5",
        ],
        // Alias legacy: gradient se comporta como default (sin gradient)
        gradient: [
          "bg-primary text-primary-fg",
          "hover:bg-primary-hover hover:-translate-y-px",
          "active:bg-primary-active active:translate-y-0",
        ],
      },
      size: {
        default: "h-11 px-4 text-sm",  // 44px touch target (WCAG)
        sm:      "h-8 px-3 text-xs",
        lg:      "h-12 px-6 text-base",
        icon:    "h-11 w-11",
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
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { buttonVariants };
