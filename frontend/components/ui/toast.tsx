"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastVariant = "success" | "error" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function variantClasses(variant: ToastVariant) {
  if (variant === "success") {
    return {
      outer: "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-50",
      dot: "bg-emerald-500"
    };
  }

  if (variant === "error") {
    return {
      outer: "border-red-500/25 bg-red-500/10 text-red-900 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-50",
      dot: "bg-red-500"
    };
  }

  return {
    outer: "border-[#3B82F6]/25 bg-[#3B82F6]/10 text-[#0F172A] dark:border-[#3B82F6]/30 dark:bg-[#3B82F6]/10 dark:text-[#F1F5F9]",
    dot: "bg-[#3B82F6]"
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));

    const timer = timers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const durationMs = input.durationMs ?? 3500;
      const next: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "info"
      };

      setItems((prev) => [next, ...prev].slice(0, 4));

      timers.current[id] = window.setTimeout(() => remove(id), durationMs);
    },
    [remove]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster items={items} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

function Toaster({
  items,
  onDismiss
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
      {items.map((t) => {
        const c = variantClasses(t.variant);
        return (
          <div
            key={t.id}
            className={`pointer-events-auto overflow-hidden rounded-2xl border p-4 shadow-lg shadow-black/10 backdrop-blur dark:shadow-black/30 ${c.outer}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${c.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                {t.description ? <p className="mt-0.5 text-xs opacity-80">{t.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="-m-1 rounded-xl px-2 py-1 text-xs font-semibold opacity-70 transition-opacity hover:opacity-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
