"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RotateCcw,
  Sparkles,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getClientsPaginated, type ClientItem } from "@/services/clientsService";
import {
  createService,
  deleteService,
  getServiceById,
  getServicesPaginated,
  renewService,
  updateService,
  type ServiceItem,
  type ServiceStatus
} from "@/services/servicesService";

type DrawerMode = "create" | "edit";

type FormState = {
  client_id: number | null;
  client_label: string;
  service_name: string;
  description: string;
  start_date: string;
  expiration_date: string;
  reminder_days: string;
  status: ServiceStatus;
};

const initialForm: FormState = {
  client_id: null,
  client_label: "",
  service_name: "",
  description: "",
  start_date: "",
  expiration_date: "",
  reminder_days: "5",
  status: "activo"
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "2-digit", timeZone: "UTC" });
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function statusLabel(status?: ServiceStatus) {
  if (status === "vencido") return "Vencido";
  if (status === "completado") return "Completado";
  return "Activo";
}

function statusClasses(status?: ServiceStatus) {
  if (status === "vencido") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  }
  if (status === "completado") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  }
  return "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#1D4ED8] dark:text-[#BFDBFE]";
}

export default function ServiciosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalServices, setTotalServices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [activos, setActivos] = useState(0);
  const [vencidos, setVencidos] = useState(0);
  const [completados, setCompletados] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<ServiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Renewal state ─────────────────────────────────────────────────────────
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewingService, setRenewingService] = useState<ServiceItem | null>(null);
  const [renewDate, setRenewDate] = useState("");
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailService, setDetailService] = useState<ServiceItem | null>(null);

  const [clientQuery, setClientQuery] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientOptions, setClientOptions] = useState<ClientItem[]>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const clientFetchTimeout = useRef<number | null>(null);
  const clientBoxRef = useRef<HTMLDivElement | null>(null);

  const fetchServices = async (
    opts: { nextSearch?: string; nextPage?: number; nextStatus?: ServiceStatus | "all" } = {}
  ) => {
    setLoading(true);
    setError(null);
    try {
      const finalSearch = opts.nextSearch ?? search;
      const finalPage = opts.nextPage ?? page;
      const finalStatus = opts.nextStatus ?? statusFilter;

      const result = await getServicesPaginated({
        page: finalPage,
        limit,
        search: finalSearch,
        status: finalStatus === "all" ? undefined : finalStatus
      });

      setServices(result.data);
      setTotalServices(result.pagination.total ?? 0);
      setTotalPages(result.pagination.total_pages ?? 1);
      setPage(result.pagination.page ?? finalPage);

      setActivos(Number(result.summary?.activos ?? 0));
      setVencidos(Number(result.summary?.vencidos ?? 0));
      setCompletados(Number(result.summary?.completados ?? 0));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar servicios");
    } finally {
      setLoading(false);
    }
  };

  const totalAll = useMemo(() => activos + vencidos + completados, [activos, vencidos, completados]);
  const pct = (value: number) => {
    if (!totalAll) return 0;
    return Math.min(100, Math.max(0, Math.round((value / totalAll) * 100)));
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = (searchParams?.get("search") ?? "").toString();
    const st = (searchParams?.get("status") ?? "").toString() as ServiceStatus | "";
    const nextStatus = (st || "all") as ServiceStatus | "all";

    setSearch(q);
    setStatusFilter(nextStatus);
    setPage(1);
    fetchServices({ nextSearch: q, nextPage: 1, nextStatus });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const raw = (searchParams?.get("open") ?? "").toString();
    const id = Number(raw);
    if (!raw || !Number.isFinite(id) || id <= 0) return;

    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    getServiceById(id)
      .then((svc) => {
        setDetailService(svc);
      })
      .catch((e: unknown) => {
        setDetailService(null);
        setDetailError(e instanceof Error ? e.message : "No se pudo cargar el servicio");
      })
      .finally(() => {
        setDetailLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyStatusToUrl = (value: ServiceStatus | "all") => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value === "all") params.delete("status");
    else params.set("status", value);

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`);
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!clientBoxRef.current) return;
      if (!clientBoxRef.current.contains(e.target as Node)) setClientOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openCreate = () => {
    setDrawerMode("create");
    setEditingService(null);
    setForm(initialForm);
    setClientQuery("");
    setClientOptions([]);
    setClientOpen(false);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openDetail = (service: ServiceItem) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailService(service);
    getServiceById(service.id)
      .then((svc) => {
        setDetailService(svc);
      })
      .catch((e: unknown) => {
        setDetailError(e instanceof Error ? e.message : "No se pudo cargar el servicio");
      })
      .finally(() => {
        setDetailLoading(false);
      });
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailError(null);
    setDetailLoading(false);
    setDetailService(null);

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (params.has("open")) {
      params.delete("open");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : `${pathname}`);
    }
  };

  useEffect(() => {
    if (!detailOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [detailOpen]);

  const openEdit = (service: ServiceItem) => {
    setDrawerMode("edit");
    setEditingService(service);
    setForm({
      client_id: service.client_id ?? null,
      client_label: service.client_name ?? "",
      service_name: service.service_name ?? "",
      description: service.description ?? "",
      start_date: toDateInputValue(service.start_date),
      expiration_date: toDateInputValue(service.expiration_date),
      reminder_days: String(service.reminder_days ?? 5),
      status: ((service.status as ServiceStatus) ?? "activo") as ServiceStatus
    });
    setClientQuery(service.client_name ?? "");
    setClientOptions([]);
    setClientOpen(false);
    setFormError(null);
    setDrawerOpen(true);
  };

  const validate = () => {
    if (!form.client_id) return "Selecciona un cliente";
    if (!form.service_name.trim()) return "Nombre del servicio requerido";
    if (!form.expiration_date.trim()) return "Fecha de expiración requerida";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const message = validate();
    if (message) {
      setFormError(message);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client_id: form.client_id as number,
        service_name: form.service_name.trim(),
        description: form.description.trim() || undefined,
        start_date: form.start_date.trim() || undefined,
        expiration_date: form.expiration_date.trim(),
        reminder_days: Number(form.reminder_days || 5),
        status: (form.status || "activo") as ServiceStatus
      };

      if (drawerMode === "create") {
        await createService(payload);
      } else {
        if (!editingService) throw new Error("Servicio no seleccionado");
        const serviceId = Number((editingService as unknown as { id?: unknown })?.id);
        if (!Number.isFinite(serviceId)) {
          throw new Error("ID de servicio inválido");
        }

        const prevStatus = ((editingService.status as ServiceStatus) ?? "activo") as ServiceStatus;
        await updateService(serviceId, payload);

        if (prevStatus !== "completado" && payload.status === "completado") {
          toast({
            title: "Servicio marcado como completado",
            variant: "success",
            presentation: "confirm",
            durationMs: 10000,
            actionLabel: "Deshacer",
            onAction: async () => {
              try {
                await updateService(serviceId, {
                  client_id: payload.client_id,
                  service_name: payload.service_name,
                  description: payload.description,
                  start_date: payload.start_date,
                  expiration_date: payload.expiration_date,
                  reminder_days: payload.reminder_days,
                  status: prevStatus
                });
                toast({ title: "Cambio deshecho", variant: "success", presentation: "confirm", iconOverride: "undo" });
                await fetchServices({ nextPage: page });
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "No se pudo deshacer";
                toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
              }
            }
          });

          // Evitar mostrar el toast genérico "Servicio actualizado" al mismo tiempo.
          window.dispatchEvent(new Event("notifications:refresh"));
          setDrawerOpen(false);
          await fetchServices({ nextPage: page });
          return;
        }
      }

      toast({
        title: drawerMode === "create" ? "Servicio creado" : "Servicio actualizado",
        variant: "success",
        presentation: "confirm"
      });

      window.dispatchEvent(new Event("notifications:refresh"));

      setDrawerOpen(false);
      await fetchServices({ nextPage: page });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar el servicio";
      setFormError(msg);
      toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (service: ServiceItem) => {
    setDeletingService(service);
    setDeleteOpen(true);
  };

  // ── Renewal handler ───────────────────────────────────────────────────────
  const openRenew = (service: ServiceItem) => {
    setRenewingService(service);
    // Default: +1 month from current expiration
    const old = new Date(service.expiration_date);
    old.setMonth(old.getMonth() + 1);

    const yyyy = old.getFullYear();
    const mm = String(old.getMonth() + 1).padStart(2, "0");
    const dd = String(old.getDate()).padStart(2, "0");
    setRenewDate(`${yyyy}-${mm}-${dd}`);
    setRenewError(null);
    setRenewOpen(true);
  };

  const confirmRenew = async () => {
    if (!renewingService) return;
    setRenewing(true);
    setRenewError(null);
    try {
      await renewService(renewingService.id, renewDate || undefined);
      toast({ title: "Servicio renovado", variant: "success", presentation: "confirm" });
      window.dispatchEvent(new Event("notifications:refresh"));
      setRenewOpen(false);
      setRenewingService(null);
      await fetchServices({ nextPage: page });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo renovar";
      setRenewError(msg);
      toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
    } finally {
      setRenewing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingService) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteService(deletingService.id);
      toast({ title: "Servicio eliminado", variant: "success", presentation: "confirm" });
      setDeleteOpen(false);
      setDeletingService(null);
      await fetchServices({ nextPage: page });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo eliminar servicio";
      setError(message);
      toast({ title: "Error", description: message, variant: "error", presentation: "confirm" });
    } finally {
      setDeleting(false);
    }
  };

  const pendingSoon = useMemo(() => {
    const now = Date.now();
    const soon = 1000 * 60 * 60 * 24 * 7;
    return services.filter((s) => {
      if ((s.status ?? "activo") !== "activo") return false;
      const t = new Date(s.expiration_date).getTime();
      if (Number.isNaN(t)) return false;
      return t >= now && t <= now + soon;
    }).length;
  }, [services]);

  const onClientSearch = (value: string) => {
    setClientQuery(value);
    setClientOpen(true);

    if (clientFetchTimeout.current) window.clearTimeout(clientFetchTimeout.current);

    clientFetchTimeout.current = window.setTimeout(async () => {
      const q = value.trim();
      if (q.length < 2) {
        setClientOptions([]);
        setClientLoading(false);
        return;
      }

      setClientLoading(true);
      try {
        const result = await getClientsPaginated({ page: 1, limit: 5, search: q });
        setClientOptions(result.data);
      } catch {
        setClientOptions([]);
      } finally {
        setClientLoading(false);
      }
    }, 250);
  };

  const selectClient = (client: ClientItem) => {
    setForm((p) => ({ ...p, client_id: client.id, client_label: client.name }));
    setClientQuery(client.name);
    setClientOpen(false);
  };

  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar servicio"
        description={deletingService ? `¿Seguro que deseas eliminar el servicio ${deletingService.service_name}?` : ""}
        confirmText={deleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        loading={deleting}
        variant="danger"
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (deleting) return;
          setDeleteOpen(open);
          if (!open) setDeletingService(null);
        }}
      />

      {/* ── Renewal Modal ──────────────────────────────────────────────────── */}
      <div className={cn("fixed inset-0 z-40", renewOpen ? "" : "pointer-events-none")}>
        <div
          className={cn("absolute inset-0 bg-black/50 transition-opacity", renewOpen ? "opacity-100" : "opacity-0")}
          onClick={() => { if (!renewing) { setRenewOpen(false); setRenewingService(null); }}}
        />
        <div className={cn("absolute inset-0 flex items-center justify-center p-4 transition-opacity", renewOpen ? "opacity-100" : "opacity-0")}>
          <aside
            className={cn(
              "relative z-50 flex w-full max-w-[440px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-2xl dark:border-[#1F2A44] dark:bg-[#0B1424] dark:text-[#F1F5F9]",
              renewOpen ? "scale-100" : "scale-95"
            )}
            role="dialog" aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4 dark:border-[#1F2A44]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Renovar servicio</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate max-w-[200px]">{renewingService?.service_name}</p>
                </div>
              </div>
              <button type="button" onClick={() => { if (!renewing) { setRenewOpen(false); setRenewingService(null); }}} className="rounded-xl p-1.5 text-[#64748B] hover:bg-[#F8FAFC] dark:text-[#94A3B8] dark:hover:bg-[#111E35]">
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {renewingService && (
                <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 dark:border-[#1F2A44] dark:bg-[#111E35]">
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Vencimiento actual</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    <CalendarClock className="h-4 w-4 text-amber-500" />
                    {new Date(renewingService.expiration_date).toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="renew-date">Nueva fecha de vencimiento</Label>
                <Input
                  id="renew-date"
                  type="date"
                  value={renewDate}
                  onChange={(e) => setRenewDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1 h-11 border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]"
                />
                <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Por defecto: +1 mes desde la fecha de vencimiento anterior.</p>
              </div>

              {renewError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{renewError}</div>
              )}

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => { if (!renewing) { setRenewOpen(false); setRenewingService(null); }}} disabled={renewing}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={confirmRenew}
                  disabled={renewing || !renewDate}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {renewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  {renewing ? "Renovando..." : "Confirmar renovación"}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-5 shadow-sm shadow-black/5 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Servicios</h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
              Monitorea vencimientos, estados y recordatorios.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nuevo servicio
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="col-span-2 rounded-2xl border border-[#E2E8F0] bg-[linear-gradient(135deg,rgba(59,130,246,0.14)_0%,rgba(99,102,241,0.08)_40%,rgba(255,255,255,0)_75%)] p-4 dark:border-[#1F2A44] dark:bg-[linear-gradient(135deg,rgba(59,130,246,0.18)_0%,rgba(16,185,129,0.05)_55%,rgba(5,11,22,0)_78%)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Panorama</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-[#BFDBFE]" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{totalAll}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#E2E8F0] bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#0F172A] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                Distribución
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  pendingSoon > 0
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                )}
              >
                {pendingSoon} vencen en 7 días
              </span>
            </div>

            <div className="mt-3 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1F2A44]">
              <div className="flex h-2 w-full">
                <div className="h-2 bg-[#3B82F6]" style={{ width: `${pct(activos)}%` }} />
                <div className="h-2 bg-amber-500" style={{ width: `${pct(vencidos)}%` }} />
                <div className="h-2 bg-emerald-500" style={{ width: `${pct(completados)}%` }} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white/70 px-2 py-2 text-[#0F172A] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
                <span>{pct(activos)}% activos</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white/70 px-2 py-2 text-[#0F172A] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>{pct(vencidos)}% vencidos</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white/70 px-2 py-2 text-[#0F172A] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>{pct(completados)}% completados</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = statusFilter === "activo" ? "all" : "activo";
              applyStatusToUrl(next);
            }}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              statusFilter === "activo"
                ? "border-[#3B82F6]/40 bg-[linear-gradient(135deg,rgba(59,130,246,0.18)_0%,rgba(255,255,255,0)_65%)]"
                : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#0B1424] dark:hover:bg-[#111E35]"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Activos</p>
              <ChevronDown className={cn("h-4 w-4", statusFilter === "activo" ? "rotate-180 text-[#3B82F6]" : "text-[#94A3B8]")} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{activos}</p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">En seguimiento</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-[#E2E8F0] dark:bg-[#1F2A44]">
              <div className="h-1.5 rounded-full bg-[#3B82F6]" style={{ width: `${pct(activos)}%` }} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = statusFilter === "vencido" ? "all" : "vencido";
              applyStatusToUrl(next);
            }}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              statusFilter === "vencido"
                ? "border-amber-500/40 bg-[linear-gradient(135deg,rgba(245,158,11,0.20)_0%,rgba(255,255,255,0)_65%)]"
                : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#0B1424] dark:hover:bg-[#111E35]"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Vencidos</p>
              <ShieldAlert className={cn("h-4 w-4", statusFilter === "vencido" ? "text-amber-300" : "text-[#94A3B8]")} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{vencidos}</p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Requieren acción</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-[#E2E8F0] dark:bg-[#1F2A44]">
              <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${pct(vencidos)}%` }} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = statusFilter === "completado" ? "all" : "completado";
              applyStatusToUrl(next);
            }}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              statusFilter === "completado"
                ? "border-emerald-500/40 bg-[linear-gradient(135deg,rgba(16,185,129,0.18)_0%,rgba(255,255,255,0)_65%)]"
                : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#0B1424] dark:hover:bg-[#111E35]"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Completados</p>
              <CheckCircle2 className={cn("h-4 w-4", statusFilter === "completado" ? "text-emerald-200" : "text-[#94A3B8]")} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{completados}</p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Finalizados</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-[#E2E8F0] dark:bg-[#1F2A44]">
              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct(completados)}%` }} />
            </div>
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Agenda de servicios</CardTitle>
          <CardDescription className="text-[#64748B] dark:text-[#94A3B8]">
            Vista rápida por vencimiento con estado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando servicios...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
          ) : services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6 text-sm text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]">
              No hay servicios para mostrar.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm shadow-black/5 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/20">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white text-xs text-[#64748B] backdrop-blur dark:bg-[#0B1424]/95 dark:text-[#94A3B8]">
                    <tr className="border-b border-[#E2E8F0] dark:border-[#1F2A44]">
                      <th className="px-4 py-3 font-semibold">Servicio</th>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold">Vence</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1F2A44]">
                    {services.map((s, idx) => (
                      <tr
                        key={s.id}
                        className={cn(
                          "group transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#111E35]",
                          idx % 2 === 1 ? "bg-[#F8FAFC] dark:bg-[#111E35]" : "bg-transparent"
                        )}
                        onClick={() => openDetail(s)}
                      >
                        <td className="px-4 py-3">
                          <p className="truncate font-medium text-[#0F172A] dark:text-[#F1F5F9]">{s.service_name}</p>
                          {s.description ? (
                            <p className="truncate text-xs text-[#64748B] dark:text-[#94A3B8]">{s.description}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <p className="truncate font-medium text-[#0F172A] dark:text-[#F1F5F9]">{s.client_name ?? "-"}</p>
                          <p className="truncate text-xs text-[#64748B] dark:text-[#94A3B8]">ID: {s.client_id}</p>
                        </td>
                        <td className="px-4 py-3 text-[#64748B] dark:text-[#94A3B8]">{formatDate(s.expiration_date)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                              statusClasses((s.status ?? "activo") as ServiceStatus)
                            )}
                          >
                            {statusLabel((s.status ?? "activo") as ServiceStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {/* Renovar: emerald when expired, subtle otherwise */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRenew(s);
                              }}
                              aria-label="Renovar"
                              title="Renovar servicio"
                              className={cn(
                                "rounded-xl border",
                                s.status === "vencido"
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:border-emerald-400/25 dark:text-emerald-300"
                                  : "border-transparent text-[#64748B] group-hover:border-[#E2E8F0] group-hover:bg-[#F8FAFC] dark:text-[#94A3B8] dark:group-hover:border-[#1F2A44] dark:group-hover:bg-[#111E35]"
                              )}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(s);
                              }}
                              aria-label="Editar"
                              className="rounded-xl border border-transparent text-[#0F172A] group-hover:border-[#E2E8F0] group-hover:bg-[#F8FAFC] dark:text-[#F1F5F9] dark:group-hover:border-[#1F2A44] dark:group-hover:bg-[#111E35]"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(s);
                              }}
                              aria-label="Eliminar"
                              className="rounded-xl border border-transparent text-red-600 hover:bg-red-500/10 dark:text-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 text-xs text-[#64748B] dark:border-[#1F2A44] dark:text-[#94A3B8]">
                <span>
                  Página {page} de {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9"
                    disabled={loading || page <= 1}
                    onClick={() => fetchServices({ nextPage: Math.max(1, page - 1) })}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9"
                    disabled={loading || page >= totalPages}
                    onClick={() => fetchServices({ nextPage: Math.min(totalPages, page + 1) })}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className={cn("fixed inset-0 z-40", detailOpen ? "" : "pointer-events-none")}>
        <div
          className={cn(
            "fixed inset-0 h-[100dvh] w-[100vw] bg-black/50 transition-opacity",
            detailOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={closeDetail}
        />

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center p-4 transition-opacity",
            detailOpen ? "opacity-100" : "opacity-0"
          )}
        >
          <aside
            className={cn(
              "relative z-50 flex w-full max-w-[680px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-2xl shadow-black/10 transition-transform dark:border-[#1F2A44] dark:bg-[#0B1424] dark:text-[#F1F5F9] dark:shadow-black/30",
              detailOpen ? "scale-100" : "scale-95"
            )}
            role="dialog"
            aria-modal="true"
            aria-label={detailService ? `Detalle servicio: ${detailService.service_name}` : "Detalle servicio"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#E2E8F0] px-5 py-5 dark:border-[#1F2A44]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{detailService?.service_name ?? "Servicio"}</p>
                  <p className="mt-1 truncate text-xs text-[#64748B] dark:text-[#94A3B8]">{detailService?.client_name ?? "Cliente"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-[#E2E8F0] bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#0F172A] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                      Servicio #{detailService?.id ?? "-"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[#E2E8F0] bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#0F172A] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                      Cliente #{detailService?.client_id ?? "-"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        statusClasses((detailService?.status ?? "activo") as ServiceStatus)
                      )}
                    >
                      {statusLabel((detailService?.status ?? "activo") as ServiceStatus)}
                    </span>
                  </div>
                </div>

                <Button variant="ghost" size="icon" onClick={closeDetail} className="rounded-xl">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-[calc(100dvh-12rem)] flex-1 overflow-auto p-5">
              {detailLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando detalle...
                </div>
              ) : detailError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{detailError}</div>
              ) : !detailService ? (
                <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]">
                  Sin información.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-[#E2E8F0] bg-white p-4 dark:border-[#1F2A44] dark:bg-[#070F1E]">
                    <p className="text-sm font-semibold">Resumen</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#1F2A44] dark:bg-[#111E35]">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Vence</p>
                        <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{formatDate(detailService.expiration_date)}</p>
                      </div>
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#1F2A44] dark:bg-[#111E35]">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Recordatorio</p>
                        <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{Number(detailService.reminder_days ?? 5)} día(s) antes</p>
                      </div>
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#1F2A44] dark:bg-[#111E35]">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Inicio</p>
                        <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{detailService.start_date ? formatDate(detailService.start_date) : "-"}</p>
                      </div>
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#1F2A44] dark:bg-[#111E35]">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Creado</p>
                        <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{detailService.created_at ? formatDate(detailService.created_at) : "-"}</p>
                      </div>
                    </div>
                  </div>

                  {detailService.description ? (
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 dark:border-[#1F2A44] dark:bg-[#070F1E]">
                      <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Descripción</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#0F172A] dark:text-[#F1F5F9]">{detailService.description}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (!detailService) return;
                        closeDetail();
                        openRenew(detailService);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Renovar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!detailService) return;
                        closeDetail();
                        openEdit(detailService);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="border border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/15 dark:text-red-200"
                      onClick={() => {
                        if (!detailService) return;
                        closeDetail();
                        onDelete(detailService);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className={cn("fixed inset-0 z-40", drawerOpen ? "" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setDrawerOpen(false)}
        />

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center p-4 transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
        >
          <aside
            className={cn(
              "relative z-50 flex w-full max-w-[620px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-2xl shadow-black/10 transition-transform dark:border-[#1F2A44] dark:bg-[#0B1424] dark:text-[#F1F5F9] dark:shadow-black/30",
              drawerOpen ? "scale-100" : "scale-95"
            )}
            role="dialog"
            aria-modal="true"
            aria-label={drawerMode === "create" ? "Crear servicio" : "Editar servicio"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-5 dark:border-[#1F2A44]">
              <div>
                <p className="text-sm font-semibold">{drawerMode === "create" ? "Nuevo servicio" : "Editar servicio"}</p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Selecciona el cliente por búsqueda y define vencimiento + estado.
                </p>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} className="rounded-xl">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={onSubmit} className="max-h-[calc(100dvh-10rem)] flex-1 overflow-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2" ref={clientBoxRef}>
                  <Label>Cliente</Label>
                  <div className="relative">
                    <Input
                      value={clientQuery}
                      onChange={(e) => {
                        onClientSearch(e.target.value);
                        setForm((p) => ({ ...p, client_id: null, client_label: "" }));
                      }}
                      onFocus={() => setClientOpen(true)}
                      placeholder="Escribe para buscar cliente (mín. 2 letras)"
                      className="h-11 border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                    />
                    {clientLoading ? (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#94A3B8]" />
                    ) : null}
                  </div>

                  {clientOpen ? (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-lg shadow-black/10 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/30">
                      {clientQuery.trim().length < 2 ? (
                        <div className="px-4 py-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                          Escribe al menos 2 letras para buscar.
                        </div>
                      ) : clientOptions.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-[#64748B] dark:text-[#94A3B8]">Sin resultados.</div>
                      ) : (
                        <div className="max-h-56 overflow-auto">
                          {clientOptions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectClient(c)}
                              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#111E35]"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-[#0F172A] dark:text-[#F1F5F9]">{c.name}</span>
                                <span className="block truncate text-xs text-[#64748B] dark:text-[#94A3B8]">{c.email}</span>
                              </span>
                              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">#{c.id}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {form.client_id ? (
                    <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-200">
                      Cliente seleccionado: {form.client_label} (ID {form.client_id})
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="service_name">Nombre del servicio</Label>
                  <Input
                    id="service_name"
                    value={form.service_name}
                    onChange={(e) => setForm((p) => ({ ...p, service_name: e.target.value }))}
                    placeholder="Ej. Dominio, Hosting, Mantenimiento"
                    className="h-11 border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Opcional"
                    className="h-11 border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div>
                  <Label htmlFor="start_date">Inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                    className="h-11 border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div>
                  <Label htmlFor="expiration_date">Expiración *</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={form.expiration_date}
                    onChange={(e) => setForm((p) => ({ ...p, expiration_date: e.target.value }))}
                    required
                    className="h-11 border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div>
                  <Label htmlFor="reminder_days">Recordatorio (días)</Label>
                  <Input
                    id="reminder_days"
                    type="number"
                    min={0}
                    value={form.reminder_days}
                    onChange={(e) => setForm((p) => ({ ...p, reminder_days: e.target.value }))}
                    className="h-11 border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ServiceStatus }))}
                    className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] shadow-sm outline-none transition-colors focus:border-[#3B82F6]/40 focus:ring-2 focus:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:focus:border-[#3B82F6]/60 dark:focus:ring-[#3B82F6]/40"
                  >
                    <option value="activo">activo</option>
                    <option value="vencido">vencido</option>
                    <option value="completado">completado</option>
                  </select>
                </div>
              </div>

              {formError ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{formError}</div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDrawerOpen(false);
                    setFormError(null);
                  }}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Guardar
                </Button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
