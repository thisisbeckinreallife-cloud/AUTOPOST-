"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

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
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />,
  info: <Info className="h-4 w-4 text-blue-400 shrink-0" />,
};

const borderMap: Record<ToastVariant, string> = {
  success: "border-green-500/20",
  error: "border-red-500/20",
  info: "border-blue-500/20",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div
      className={cn(
        "pointer-events-auto max-w-sm bg-surface-card/95 backdrop-blur-sm border rounded-xl px-4 py-3 shadow-dark-lg flex items-start gap-3 animate-slide-up",
        borderMap[toast.variant]
      )}
    >
      <div className="mt-0.5">{iconMap[toast.variant]}</div>
      <p className="text-sm text-slate-200 flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
