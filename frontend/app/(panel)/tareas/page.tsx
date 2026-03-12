"use client";

import { useEffect, useState } from "react";
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
  getAllTasks,
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

function getTaskUrgency(dueDate: string): "overdue" | "today" | "upcoming" | "future" {
  const today = startOfDay(new Date());
  const due = startOfDay(parseISO(dueDate));
  if (isBefore(due, today)) return "overdue";
  if (isToday(due)) return "today";
  if (isAfter(due, today) && isBefore(due, new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))) return "upcoming";
  return "future";
}

export default function TareasPage() {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [completingId, setCompletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const TASKS_PER_PAGE = 10;

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllTasks();
      setTasks(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      toast({ title: "Tarea creada", variant: "success" });
      setDrawerOpen(false);
      await fetchTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo crear la tarea";
      setFormError(msg);
      toast({ title: "Error", description: msg, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onComplete = async (task: TaskItem) => {
    setCompletingId(task.id);
    try {
      await completeTask(task.id);
      toast({ title: "Tarea completada", variant: "success" });
      await fetchTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo completar la tarea";
      toast({ title: "Error", description: msg, variant: "error" });
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
      toast({ title: "Tarea eliminada", variant: "success" });
      setDeleteOpen(false);
      setDeletingTask(null);
      await fetchTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar la tarea";
      toast({ title: "Error", description: msg, variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const overdueTasks = pendingTasks.filter((t) => getTaskUrgency(t.due_date) === "overdue");
  const todayTasks = pendingTasks.filter((t) => getTaskUrgency(t.due_date) === "today");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const pagedTasks = filteredTasks.slice((page - 1) * TASKS_PER_PAGE, page * TASKS_PER_PAGE);

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

        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 shadow-sm shadow-black/5 dark:border-amber-400/25 dark:bg-amber-400/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pendientes</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/25 bg-white/70 text-amber-700 dark:border-amber-400/25 dark:bg-white/10 dark:text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-800 dark:text-amber-200">
            {pendingTasks.length}
          </p>
          <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">Por completar</p>
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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Listado</CardTitle>
            <CardDescription className="text-[#64748B] dark:text-[#94A3B8]">
              Tareas internas ordenadas por fecha límite.
            </CardDescription>
          </div>

          {/* Filtros */}
          <div className="flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1 dark:border-[#1F2A44] dark:bg-[#111E35]">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
            onClick={() => { setFilter(f); setPage(1); }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f
                    ? "bg-white text-[#0F172A] shadow-sm dark:bg-[#1F2A44] dark:text-[#F1F5F9]"
                    : "text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F1F5F9]"
                )}
              >
                {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Completadas"}
              </button>
            ))}
          </div>
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
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 opacity-40" />
              {filter === "all"
                ? "No hay tareas registradas. Crea una nueva."
                : filter === "pending"
                  ? "No hay tareas pendientes."
                  : "No hay tareas completadas."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm shadow-black/5 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/20">
              <div className="divide-y divide-[#E2E8F0] dark:divide-[#1F2A44]">
                {pagedTasks.map((task) => {
                  const urgency = task.status === "completed" ? null : getTaskUrgency(task.due_date);
                  const urgencyCfg = urgency ? urgencyConfig[urgency] : null;
                  const isCompleting = completingId === task.id;

                  let formattedDate = task.due_date;
                  try {
                    formattedDate = format(parseISO(task.due_date), "d MMM yyyy", { locale: es });
                  } catch {
                    /* keep raw */
                  }

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#111E35]",
                        urgencyCfg?.row
                      )}
                    >
                      {/* Check button */}
                      {task.status === "pending" ? (
                        <button
                          onClick={() => onComplete(task)}
                          disabled={isCompleting}
                          aria-label="Marcar como completada"
                          className="mt-0.5 shrink-0 text-[#94A3B8] transition-colors hover:text-emerald-500 disabled:opacity-50"
                        >
                          {isCompleting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                      ) : (
                        <div className="mt-0.5 shrink-0 text-emerald-500">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "font-medium text-[#0F172A] dark:text-[#F1F5F9]",
                            task.status === "completed" && "line-through opacity-50"
                          )}
                        >
                          {task.title}
                        </p>

                        {task.description ? (
                          <p className="mt-0.5 truncate text-xs text-[#64748B] dark:text-[#94A3B8]">
                            {task.description}
                          </p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                            <Clock className="h-3 w-3" />
                            {formattedDate}
                          </span>

                          {urgencyCfg && (
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                urgencyCfg.badge
                              )}
                            >
                              {urgencyCfg.label}
                            </span>
                          )}

                          {task.status === "completed" && (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
                              Completada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(task)}
                          aria-label="Eliminar tarea"
                          className="h-8 w-8 rounded-xl border border-transparent text-red-600 hover:bg-red-500/10 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paginación */}
          {!loading && !error && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Página {page} de {totalPages} · {filteredTasks.length} tareas
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:opacity-40 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:text-[#94A3B8] dark:hover:bg-[#111E35]"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-8 w-8 rounded-xl text-xs font-medium transition-colors",
                        p === page
                          ? "bg-[#0F172A] text-white dark:bg-[#3B82F6]"
                          : "border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#0B1424] dark:text-[#94A3B8] dark:hover:bg-[#111E35]"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:opacity-40 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:text-[#94A3B8] dark:hover:bg-[#111E35]"
                >
                  ›
                </button>
              </div>
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
                  placeholder="Ej: Cobrar a cliente Acme Corp"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:border-[#3B82F6]/40 focus-visible:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:border-[#3B82F6]/60 dark:focus-visible:ring-[#3B82F6]/40"
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
