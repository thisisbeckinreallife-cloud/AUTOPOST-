"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast — Carbon Workshop.
 * ToastProvider + useToast hook + ToastItem con animación slide-up.
 * Auto-dismiss 4s, dismiss manual con botón X.
 */
type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div
        role="region"
        aria-label="Notificaciones"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-success-strong shrink-0" />,
  error:   <AlertCircle className="h-4 w-4 text-error-strong shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning-strong shrink-0" />,
  info:    <Info className="h-4 w-4 text-info-strong shrink-0" />,
};

const accentBar: Record<ToastVariant, string> = {
  success: "bg-success",
  error:   "bg-error",
  warning: "bg-warning",
  info:    "bg-ink-5",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto relative flex items-start gap-3",
        "min-w-[320px] max-w-md p-4 rounded-md",
        "border border-ink-4 bg-ink-2 text-ink-9 shadow-lg",
        "animate-slide-up"
      )}
    >
      <span
        aria-hidden="true"
        className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-md", accentBar[toast.variant])}
      />
      <div className="mt-0.5 pl-2">{iconMap[toast.variant]}</div>
      <p className="text-sm text-ink-9 flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className={cn(
          "shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-md",
          "text-ink-7 hover:text-ink-9 hover:bg-ink-3 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
