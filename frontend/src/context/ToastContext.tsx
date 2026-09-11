/* eslint-disable react-refresh/only-export-components -- context module: provider + hook belong together */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastValue {
  show: (tone: ToastTone, message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const DISMISS_AFTER_MS = 4500;

const DOT: Record<ToastTone, string> = {
  success: "bg-moss-500",
  error: "bg-rose-500",
  info: "bg-brand-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { id, tone, message }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3.5 py-2.5 text-[13px] text-slate-700 shadow-lg backdrop-blur-sm"
            style={{ animation: "clymlens-toast-in 180ms ease-out" }}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[t.tone]}`} />
            <span className="min-w-0">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="ml-1 shrink-0 text-slate-300 hover:text-slate-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used within a ToastProvider");
  return value;
}
