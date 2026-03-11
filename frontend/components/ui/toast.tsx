"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";

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

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: React.ElementType;
  bar: string;
  icon_color: string;
  bg: string;
  border: string;
  title: string;
  desc: string;
}> = {
  success: {
    icon: CheckCircle2,
    bar: "#22C55E",
    icon_color: "#22C55E",
    bg: "bg-white dark:bg-[#0B1424]",
    border: "border-emerald-400/30",
    title: "text-[#0F172A] dark:text-[#F1F5F9]",
    desc: "text-[#64748B] dark:text-[#94A3B8]",
  },
  error: {
    icon: XCircle,
    bar: "#EF4444",
    icon_color: "#EF4444",
    bg: "bg-white dark:bg-[#0B1424]",
    border: "border-red-400/30",
    title: "text-[#0F172A] dark:text-[#F1F5F9]",
    desc: "text-[#64748B] dark:text-[#94A3B8]",
  },
  info: {
    icon: Info,
    bar: "#3B82F6",
    icon_color: "#3B82F6",
    bg: "bg-white dark:bg-[#0B1424]",
    border: "border-blue-400/30",
    title: "text-[#0F172A] dark:text-[#F1F5F9]",
    desc: "text-[#64748B] dark:text-[#94A3B8]",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) { window.clearTimeout(timer); delete timers.current[id]; }
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const durationMs = input.durationMs ?? 4000;
    setItems((prev) => [
      { id, title: input.title, description: input.description, variant: input.variant ?? "info" },
      ...prev
    ].slice(0, 4));
    timers.current[id] = window.setTimeout(() => remove(id), durationMs);
  }, [remove]);

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

function Toaster({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  if (!items.length) return null;

  // El layout usa lg:pl-72 (288px) y xl:pl-80 (320px) para el sidebar.
  // Centramos el toast en la zona de contenido sumando la mitad del sidebar al 50% base.
  // En móvil: sin offset (sidebar oculto). En lg: +144px. En xl: +160px.
  const sidebarOffset = typeof window !== "undefined"
    ? window.innerWidth >= 1280 ? 160 : window.innerWidth >= 1024 ? 144 : 0
    : 144;

  return (
    <div
      className="pointer-events-none fixed top-6 z-[200] flex w-[min(460px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-3"
      style={{ left: `calc(50% + ${sidebarOffset}px)` }}
    >
      {items.map((t) => {
        const cfg = VARIANT_CONFIG[t.variant];
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-sm ${cfg.bg} ${cfg.border}`}
            style={{ boxShadow: `0 16px 48px -4px ${cfg.bar}45, 0 4px 16px -2px rgba(0,0,0,0.2)` }}
            role="status"
            aria-live="polite"
          >
            {/* Borde izquierdo de color */}
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl" style={{ background: cfg.bar }} />

            <div className="flex items-center gap-3 py-4 pl-5 pr-4">
              {/* Ícono */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${cfg.bar}20` }}>
                <Icon className="h-5 w-5" style={{ color: cfg.icon_color }} />
              </div>

              {/* Texto */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${cfg.title}`}>{t.title}</p>
                {t.description && (
                  <p className={`mt-0.5 text-xs leading-relaxed ${cfg.desc}`}>{t.description}</p>
                )}
              </div>

              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:hover:bg-[#1F2A44] dark:hover:text-[#F1F5F9]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="h-0.5 w-full opacity-40" style={{ background: cfg.bar }}>
              <div
                className="h-full animate-[shrink_4s_linear_forwards] rounded-full"
                style={{ background: cfg.bar, transformOrigin: "left" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
