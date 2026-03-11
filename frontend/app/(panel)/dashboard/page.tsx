"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getDashboardData, type DashboardData } from "@/services/dashboardService";

// ─── Colores adaptativos (CSS variables amigables a claro/oscuro) ─────────────
const DONUT_COLORS: Record<string, { fill: string; light: string }> = {
  activo:     { fill: "#22C55E", light: "#dcfce7" },
  vencido:    { fill: "#EF4444", light: "#fee2e2" },
  completado: { fill: "#3B82F6", light: "#dbeafe" },
};
const DONUT_LABELS: Record<string, string> = {
  activo: "Activos", vencido: "Vencidos", completado: "Completados",
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { status: string; total: number }[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (!total) return (
    <div className="flex h-36 items-center justify-center text-sm text-[#94A3B8]">Sin datos</div>
  );
  const R = 48, CX = 60, CY = 60, SW = 16;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const slices = data.map((d) => {
    const pct = d.total / total;
    const s = { ...d, pct, dash: pct * circ, offset };
    offset += s.dash;
    return s;
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg width={120} height={120} viewBox="0 0 120 120" className="shrink-0">
        {/* track */}
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="currentColor" strokeWidth={SW}
          className="text-[#E2E8F0] dark:text-[#1F2A44]" />
        {slices.map((s, i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={DONUT_COLORS[s.status]?.fill ?? "#64748B"}
            strokeWidth={SW}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={circ / 4 - s.offset}
            strokeLinecap="butt">
            <title>{DONUT_LABELS[s.status] ?? s.status}: {s.total}</title>
          </circle>
        ))}
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize="17" fontWeight="700"
          className="fill-[#0F172A] dark:fill-[#F1F5F9]" fill="currentColor">{total}</text>
        <text x={CX} y={CY + 11} textAnchor="middle" fontSize="9"
          fill="#64748B">total</text>
      </svg>
      <div className="w-full space-y-2.5">
        {slices.map((s, i) => (
          <div key={i}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: DONUT_COLORS[s.status]?.fill ?? "#64748B" }} />
                <span className="text-[#64748B] dark:text-[#94A3B8]">
                  {DONUT_LABELS[s.status] ?? s.status}
                </span>
              </div>
              <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{s.total}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1F2A44]">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${s.pct * 100}%`, background: DONUT_COLORS[s.status]?.fill ?? "#64748B" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar Chart (actividad semanal) ────────────────────────────────────────────
const DAY_ES: Record<string, string> = {
  Monday: "Lun", Tuesday: "Mar", Wednesday: "Mié",
  Thursday: "Jue", Friday: "Vie", Saturday: "Sáb", Sunday: "Dom",
};

function WeeklyBars({ data }: { data: { day_name: string; actions: number }[] }) {
  if (!data.length) return (
    <div className="flex h-28 items-center justify-center text-sm text-[#94A3B8]">Sin actividad esta semana</div>
  );
  const max = Math.max(...data.map((d) => d.actions), 1);
  return (
    <div className="flex h-28 items-end gap-1.5">
      {data.map((d, i) => {
        const pct = d.actions / max;
        const colors = ["#3B82F6","#8B5CF6","#06B6D4","#22C55E","#F59E0B","#EF4444","#EC4899"];
        const color = colors[i % colors.length];
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-semibold" style={{ color }}>
              {d.actions > 0 ? d.actions : ""}
            </span>
            <div className="w-full overflow-hidden rounded-t-lg bg-[#E2E8F0] dark:bg-[#1F2A44]"
              style={{ height: 72 }}>
              <div className="w-full rounded-t-lg transition-all duration-700"
                style={{ height: `${Math.max(pct * 100, d.actions > 0 ? 6 : 0)}%`, background: color, marginTop: "auto" }} />
            </div>
            <span className="text-[9px] text-[#64748B]">{DAY_ES[d.day_name] ?? d.day_name?.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Line Chart (crecimiento clientes) ───────────────────────────────────────
function ClientsLine({ data }: { data: { month: string; new_clients: number }[] }) {
  if (!data.length) return (
    <div className="flex h-28 items-center justify-center text-sm text-[#94A3B8]">Sin datos</div>
  );
  const W = 340, H = 90, PL = 24, PR = 8, PT = 8, PB = 20;
  const cW = W - PL - PR, cH = H - PT - PB;
  const max = Math.max(...data.map((d) => d.new_clients), 1);
  const toX = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * cW;
  const toY = (v: number) => PT + cH - (v / max) * cH;
  const pts = data.map((d, i) => `${toX(i)},${toY(d.new_clients)}`).join(" ");
  const area = `${PL},${PT + cH} ${pts} ${toX(data.length - 1)},${PT + cH}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid lines */}
      {[0, max / 2, max].map((v, i) => (
        <line key={i} x1={PL} y1={toY(v)} x2={W - PR} y2={toY(v)}
          stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3"
          className="stroke-[#E2E8F0] dark:stroke-[#1F2A44]" />
      ))}
      <polygon points={area} fill="url(#lg1)" />
      <polyline points={pts} fill="none" stroke="#22C55E" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.new_clients)} r="3.5"
          fill="#22C55E" stroke="white" strokeWidth="1.5"
          className="[stroke:theme(colors.white)] dark:[stroke:#0B1424]" >
          <title>{d.month}: {d.new_clients}</title>
        </circle>
      ))}
      {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d, _, arr) => {
        const origIdx = data.indexOf(d);
        return (
          <text key={origIdx} x={toX(origIdx)} y={H - 4}
            textAnchor="middle" fontSize="8" fill="#94A3B8">{d.month?.slice(5)}</text>
        );
      })}
    </svg>
  );
}

// ─── KPI Card (estilo coherente con el resto de la app) ───────────────────────
const KPI_CONFIGS = [
  { key: "total_clients",        label: "Clientes",         icon: Users,           color: "#3B82F6" },
  { key: "active_services",      label: "Servicios activos",icon: BriefcaseBusiness,color: "#8B5CF6" },
  { key: "pending_tasks",        label: "Tareas pendientes",icon: ClipboardList,   color: "#F59E0B" },
  { key: "actions_today",        label: "Acciones hoy",     icon: Zap,             color: "#22C55E" },
] as const;

function KpiCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
      {/* Glow de fondo */}
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10"
        style={{ background: color, filter: "blur(16px)" }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{value}</p>
          {sub && <p className="mt-1 text-xs text-[#94A3B8]">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      {/* Barra inferior de color */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full opacity-60"
        style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
    </div>
  );
}

// ─── Section container ────────────────────────────────────────────────────────
function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]", className)}>
      <p className="mb-4 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{title}</p>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setData(await getDashboardData()); }
    catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const s = data?.stats;

  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-[#64748B]">
            {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-[#64748B]">
          <Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" />
          <span className="text-sm">Cargando...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Clientes" value={s?.total_clients ?? 0} icon={Users} color="#3B82F6"
              sub={`${s?.total_services ?? 0} servicios`} />
            <KpiCard label="Servicios activos" value={s?.active_services ?? 0} icon={BriefcaseBusiness} color="#3B82F6"
              sub={`${s?.services_expiring_soon ?? 0} vencen pronto`} />
            <KpiCard label="Tareas pendientes" value={s?.pending_tasks ?? 0} icon={ClipboardList} color="#3B82F6"
              sub={`${s?.completed_tasks_today ?? 0} completadas hoy`} />
            <KpiCard label="Acciones hoy" value={s?.actions_today ?? 0} icon={Zap} color="#3B82F6"
              sub="en el sistema" />
          </div>

          {/* Alertas */}
          {((s?.services_expiring_soon ?? 0) > 0 || (s?.overdue_services ?? 0) > 0) && (
            <div className="flex flex-wrap gap-3">
              {(s?.services_expiring_soon ?? 0) > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-700 dark:border-amber-400/30 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  {s?.services_expiring_soon} servicio{(s?.services_expiring_soon ?? 0) > 1 ? "s" : ""} vence en 7 días
                </div>
              )}
              {(s?.overdue_services ?? 0) > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-700 dark:border-red-400/30 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                  {s?.overdue_services} servicio{(s?.overdue_services ?? 0) > 1 ? "s" : ""} vencido{(s?.overdue_services ?? 0) > 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}

          {/* Gráficas */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Distribución de servicios">
              <DonutChart data={data?.services_by_status ?? []} />
            </Panel>
            <Panel title="Actividad semanal">
              <WeeklyBars data={data?.weekly_activity ?? []} />
              <p className="mt-2 text-xs text-[#94A3B8]">Acciones por día · últimos 7 días</p>
            </Panel>
            <Panel title="Nuevos clientes · 6 meses">
              <ClientsLine data={data?.clients_growth ?? []} />
              <p className="mt-2 text-xs text-[#94A3B8]">Clientes registrados por mes</p>
            </Panel>
          </div>

          {/* Listas */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Próximos a vencer */}
            <Panel title="Próximos a vencer (30 días)">
              {!(data?.upcoming_services?.length) ? (
                <div className="flex flex-col items-center gap-2 py-6 text-sm text-[#94A3B8]">
                  <ShieldCheck className="h-8 w-8 opacity-30" />Sin servicios próximos
                </div>
              ) : (
                <div className="space-y-2">
                  {data.upcoming_services.map((sv) => {
                    const days = differenceInDays(parseISO(String(sv.expiration_date)), new Date());
                    return (
                      <div key={sv.id} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 dark:border-[#1F2A44] dark:bg-[#070F1E]">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{sv.name}</p>
                          <p className="truncate text-[10px] text-[#64748B]">{sv.client_name}</p>
                        </div>
                        <span className={cn("ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          days <= 3 ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400")}>
                          {days === 0 ? "Hoy" : `${days}d`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            {/* Tareas */}
            <Panel title="Tareas pendientes">
              {!(data?.pending_tasks?.length) ? (
                <div className="flex flex-col items-center gap-2 py-6 text-sm text-[#94A3B8]">
                  <CheckCircle2 className="h-8 w-8 opacity-30" />¡Todo al día! 🎉
                </div>
              ) : (
                <div className="space-y-2">
                  {data.pending_tasks.map((t) => {
                    const days = differenceInDays(parseISO(String(t.due_date)), new Date());
                    return (
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 dark:border-[#1F2A44] dark:bg-[#070F1E]">
                        <p className="min-w-0 flex-1 truncate text-xs font-semibold">{t.title}</p>
                        <span className={cn("ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          days < 0 ? "bg-red-500/15 text-red-600 dark:text-red-400" :
                          days === 0 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                          "bg-blue-500/15 text-blue-600 dark:text-blue-400")}>
                          {days < 0 ? "Venc." : days === 0 ? "Hoy" : `${days}d`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            {/* Top clientes */}
            <Panel title="Top clientes por servicios">
              {!(data?.top_clients?.length) ? (
                <div className="flex flex-col items-center gap-2 py-6 text-sm text-[#94A3B8]">
                  <Users className="h-8 w-8 opacity-30" />Sin clientes aún
                </div>
              ) : (
                <div className="space-y-3">
                  {data.top_clients.map((c, i) => {
                    const maxSv = data.top_clients[0]?.total_services ?? 1;
                    const colors = ["#F59E0B", "#94A3B8", "#CD7C2A", "#3B82F6", "#22C55E"];
                    return (
                      <div key={c.id}>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                              style={{ background: colors[i] ?? "#475569" }}>{i + 1}</span>
                            <span className="max-w-[140px] truncate font-medium">{c.name}</span>
                          </div>
                          <span className="text-[#64748B]">{c.total_services}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1F2A44]">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(c.total_services / maxSv) * 100}%`, background: colors[i] ?? "#475569" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
