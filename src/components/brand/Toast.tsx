"use client";

import * as React from "react";
import { cn } from "./cn";

export type ToastVariant = "default" | "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * useToast — hook para disparar toasts desde cualquier componente bajo ToastProvider.
 *
 * @example
 *   const { toast } = useToast();
 *   toast("Sesión cerrada · hasta pronto");
 *   toast("Token expira en 7 días", "warning");
 */
export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Fallback silencioso en tests/SSR — no crashear si el provider no está montado
    return { toast: () => undefined };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    (message, variant = "default", duration = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [...prev, { id, message, variant, duration }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notificaciones"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none"
    >
      {items.map((t) => (
        <ToastEl key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastEl({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const variantClass =
    item.variant === "success"
      ? "border-[color:var(--np-success)] text-[color:var(--np-success)]"
      : item.variant === "warning"
      ? "border-[color:var(--np-warning)] text-[color:var(--np-warning)]"
      : item.variant === "error"
      ? "border-[color:var(--np-error)] text-[color:var(--np-error)]"
      : item.variant === "info"
      ? "border-[color:var(--np-info)] text-[color:var(--np-info)]"
      : "border-ink-4 text-ink-9";

  return (
    <div
      className={cn(
        "pointer-events-auto px-5 py-3 rounded-full bg-ink-2 border",
        "font-np-mono text-np-caption shadow-[var(--np-shadow-lg)]",
        "animate-[fadeUp_0.3s_var(--np-ease-out)_both]",
        variantClass
      )}
      role="status"
      onClick={() => onDismiss(item.id)}
    >
      {item.message}
    </div>
  );
}
