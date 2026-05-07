import { cn } from "@/lib/utils";

/**
 * Card — Carbon Workshop.
 * Surface elevada sin glassmorphism. ink-2 + border ink-4. Radius md.
 * Mantiene API legacy: Card, CardHeader, CardTitle, CardContent, CardInteractive.
 */
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-ink-4 bg-ink-2 transition-shadow duration-200 ease-out",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 p-6", className)}>{children}</div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-xl font-semibold text-ink-9 tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6 pt-0 text-ink-8", className)}>{children}</div>;
}

export function CardInteractive({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-ink-4 bg-ink-2 transition-all duration-200 ease-out",
        "hover:shadow-md hover:border-ink-5",
        "relative overflow-hidden",
        className
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
