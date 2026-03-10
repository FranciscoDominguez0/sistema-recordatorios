"use client";

import { useEffect } from "react";
import { BellRing, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  variant: "info" | "success";
};

const demoNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Nuevo usuario registrado",
    description: "Se registró un nuevo usuario.",
    time: "Justo ahora",
    variant: "success"
  },
  {
    id: "n2",
    title: "Tarea pendiente",
    description: "Tienes tareas por revisar.",
    time: "Hace 5 min",
    variant: "info"
  },
  {
    id: "n3",
    title: "Servicios próximos",
    description: "Hay servicios cercanos a vencer.",
    time: "Hoy",
    variant: "info"
  }
];

export default function NotificationsPanel({
  open,
  onClose,
  isDark
}: {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const surface = isDark ? "bg-[#0B1424] text-[#F1F5F9]" : "bg-white text-zinc-900";
  const border = isDark ? "border-[#1F2A44]" : "border-black/10";
  const muted = isDark ? "text-[#94A3B8]" : "text-zinc-500";

  return (
    <div className={cn(open ? "" : "pointer-events-none")}>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-[88vw] max-w-[380px] flex-col border-l shadow-2xl transition-transform",
          surface,
          border,
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Notificaciones"
      >
        <div className={cn("flex items-center justify-between gap-3 border-b px-5 py-5", border)}>
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border", border)}>
              <BellRing className={cn("h-5 w-5", isDark ? "text-[#3B82F6]" : "text-[#3E53A0]")} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Notificaciones</p>
              <p className={cn("truncate text-xs", muted)}>{demoNotifications.length} nuevas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
              border,
              isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-zinc-50"
            )}
            aria-label="Cerrar notificaciones"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {demoNotifications.map((n) => {
              const Icon = n.variant === "success" ? CheckCircle2 : Info;
              const iconBg = isDark ? "bg-white/5" : "bg-zinc-100";

              return (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-2xl border p-4",
                    border,
                    isDark ? "bg-white/5" : "bg-white"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", iconBg)}>
                      <Icon className={cn("h-5 w-5", n.variant === "success" ? "text-[#3B82F6]" : muted)} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{n.title}</p>
                      <p className={cn("mt-1 text-sm", muted)}>{n.description}</p>
                      <p className={cn("mt-2 text-xs", muted)}>{n.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn("border-t p-4", border)}>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              border,
              isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-zinc-50"
            )}
          >
            Marcar como leídas
          </button>
        </div>
      </aside>
    </div>
  );
}
