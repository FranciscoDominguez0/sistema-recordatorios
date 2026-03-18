"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Mail,
  MailCheck,
  MailX,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  getEmailLogs,
  cleanupEmailLogs,
  getEmailLogsSummary,
  type EmailLogItem,
  type EmailLogSummary,
} from "@/services/emailLogsService";

// ─── KPI Card (azul uniforme) ─────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10"
        style={{ background: "#3B82F6", filter: "blur(16px)" }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{value}</p>
          {sub && <p className="mt-1 text-xs text-[#94A3B8]">{sub}</p>}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "#3B82F618", border: "1px solid #3B82F630" }}
        >
          <Icon className="h-5 w-5" style={{ color: "#3B82F6" }} />
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-0.5 w-full opacity-60"
        style={{ background: "linear-gradient(to right, #3B82F6, transparent)" }}
      />
    </div>
  );
}

// ─── Badge de estado ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Enviado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
      <XCircle className="h-3 w-3" />
      Fallido
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const LIMIT = 10;

export default function HistorialCorreosPage() {
  const searchParams = useSearchParams();
  const topbarQ = searchParams?.get("search") ?? "";
  const statusParam = (searchParams?.get("status") ?? "").toString();

  const { toast } = useToast();

  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [summary, setSummary] = useState<EmailLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const fetchAll = useCallback(
    async ({ nextPage = 1, nextSearch = topbarQ } = {}) => {
      setLoading(true);
      try {
        const safeStatus = statusParam === "sent" || statusParam === "failed" ? statusParam : undefined;
        const [logsRes, summaryRes] = await Promise.all([
          getEmailLogs({ page: nextPage, limit: LIMIT, search: nextSearch, status: safeStatus }),
          getEmailLogsSummary(),
        ]);
        setLogs(logsRes.data);
        setPage(logsRes.pagination.page);
        setTotalPages(logsRes.pagination.total_pages);
        setTotal(logsRes.pagination.total);
        setSummary(summaryRes);
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    },
    [statusParam, topbarQ]
  );

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Sincroniza con la barra de búsqueda del topbar
  useEffect(() => {
    fetchAll({ nextPage: 1, nextSearch: topbarQ });
  }, [topbarQ, statusParam, fetchAll]);

  // Calcular tasa de éxito
  const successRate = useMemo(() => {
    if (!summary?.total) return 0;
    return Math.round((summary.sent / summary.total) * 100);
  }, [summary]);

  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">

      <ConfirmDialog
        open={cleanupOpen}
        title="Limpiar historial"
        description={`¿Seguro que deseas borrar del historial los correos de los últimos ${cleanupDays} días?`}
        confirmText={cleanupLoading ? "Limpiando..." : "Limpiar"}
        cancelText="Cancelar"
        loading={cleanupLoading}
        variant="danger"
        onConfirm={async () => {
          setCleanupLoading(true);
          try {
            const res = await cleanupEmailLogs(cleanupDays);
            toast({ title: "Historial limpiado", description: `Registros eliminados: ${res.deleted}` });
            setCleanupOpen(false);
            await fetchAll({ nextPage: 1 });
          } catch {
            toast({ title: "Error", description: "No se pudo limpiar el historial" });
          } finally {
            setCleanupLoading(false);
          }
        }}
        onOpenChange={(open) => {
          if (cleanupLoading) return;
          setCleanupOpen(open);
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Historial de Correos</h1>
          <p className="text-sm text-[#64748B]">Revisa el historial de correos enviados</p>
        </div>
        <Button variant="secondary" onClick={() => fetchAll({ nextPage: page })} disabled={loading} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total enviados" value={summary?.total ?? 0} sub="Historial completo" icon={Mail} />
        <KpiCard label="Exitosos" value={summary?.sent ?? 0} sub={`${successRate}% éxito`} icon={MailCheck} />
        <KpiCard label="Fallidos" value={summary?.failed ?? 0} sub="Con error" icon={MailX} />
        <KpiCard label="Hoy" value={summary?.today ?? 0} sub={format(new Date(), "d MMM yyyy", { locale: es })} icon={Send} />
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
        {/* Header de tabla */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4 dark:border-[#1F2A44]">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#3B82F6]" />
            <span className="text-sm font-semibold">Registro de correos</span>
            <span className="ml-1 rounded-full bg-[#3B82F6]/10 px-2 py-0.5 text-xs font-bold text-[#3B82F6]">
              {total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={cleanupDays}
              onChange={(e) => setCleanupDays(parseInt(e.target.value, 10))}
              className="h-9 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] shadow-sm shadow-black/5 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]"
              aria-label="Rango de limpieza"
            >
              <option value={7}>Borrar últimos 7 días</option>
              <option value={30}>Borrar últimos 30 días</option>
              <option value={60}>Borrar últimos 60 días</option>
              <option value={90}>Borrar últimos 90 días</option>
              <option value={180}>Borrar últimos 180 días</option>
            </select>

            <Button
              variant="secondary"
              className="h-9 gap-2"
              disabled={loading || cleanupLoading}
              onClick={() => setCleanupOpen(true)}
            >
              Limpiar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-[#64748B]">
            <Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" />
            Cargando correos...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[#94A3B8]">
            <Mail className="h-10 w-10 opacity-20" />
            <p>{topbarQ || statusParam ? `Sin resultados para "${topbarQ}"` : "No hay registros de correos"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F8FAFC] text-xs font-semibold text-[#64748B] dark:bg-[#070F1E] dark:text-[#94A3B8]">
                  <tr className="border-b border-[#E2E8F0] dark:border-[#1F2A44]">
                    <th className="px-4 py-3">Destinatario</th>
                    <th className="px-4 py-3">Asunto</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1F2A44]">
                  {logs.map((log, i) => (
                    <tr
                      key={log.id}
                      className={cn(
                        "transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#111E35]",
                        i % 2 === 1 ? "bg-[#F8FAFC] dark:bg-[#070F1E]" : ""
                      )}
                    >
                      {/* Destinatario */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10">
                            <Mail className="h-3.5 w-3.5 text-[#3B82F6]" />
                          </div>
                          <span className="truncate max-w-[160px] text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                            {log.email}
                          </span>
                        </div>
                      </td>

                      {/* Asunto */}
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate text-xs text-[#0F172A] dark:text-[#F1F5F9]">
                          {log.subject ?? <span className="italic text-[#94A3B8]">Sin asunto</span>}
                        </p>
                        {log.error_message && (
                          <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-red-500" title={log.error_message}>
                            ⚠ {log.error_message}
                          </p>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {log.client_name ?? <span className="italic">—</span>}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {log.sent_at
                          ? format(parseISO(String(log.sent_at)), "d MMM yyyy HH:mm", { locale: es })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex flex-col gap-2 border-t border-[#E2E8F0] px-5 py-3 dark:border-[#1F2A44] sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[#64748B]">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong> · {total} registros
              </span>
              <div className="flex max-w-full flex-wrap items-center gap-1.5 overflow-x-auto sm:flex-nowrap">
                <Button
                  variant="secondary"
                  className="h-8 shrink-0 px-3 text-xs"
                  disabled={loading || page <= 1}
                  onClick={() => fetchAll({ nextPage: page - 1 })}
                >
                  <span className="sm:hidden">Ant</span>
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                {/* Páginas numeradas */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => fetchAll({ nextPage: p })}
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                        p === page
                          ? "bg-[#3B82F6] text-white"
                          : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] dark:bg-[#1F2A44] dark:text-[#94A3B8] dark:hover:bg-[#2D3E5C]"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <Button
                  variant="secondary"
                  className="h-8 shrink-0 px-3 text-xs"
                  disabled={loading || page >= totalPages}
                  onClick={() => fetchAll({ nextPage: page + 1 })}
                >
                  <span className="sm:hidden">Sig</span>
                  <span className="hidden sm:inline">Siguiente</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
