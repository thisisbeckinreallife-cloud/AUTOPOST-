"use client";

import * as React from "react";
import { cn } from "./cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** elevated añade shadow-md, glow añade el ring brand */
  variant?: "default" | "elevated" | "glow";
  /** padding tipo card (default sp-6) */
  padding?: "sm" | "md" | "lg" | "none";
  /** uso semántico: section/article/aside */
  as?: "div" | "section" | "article" | "aside";
}

/**
 * Card — rebrand v1.
 * Container base con bg ink-1, border ink-3, radius 12px.
 * Usar para grouping de info, posts, settings sections.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", padding = "md", as = "div", className, children, ...rest },
  ref
) {
  const Element = as as React.ElementType;
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "sm"
      ? "p-4"
      : padding === "lg"
      ? "p-8"
      : "p-6";
  const variantClass =
    variant === "elevated"
      ? "shadow-[var(--np-shadow-md)]"
      : variant === "glow"
      ? "shadow-[var(--np-shadow-md),var(--np-glow-blue)]"
      : "";

  return (
    <Element
      ref={ref}
      className={cn(
        "bg-ink-1 border border-ink-3 rounded-xl",
        "font-np-sans text-ink-8",
        paddingClass,
        variantClass,
        className
      )}
      {...rest}
    >
      {children}
    </Element>
  );
});

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...rest }, ref) {
    return <div ref={ref} className={cn("flex flex-col gap-1 mb-4", className)} {...rest} />;
  }
);

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...rest }, ref) {
    return <h3 ref={ref} className={cn("text-np-h3 text-ink-9 font-np-sans", className)} {...rest} />;
  }
);

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...rest }, ref) {
    return <p ref={ref} className={cn("text-np-body text-ink-7", className)} {...rest} />;
  }
);
