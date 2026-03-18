"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  Loader2,
  Plus,
  Trash2,
  XCircle
} from "lucide-react";
import { format, isAfter, isBefore, isToday, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  completeTask,
  createTask,
  deleteTask,
  getCompletedTasksPaginated,
  getPendingTasks,
  setTaskPending,
  type TaskItem
} from "@/services/tasksService";

type FormState = {
  title: string;
  description: string;
  due_date: string;
};

const initialForm: FormState = {
  title: "",
  description: "",
  due_date: ""
};

function parseDateOnlyLocal(value: string) {
  const raw = String(value ?? "");
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(y, mo - 1, d);
  }
  return parseISO(raw);
}

function getTaskUrgency(dueDate: string): "overdue" | "today" | "upcoming" | "future" {
  const today = startOfDay(new Date());
  const due = startOfDay(parseDateOnlyLocal(dueDate));
  if (isBefore(due, today)) return "overdue";
  if (isToday(due)) return "today";
  if (isAfter(due, today) && isBefore(due, new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))) return "upcoming";
  return "future";
}

export default function TareasPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const search = (searchParams?.get("search") ?? "").toString();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [completingId, setCompletingId] = useState<number | null>(null);

  const COMPLETED_LIMIT = 4;
  const [completedPage, setCompletedPage] = useState(1);
  const [completedHasMore, setCompletedHasMore] = useState(false);
  const [loadingMoreCompleted, setLoadingMoreCompleted] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pending, completedRes] = await Promise.all([
        getPendingTasks(),
        getCompletedTasksPaginated({ page: 1, limit: COMPLETED_LIMIT })
      ]);

      setCompletedPage(1);
      setCompletedHasMore((completedRes.pagination?.total_pages ?? 1) > 1);
      setTasks([...pending, ...completedRes.data]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreCompleted = async () => {
    if (loadingMoreCompleted || !completedHasMore) return;
    const nextPage = completedPage + 1;

    setLoadingMoreCompleted(true);
    try {
      const res = await getCompletedTasksPaginated({ page: nextPage, limit: COMPLETED_LIMIT });
      setCompletedPage(nextPage);
      setCompletedHasMore(nextPage < (res.pagination?.total_pages ?? nextPage));

      setTasks((prev) => {
        const pending = prev.filter((t) => t.status === "pending");
        const completedExisting = prev.filter((t) => t.status === "completed");
        const seen = new Set(completedExisting.map((t) => t.id));
        const appended = res.data.filter((t) => !seen.has(t.id));
        return [...pending, ...completedExisting, ...appended];
      });
    } catch {
      // ignore
    } finally {
      setLoadingMoreCompleted(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openCreate = () => {
    setForm(initialForm);
    setFormError(null);
    setDrawerOpen(true);
  };

  const validate = () => {
    if (!form.title.trim()) return "El título es requerido";
    if (!form.due_date) return "La fecha límite es requerida";
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
      await createTask({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        due_date: form.due_date
      });

      toast({ title: "Tarea creada", variant: "success", presentation: "confirm" });
      setDrawerOpen(false);
      await fetchTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo crear la tarea";
      setFormError(msg);
      toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
    } finally {
      setSaving(false);
    }
  };

  const onComplete = async (task: TaskItem) => {
    setCompletingId(task.id);
    try {
      await completeTask(task.id);
      let undone = false;
      toast({
        title: "Marcada como completada",
        description: "Puedes deshacer durante 10 segundos",
        variant: "info",
        presentation: "confirm",
        durationMs: 10000,
        actionLabel: "Deshacer",
        onAction: async () => {
          undone = true;
          try {
            await setTaskPending(task.id);
            toast({ title: "Tarea restaurada", variant: "success", presentation: "confirm", iconOverride: "undo" });
            await fetchTasks();
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "No se pudo deshacer";
            toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
          }
        }
      });

      await fetchTasks();

      window.setTimeout(() => {
        if (undone) return;
        toast({ title: "Tarea completada", variant: "success", presentation: "confirm" });
      }, 10000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo completar la tarea";
      toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
    } finally {
      setCompletingId(null);
    }
  };

  const onDelete = (task: TaskItem) => {
    setDeletingTask(task);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    setDeleting(true);
    try {
      await deleteTask(deletingTask.id);
      toast({ title: "Tarea eliminada", variant: "success", presentation: "confirm" });
      setDeleteOpen(false);
      setDeletingTask(null);
      await fetchTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar la tarea";
      toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
    } finally {
      setDeleting(false);
    }
  };

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const overdueTasks = pendingTasks.filter((t) => getTaskUrgency(t.due_date) === "overdue");
  const todayTasks = pendingTasks.filter((t) => getTaskUrgency(t.due_date) === "today");

  const todoTasks = pendingTasks.filter((t) => {
    const u = getTaskUrgency(t.due_date);
    return u !== "overdue" && u !== "today";
  });

  const searchFilteredTasks = tasks.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const title = String(t.title ?? "").toLowerCase();
    const desc = String((t as unknown as { description?: string | null })?.description ?? "").toLowerCase();
    return title.includes(q) || desc.includes(q);
  });

  const boardPending = searchFilteredTasks.filter((t) => t.status === "pending");
  const boardCompleted = searchFilteredTasks.filter((t) => t.status === "completed");

  const boardOverdue = boardPending.filter((t) => getTaskUrgency(t.due_date) === "overdue");
  const boardTodo = boardPending.filter((t) => {
    const u = getTaskUrgency(t.due_date);
    return u !== "overdue" && u !== "today";
  });

  const urgencyConfig = {
    overdue: {
      label: "Vencida",
      badge:
        "border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300",
      row: "border-l-4 border-l-red-500"
    },
    today: {
      label: "Hoy",
      badge:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
      row: "border-l-4 border-l-amber-500"
    },
    upcoming: {
      label: "Esta semana",
      badge:
        "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300",
      row: "border-l-4 border-l-blue-500"
    },
    future: {
      label: "Próxima",
      badge:
        "border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]",
      row: ""
    }
  };

  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar tarea"
        description={deletingTask ? `¿Seguro que deseas eliminar "${deletingTask.title}"?` : ""}
        confirmText={deleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        loading={deleting}
        variant="danger"
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (deleting) return;
          setDeleteOpen(open);
          if (!open) setDeletingTask(null);
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
            Tareas internas
          </h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
            Recordatorios internos del equipo. Ej: cobrar a cliente, renovar licencia.
          </p>
        </div>

        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nueva tarea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-4 shadow-sm shadow-black/5 dark:border-[#1F2A44] dark:bg-none dark:bg-[#0B1424] dark:shadow-black/20">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Total</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] shadow-sm dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
            {totalTasks}
          </p>
          <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Tareas registradas</p>
        </div>

        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 shadow-sm shadow-black/5 dark:border-blue-400/25 dark:bg-blue-400/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Pendientes</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/25 bg-white/70 text-blue-700 dark:border-blue-400/25 dark:bg-white/10 dark:text-blue-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-800 dark:text-blue-200">
            {pendingTasks.length}
          </p>
          <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-300/80">Por completar</p>
        </div>

        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 shadow-sm shadow-black/5 dark:border-red-400/25 dark:bg-red-400/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-red-700 dark:text-red-300">Vencidas</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/25 bg-white/70 text-red-700 dark:border-red-400/25 dark:bg-white/10 dark:text-red-300">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-red-800 dark:text-red-200">
            {overdueTasks.length}
          </p>
          <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">Requieren atención</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 shadow-sm shadow-black/5 dark:border-emerald-400/25 dark:bg-emerald-400/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Completadas</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-white/70 text-emerald-700 dark:border-emerald-400/25 dark:bg-white/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-800 dark:text-emerald-200">
            {completedTasks.length}
          </p>
          <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">Finalizadas</p>
        </div>
      </div>

      {/* Alerta de hoy */}
      {todayTasks.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tienes <strong>{todayTasks.length}</strong>{" "}
            {todayTasks.length === 1 ? "tarea que vence hoy" : "tareas que vencen hoy"}.
          </span>
        </div>
      )}

      {/* Lista */}
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Tablero</CardTitle>
          <CardDescription className="text-[#64748B] dark:text-[#94A3B8]">
            Organiza las tareas por estado y urgencia.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando tareas...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : searchFilteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 opacity-40" />
              {search.trim() ? "No se encontraron tareas con esa búsqueda." : "No hay tareas registradas. Crea una nueva."}
            </div>
          ) : (
            <div>
              {(() => {
                const columns = (
                  [
                    {
                      key: "todo",
                      title: "Por completar",
                      count: boardTodo.length,
                      tone: "border-slate-200 bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35]",
                      data: boardTodo
                    },
                    {
                      key: "overdue",
                      title: "Vencidas",
                      count: boardOverdue.length,
                      tone: "border-red-500/25 bg-red-500/10 dark:border-red-400/25 dark:bg-red-400/10",
                      data: boardOverdue
                    },
                    {
                      key: "completed",
                      title: "Completadas",
                      count: boardCompleted.length,
                      tone: "border-emerald-500/25 bg-emerald-500/10 dark:border-emerald-400/25 dark:bg-emerald-400/10",
                      data: boardCompleted
                    }
                  ] as const
                ).filter((col) => col.count > 0);

                const gridColsClass =
                  columns.length <= 1
                    ? "grid-cols-1"
                    : columns.length === 2
                      ? "grid-cols-1 lg:grid-cols-2"
                      : "grid-cols-1 lg:grid-cols-3";

                return (
                  <div className={cn("grid gap-5", gridColsClass)}>
                    {columns.map((col) => (
                      <div key={col.key} className={cn("min-w-0 rounded-3xl border p-4", col.tone)}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{col.title}</p>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-[#0F172A] dark:bg-white/10 dark:text-[#F1F5F9]">
                        {col.count}
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      {col.data
                        .slice()
                        .sort((a, b) => {
                          try {
                            return parseDateOnlyLocal(a.due_date).getTime() - parseDateOnlyLocal(b.due_date).getTime();
                          } catch {
                            return 0;
                          }
                        })
                        .slice(0, col.key === "completed" ? undefined : 4)
                        .map((task) => {
                            const urgency = task.status === "completed" ? null : getTaskUrgency(task.due_date);
                            const urgencyCfg = urgency ? urgencyConfig[urgency] : null;
                            const isCompleting = completingId === task.id;

                            let formattedDate = task.due_date;
                            try {
                              formattedDate = format(parseDateOnlyLocal(task.due_date), "d MMM yyyy", { locale: es });
                            } catch {
                              /* keep raw */
                            }

                            return (
                              <div
                                key={task.id}
                                className="rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-sm shadow-black/5 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/20"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p
                                      className={cn(
                                        "truncate text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]",
                                        task.status === "completed" && "line-through opacity-50"
                                      )}
                                      title={task.title}
                                    >
                                      {task.title}
                                    </p>

                                    {task.description ? (
                                      <p className="mt-1 line-clamp-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                                        {task.description}
                                      </p>
                                    ) : null}
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(task)}
                                    aria-label="Eliminar"
                                    className="h-8 w-8 rounded-xl border border-transparent text-red-600 hover:bg-red-500/10 dark:text-red-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                  <span className="flex items-center gap-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                                    <Clock className="h-3 w-3" />
                                    {formattedDate}
                                  </span>

                                  {urgencyCfg ? (
                                    <span
                                      className={cn(
                                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                        urgencyCfg.badge
                                      )}
                                    >
                                      {urgencyCfg.label}
                                    </span>
                                  ) : (
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
                                      Completada
                                    </span>
                                  )}
                                </div>

                                <div className="mt-3">
                                  {task.status === "pending" ? (
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      className="h-9 w-full rounded-2xl"
                                      disabled={isCompleting}
                                      onClick={() => onComplete(task)}
                                    >
                                      {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Circle className="h-4 w-4" />}
                                      Completar
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      className="h-9 w-full rounded-2xl"
                                      onClick={async () => {
                                        await setTaskPending(task.id);
                                        await fetchTasks();
                                      }}
                                    >
                                      Reabrir
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                      {col.key === "completed" && completedHasMore && !search.trim() ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-10 w-full rounded-2xl"
                          onClick={loadMoreCompleted}
                          disabled={loadingMoreCompleted}
                        >
                          {loadingMoreCompleted ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Cargar más
                        </Button>
                      ) : null}
                    </div>
                  </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer / Modal crear tarea */}
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
              "relative z-50 flex w-full max-w-[480px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-2xl shadow-black/10 transition-transform dark:border-[#1F2A44] dark:bg-[#0B1424] dark:text-[#F1F5F9] dark:shadow-black/30",
              drawerOpen ? "scale-100" : "scale-95"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Nueva tarea"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-5 dark:border-[#1F2A44]">
              <div>
                <p className="text-sm font-semibold">Nueva tarea interna</p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Crea un recordatorio interno para el equipo.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} className="rounded-xl">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={onSubmit} className="flex-1 space-y-4 overflow-auto p-5">
              <div>
                <Label htmlFor="task-title">Título *</Label>
                <Input
                  id="task-title"
                  placeholder="Ej: Recordatorio: hacer pedido"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                />
              </div>

              <div>
                <Label htmlFor="task-description">Descripción</Label>
                <textarea
                  id="task-description"
                  placeholder="Detalles adicionales..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none transition focus:border-[#3B82F6]/40 focus:ring-2 focus:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8]"
                />
              </div>

              <div>
                <Label htmlFor="task-due-date">Fecha límite *</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                  required
                  className="border-[#E2E8F0] bg-white text-[#0F172A] focus-visible:border-[#3B82F6]/40 focus-visible:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:focus-visible:border-[#3B82F6]/60 dark:focus-visible:ring-[#3B82F6]/40"
                />
              </div>

              {formError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                  {formError}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
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
                  Crear tarea
                </Button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
