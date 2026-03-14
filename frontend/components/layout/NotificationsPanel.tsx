"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Mail,
  RefreshCw,
  ServerCrash,
  Trash2,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type NotificationType
} from "@/services/notificationsService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function typeIcon(type: NotificationType) {
  switch (type) {
    case "service_expiring": return <CalendarClock className="h-4 w-4 text-amber-500" />;
    case "service_expired":  return <ServerCrash   className="h-4 w-4 text-red-500" />;
    case "task_due":         return <CheckCircle2  className="h-4 w-4 text-blue-500" />;
    case "email_sent":       return <Mail          className="h-4 w-4 text-emerald-500" />;
    default:                 return <Bell          className="h-4 w-4 text-slate-400" />;
  }
}

function summarize(message: string | null | undefined) {
  if (!message) return "";
  const clean = String(message).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > 90 ? `${clean.slice(0, 90)}…` : clean;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "Justo ahora";
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${days} día${days !== 1 ? "s" : ""}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotificationsPanel({
  open,
  onClose,
  onUnreadCountChange
}: {
  open: boolean;
  onClose: () => void;
  isDark?: boolean;
  onUnreadCountChange?: (count: number) => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { notifications, unread_count } = await getNotifications();
      setItems(notifications);
      setUnread(unread_count);
      onUnreadCountChange?.(unread_count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnread((c) => Math.max(0, c - 1));
    onUnreadCountChange?.(Math.max(0, unread - 1));
  };

  const handleMarkAllRead = async () => {
    setError(null);
    try {
      await markAllNotificationsRead();
      await clearAllNotifications();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron limpiar las notificaciones");
      await load().catch(() => {});
    }
  };

  const handleOpenItem = async (n: NotificationItem) => {
    if (!n) return;
    if (!n.is_read) {
      await handleMarkRead(n.id).catch(() => {});
    }

    if ((n.type === "service_expiring" || n.type === "service_expired") && n.service_id) {
      router.push(`/servicios?open=${n.service_id}`);
      onClose();
      return;
    }
  };

  const handleDelete = async (id: number) => {
    const wasUnread = items.find((n) => n.id === id)?.is_read === false;
    await deleteNotification(id).catch(() => {});
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnread((c) => Math.max(0, c - 1));
      onUnreadCountChange?.(Math.max(0, unread - 1));
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notificaciones"
        onClick={(e) => e.stopPropagation()}
        className="fixed right-4 top-20 z-50 flex w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-2xl shadow-black/10 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4 dark:border-[#1F2A44]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35]">
              <BellRing className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Notificaciones</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {unread > 0 ? `${unread} sin leer` : "Todo al día"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={load}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8] dark:hover:bg-[#162844]"
              title="Recargar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8] dark:hover:bg-[#162844]"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-3 h-8 w-8 opacity-20 text-[#64748B] dark:text-[#94A3B8]" />
              <p className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">Sin notificaciones</p>
              <p className="mt-1 text-xs text-[#94A3B8] dark:text-[#64748B]">Cuando haya actividad, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-2xl border p-3 transition-colors",
                    n.is_read
                      ? "border-[#E2E8F0] bg-white dark:border-[#1F2A44] dark:bg-[#0B1424]"
                      : "border-[#3B82F6]/20 bg-[#3B82F6]/5 dark:border-[#3B82F6]/30 dark:bg-[#3B82F6]/10"
                  )}
                  role={(n.type === "service_expiring" || n.type === "service_expired") && n.service_id ? "button" : undefined}
                  tabIndex={(n.type === "service_expiring" || n.type === "service_expired") && n.service_id ? 0 : undefined}
                  onClick={() => handleOpenItem(n)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    handleOpenItem(n);
                  }}
                >
                  {/* Dot indicador */}
                  {!n.is_read && (
                    <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#3B82F6]" />
                  )}

                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35]">
                    {typeIcon(n.type)}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1 pr-6">
                    <p className="truncate text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-[#94A3B8] dark:text-[#64748B]">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>

                  {/* Actions (on hover) */}
                  <div className="absolute right-2 top-2 hidden flex-col gap-1 group-hover:flex">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#3B82F6] hover:bg-[#3B82F6]/10 dark:border-[#1F2A44] dark:bg-[#111E35]"
                        title="Marcar como leída"
                      >
                        <CheckCheck className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-red-500 hover:bg-red-500/10 dark:border-[#1F2A44] dark:bg-[#111E35]"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E2E8F0] p-3 dark:border-[#1F2A44]">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={items.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:bg-white disabled:opacity-40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:hover:bg-[#162844]"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar y limpiar
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
