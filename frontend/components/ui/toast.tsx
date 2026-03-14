"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, Info, Undo2, XCircle, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type ToastPresentation = "card" | "confirm";

type ToastIconOverride = "undo";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
  presentation?: ToastPresentation;
  iconOverride?: ToastIconOverride;
};

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  durationMs: number;
  actionLabel?: string;
  onAction?: () => void;
  presentation: ToastPresentation;
  iconOverride?: ToastIconOverride;
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
      {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "info",
        durationMs,
        actionLabel: input.actionLabel,
        onAction: input.onAction,
        presentation: input.presentation ?? "card",
        iconOverride: input.iconOverride
      },
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

function ConfirmMark({ variant, color, iconOverride }: { variant: ToastVariant; color: string; iconOverride?: ToastIconOverride }) {
  const stroke = color;

  if (iconOverride === "undo") {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${color}14`, border: `1px solid ${color}35` }}>
        <Undo2 className="h-7 w-7" style={{ color: stroke }} />
      </div>
    );
  }

  const isSuccess = variant === "success";

  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      className="block"
      aria-hidden="true"
    >
      <circle
        cx="28"
        cy="28"
        r="24"
        fill="none"
        stroke={`${stroke}30`}
        strokeWidth="3"
      />
      <circle
        cx="28"
        cy="28"
        r="24"
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        className="toast-confirm-circle"
      />

      {isSuccess ? (
        <path
          d="M18.5 29.5l6.2 6.2L38 22.4"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="toast-confirm-mark"
        />
      ) : (
        <g
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          className="toast-confirm-mark"
        >
          <path d="M20 20l16 16" />
          <path d="M36 20L20 36" />
        </g>
      )}
    </svg>
  );
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
      <style>{`
        @keyframes toastConfirmPop { 0% { transform: scale(0.96); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes toastConfirmCircle { from { stroke-dashoffset: 160; } to { stroke-dashoffset: 0; } }
        @keyframes toastConfirmMark { from { stroke-dashoffset: 64; } to { stroke-dashoffset: 0; } }
        .toast-confirm-circle { stroke-dasharray: 160; stroke-dashoffset: 160; animation: toastConfirmCircle 520ms ease-out forwards; }
        .toast-confirm-mark { stroke-dasharray: 64; stroke-dashoffset: 64; animation: toastConfirmMark 420ms ease-out 120ms forwards; }
      `}</style>
      {items.map((t) => {
        const cfg = VARIANT_CONFIG[t.variant];
        const Icon = cfg.icon;

        if (t.presentation === "confirm") {
          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-sm ${cfg.bg} ${cfg.border}`}
              style={{ boxShadow: `0 16px 48px -4px ${cfg.bar}45, 0 4px 16px -2px rgba(0,0,0,0.2)`, animation: "toastConfirmPop 180ms ease-out" }}
              role="status"
              aria-live="polite"
            >
              <div className="flex flex-col items-center gap-2 px-6 py-6 text-center">
                <div className="mb-1">
                  <ConfirmMark variant={t.variant} color={cfg.bar} iconOverride={t.iconOverride} />
                </div>
                <p className={`text-base font-semibold ${cfg.title}`}>{t.title}</p>
                {t.description ? (
                  <p className={`text-sm ${cfg.desc}`}>{t.description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-2xl text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:hover:bg-[#1F2A44] dark:hover:text-[#F1F5F9]"
              >
                <X className="h-4 w-4" />
              </button>

              {t.actionLabel && t.onAction ? (
                <div className="pointer-events-auto flex justify-center px-6 pb-5">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        t.onAction?.();
                      } finally {
                        onDismiss(t.id);
                      }
                    }}
                    className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] transition-colors hover:bg-white dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:hover:bg-[#0B1424]"
                  >
                    {t.actionLabel}
                  </button>
                </div>
              ) : null}

              <div className="h-0.5 w-full opacity-40" style={{ background: cfg.bar }}>
                <div
                  className="h-full animate-[shrink_4s_linear_forwards] rounded-full"
                  style={{ background: cfg.bar, transformOrigin: "left", animationDuration: `${t.durationMs}ms` }}
                />
              </div>
            </div>
          );
        }

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

            {t.actionLabel && t.onAction ? (
              <div className="pointer-events-auto flex justify-end px-5 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      t.onAction?.();
                    } finally {
                      onDismiss(t.id);
                    }
                  }}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors hover:bg-white dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:hover:bg-[#0B1424]"
                >
                  {t.actionLabel}
                </button>
              </div>
            ) : null}

            {/* Barra de progreso */}
            <div className="h-0.5 w-full opacity-40" style={{ background: cfg.bar }}>
              <div
                className="h-full animate-[shrink_4s_linear_forwards] rounded-full"
                style={{ background: cfg.bar, transformOrigin: "left", animationDuration: `${t.durationMs}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
