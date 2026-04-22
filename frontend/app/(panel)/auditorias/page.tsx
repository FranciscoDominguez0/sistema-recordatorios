"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getActivityChart,
  getActivityDashboard,
  getActivityLogs,
  getActionTypes,
  type ActivityLog,
  type ChartData,
  type DashboardStats,
} from "@/services/activityLogsService";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  CREATE_TASK: "#3B82F6",
  UPDATE_TASK: "#60A5FA",
  COMPLETE_TASK: "#22C55E",
  DELETE_TASK: "#EF4444",
  CREATE_CLIENT: "#8B5CF6",
  UPDATE_CLIENT: "#F59E0B",
  DELETE_CLIENT: "#EF4444",
  CREATE_SERVICE: "#06B6D4",
  UPDATE_SERVICE: "#F59E0B",
  DELETE_SERVICE: "#EF4444",
  LOGIN: "#10B981",
  LOGOUT: "#6B7280",
  CREATE_USER: "#8B5CF6",
  UPDATE_USER: "#F59E0B",
  DELETE_USER: "#EF4444",
};

const ACTION_LABELS: Record<string, string> = {
  // Autenticación
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  // Tareas
  CREATE_TASK: "Crear tarea",
  UPDATE_TASK: "Actualizar tarea",
  COMPLETE_TASK: "Completar tarea",
  DELETE_TASK: "Eliminar tarea",
  // Clientes
  CREATE_CLIENT: "Crear cliente",
  UPDATE_CLIENT: "Actualizar cliente",
  DELETE_CLIENT: "Eliminar cliente",
  // Servicios
  CREATE_SERVICE: "Crear servicio",
  UPDATE_SERVICE: "Actualizar servicio",
  DELETE_SERVICE: "Eliminar servicio",
  // Usuarios
  CREATE_USER: "Crear usuario",
  UPDATE_USER: "Actualizar usuario",
  DELETE_USER: "Eliminar usuario",
  // Configuración
  UPDATE_EMAIL_SETTINGS: "Actualizar SMTP",
  UPDATE_TEMPLATE: "Actualizar plantilla",
  UPDATE_COMPANY: "Actualizar empresa",
};

function actionColor(action: string) {
  return ACTION_COLORS[action] ?? "#64748B";
}

function actionLabel(action: string) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  // Fallback: convertir SNAKE_CASE a español aproximado
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ─── Inline SVG Line Chart ────────────────────────────────────────────────────
function LineChart({ data }: { data: { date: string; total: number }[] }) {
  if (!data.length) return (
    <div className="flex h-48 items-center justify-center text-sm text-[#94A3B8]">Sin datos para el período seleccionado</div>
  );

  const W = 600, H = 160, PL = 36, PR = 12, PT = 12, PB = 28;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const minVal = 0;

  const toX = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v: number) => PT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.total)}`).join(" ");
  const areaPoints = `${PL},${PT + chartH} ${points} ${toX(data.length - 1)},${PT + chartH}`;

  // Y-axis ticks
  const yTicks = Array.from(new Set([0, Math.round(maxVal / 2), maxVal])).sort((a, b) => a - b);

  // X labels — show up to 7 labels
  const step = Math.ceil(data.length / 7);
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ minWidth: 300, height: 160 }}>
        {/* Grid */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={PL} y1={toY(tick)} x2={W - PR} y2={toY(tick)} stroke="#1F2A44" strokeWidth="1" strokeDasharray="4 3" />
            <text x={PL - 6} y={toY(tick) + 4} textAnchor="end" fontSize="9" fill="#64748B">{tick}</text>
          </g>
        ))}

        {/* Area */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGrad)" />

        {/* Line */}
        <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.total)} r="3" fill="#3B82F6" stroke="#0B1424" strokeWidth="1.5">
            <title>{`${d.date}: ${d.total} acciones`}</title>
          </circle>
        ))}

        {/* X labels */}
        {xLabels.map((d, idx) => {
          const i = data.indexOf(d);
          return (
            <text key={idx} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#64748B">
              {d.date?.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Inline Horizontal Bar Chart ─────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; total: number; color?: string }[] }) {
  if (!data.length) return (
    <div className="flex h-24 items-center justify-center text-sm text-[#94A3B8]">Sin datos</div>
  );
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-right text-xs text-[#64748B] dark:text-[#94A3B8]" title={d.label}>{d.label}</span>
          <div className="flex-1 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#0B1424]" style={{ height: 8 }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.total / max) * 100}%`, background: d.color ?? "#3B82F6" }}
            />
          </div>
          <span className="w-8 shrink-0 text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]">{d.total}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function AuditoriasPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 });
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartDays, setChartDays] = useState(30);
  const searchParams = useSearchParams();
  const topbarSearch = (searchParams?.get("search") ?? "").toLowerCase().trim();

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  const loadAll = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const [statsData, chartData, logsData, types] = await Promise.all([
        getActivityDashboard(),
        getActivityChart(chartDays),
        getActivityLogs({
          page: p, limit: PAGE_SIZE,
          action: filterAction || undefined,
          entity_type: filterEntity || undefined,
          date_from: filterFrom || undefined,
          date_to: filterTo || undefined,
        }),
        getActionTypes(),
      ]);
      setStats(statsData);
      setChart(chartData);
      setLogs(logsData.data);
      setPagination(logsData.pagination);
      setActionTypes(types);
    } catch { /* silent */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartDays, filterAction, filterEntity, filterFrom, filterTo]);

  useEffect(() => { loadAll(page); }, [loadAll, page]);

  const applyFilters = () => { setPage(1); loadAll(1); };

  const goPage = (p: number) => { setPage(p); };

  // Filtro local por búsqueda del topbar
  const displayedLogs = useMemo(() => {
    if (!topbarSearch) return logs;
    return logs.filter((log) => {
      const user = (log.user ?? "").toLowerCase();
      const action = actionLabel(log.action).toLowerCase();
      const desc = (log.description ?? "").toLowerCase();
      const entity = (log.entity_type ?? "").toLowerCase();
      return user.includes(topbarSearch) || action.includes(topbarSearch) || desc.includes(topbarSearch) || entity.includes(topbarSearch);
    });
  }, [logs, topbarSearch]);

  const inputCls = "h-9 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#3B82F6]/50 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#070F1E] dark:text-[#F1F5F9] dark:placeholder:text-[#475569]";

  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Auditorías</h1>
          <p className="mt-0.5 text-sm text-[#64748B]">Registro de actividad del sistema</p>
        </div>
        <Button variant="secondary" onClick={() => loadAll(page)} disabled={loading} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Activity}   label="Hoy"            value={stats?.actions_today ?? "—"}      color="#3B82F6" />
        <StatCard icon={TrendingUp} label="Esta semana"    value={stats?.actions_this_week ?? "—"}  color="#22C55E" />
        <StatCard icon={ShieldCheck} label="Total logs"    value={pagination.total}                 color="#8B5CF6" />
        <StatCard icon={Users}      label="Usuarios activos" value={stats?.top_users?.length ?? "—"} color="#F59E0B" />
      </div>

      {/* Charts Row */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        {/* Line chart — actividad diaria */}
        <Card className="min-w-0 max-w-full overflow-hidden border-[#E2E8F0] bg-white dark:border-[#1F2A44] dark:bg-[#0B1424] lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">Actividad diaria</CardTitle>
            <select
              value={chartDays}
              onChange={(e) => setChartDays(Number(e.target.value))}
              className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#0F172A] outline-none dark:border-[#1F2A44] dark:bg-[#070F1E] dark:text-[#F1F5F9]"
            >
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
            </select>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" /></div>
            ) : (
              <LineChart data={chart?.daily ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Bar chart — top acciones */}
        <Card className="min-w-0 max-w-full overflow-hidden border-[#E2E8F0] bg-white dark:border-[#1F2A44] dark:bg-[#0B1424]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">Top acciones</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" /></div>
            ) : (
              <BarChart
                data={(chart?.by_action ?? []).map((a) => ({
                  label: actionLabel(a.action),
                  total: a.total,
                  color: actionColor(a.action),
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-[#E2E8F0] bg-white dark:border-[#1F2A44] dark:bg-[#0B1424]">
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <Filter className="h-4 w-4 text-[#64748B]" />
          <CardTitle className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-[#64748B]">Acción</label>
              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none dark:border-[#1F2A44] dark:bg-[#070F1E] dark:text-[#F1F5F9]">
                <option value="">Todas</option>
                {actionTypes.map((a) => <option key={a} value={a}>{actionLabel(a)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#64748B]">Entidad</label>
              <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none dark:border-[#1F2A44] dark:bg-[#070F1E] dark:text-[#F1F5F9]">
                <option value="">Todas</option>
                {(chart?.by_entity ?? []).map((e) => <option key={e.entity_type} value={e.entity_type ?? ""}>{e.entity_type}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#64748B]">Desde</label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#64748B]">Hasta</label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setFilterAction(""); setFilterEntity(""); setFilterFrom(""); setFilterTo(""); setPage(1); loadAll(1); }}>
              Limpiar
            </Button>
            <Button onClick={applyFilters}>Aplicar filtros</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[#E2E8F0] bg-white dark:border-[#1F2A44] dark:bg-[#0B1424]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">
            Registro de actividad
            <span className="ml-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-xs text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#64748B]">
              {pagination.total} registros
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-[#64748B]">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : displayedLogs.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[#64748B]">
              <ShieldCheck className="h-10 w-10 opacity-30" />{topbarSearch ? `Sin resultados para "${topbarSearch}"` : "No hay registros de actividad."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-xs text-[#64748B] dark:border-[#1F2A44]">
                      <th className="px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium">Usuario</th>
                      <th className="px-4 py-3 text-left font-medium">Acción</th>
                      <th className="px-4 py-3 text-left font-medium">Entidad</th>
                      <th className="px-4 py-3 text-left font-medium">Descripción</th>
                      <th className="px-4 py-3 text-left font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLogs.map((log, i) => (
                      <tr key={log.id} className={cn("border-b border-[#E2E8F0] transition-colors hover:bg-[#F8FAFC] dark:border-[#1F2A44]/50 dark:hover:bg-[#111E35]", i % 2 === 0 ? "" : "bg-[#F8FAFC] dark:bg-[#070F1E]/30")}>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                          {log.created_at ? format(parseISO(String(log.created_at)), "dd MMM yyyy HH:mm", { locale: es }) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{log.user ?? <span className="text-[#94A3B8]">Sistema</span>}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                            style={{ borderColor: `${actionColor(log.action)}30`, background: `${actionColor(log.action)}15`, color: actionColor(log.action) }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: actionColor(log.action) }} />
                            {actionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#94A3B8]">
                          {log.entity_type ? (
                            <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[#475569] dark:bg-[#111E35] dark:text-[#94A3B8]">
                              {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="max-w-xs px-4 py-3 text-xs text-[#94A3B8]">
                          <span className="line-clamp-1 text-[#64748B] dark:text-[#94A3B8]">{log.description ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#94A3B8]">{log.ip_address ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between border-t border-[#1F2A44] px-4 py-3">
                  <p className="text-xs text-[#64748B]">
                    Página {pagination.page} de {pagination.total_pages} · {pagination.total} registros
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => goPage(page - 1)} disabled={page <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const start = Math.max(1, Math.min(page - 2, pagination.total_pages - 4));
                      const p = start + i;
                      if (p > pagination.total_pages) return null;
                      return (
                        <button key={p} onClick={() => goPage(p)}
                          className={cn("h-8 w-8 rounded-xl text-xs font-medium transition-colors",
                            p === page ? "bg-[#3B82F6] text-white" : "text-[#64748B] hover:bg-[#111E35]")}>
                          {p}
                        </button>
                      );
                    })}
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => goPage(page + 1)} disabled={page >= pagination.total_pages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
