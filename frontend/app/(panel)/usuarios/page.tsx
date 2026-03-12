"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, BellOff, CheckCircle2, Loader2, Pencil, Plus, ShieldCheck, Trash2, User2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  createUser,
  deleteUser,
  getUsersPaginated,
  updateUser,
  type UserItem,
  type UserRole
} from "@/services/usersService";

type DrawerMode = "create" | "edit";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: UserRole;
  is_active: boolean;
  receive_notifications: boolean;
};

const initialForm: FormState = {
  name: "",
  email: "",
  password: "",
  confirm_password: "",
  role: "staff",
  is_active: true,
  receive_notifications: true
};

function roleLabel(role: UserRole) {
  return role === "admin" ? "Administrador" : "Empleado";
}

export default function UsuariosPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [activeTotal, setActiveTotal] = useState(0);
  const [adminTotal, setAdminTotal] = useState(0);
  const [staffTotal, setStaffTotal] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeCount = useMemo(() => activeTotal, [activeTotal]);
  const adminCount = useMemo(() => adminTotal, [adminTotal]);
  const staffCount = useMemo(() => staffTotal, [staffTotal]);

  const fetchUsers = async ({ nextSearch, nextPage }: { nextSearch?: string; nextPage?: number } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const finalSearch = nextSearch ?? search;
      const finalPage = nextPage ?? page;

      const result = await getUsersPaginated({
        page: finalPage,
        limit,
        search: finalSearch
      });

      setUsers(result.data);
      setTotalUsers(result.pagination.total ?? 0);
      setTotalPages(result.pagination.total_pages ?? 1);
      setPage(result.pagination.page ?? finalPage);

      setActiveTotal(Number(result.summary?.active ?? 0));
      setAdminTotal(Number(result.summary?.admin ?? 0));
      setStaffTotal(Number(result.summary?.staff ?? 0));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = (searchParams?.get("search") ?? "").toString();
    setSearch(q);
    setPage(1);
    fetchUsers({ nextSearch: q, nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openCreate = () => {
    setDrawerMode("create");
    setEditingUser(null);
    setForm(initialForm);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (user: UserItem) => {
    setDrawerMode("edit");
    setEditingUser(user);
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      confirm_password: "",
      role: user.role,
      is_active: Boolean(user.is_active),
      receive_notifications: user.receive_notifications !== false
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const validate = () => {
    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim();

    if (!normalizedName) return "Nombre requerido";
    if (!normalizedEmail) return "Email requerido";

    if (drawerMode === "create") {
      if (!form.password || form.password.length < 8) return "La contraseña debe tener mínimo 8 caracteres";
      if (form.password !== form.confirm_password) return "Las contraseñas no coinciden";
    } else {
      const hasPassword = Boolean(form.password || form.confirm_password);
      if (hasPassword) {
        if (!form.password || form.password.length < 8) return "La contraseña debe tener mínimo 8 caracteres";
        if (form.password !== form.confirm_password) return "Las contraseñas no coinciden";
      }
    }

    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    try {
      if (drawerMode === "create") {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          is_active: form.is_active,
          receive_notifications: form.receive_notifications
        });
      } else {
        if (!editingUser) throw new Error("Usuario no seleccionado");
        const hasPassword = Boolean(form.password || form.confirm_password);
        await updateUser(editingUser.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          is_active: form.is_active,
          receive_notifications: form.receive_notifications,
          ...(hasPassword ? { password: form.password } : {})
        });
      }

      toast({
        title: drawerMode === "create" ? "Usuario creado" : "Usuario actualizado",
        variant: "success"
      });

      setDrawerOpen(false);
      setForm(initialForm);
      setEditingUser(null);
      await fetchUsers();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo guardar usuario";
      setFormError(message);
      toast({ title: "Error", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (user: UserItem) => {
    setDeletingUser(user);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await deleteUser(deletingUser.id);
      toast({ title: "Usuario eliminado", variant: "success" });
      setDeleteOpen(false);
      setDeletingUser(null);
      await fetchUsers();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo eliminar usuario";
      setError(message);
      toast({ title: "Error", description: message, variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar usuario"
        description={deletingUser ? `¿Seguro que deseas eliminar el usuario ${deletingUser.name}?` : ""}
        confirmText={deleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        loading={deleting}
        variant="danger"
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (deleting) return;
          setDeleteOpen(open);
          if (!open) setDeletingUser(null);
        }}
      />
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Usuarios</h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">Gestiona los usuarios que acceden al sistema.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Total */}
          <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: "#3B82F6", filter: "blur(16px)" }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Total</p>
                <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{totalUsers}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">Registrados</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#3B82F618", border: "1px solid #3B82F630" }}>
                <User2 className="h-5 w-5" style={{ color: "#3B82F6" }} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full opacity-60" style={{ background: "linear-gradient(to right, #3B82F6, transparent)" }} />
          </div>

          {/* Activos */}
          <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: "#3B82F6", filter: "blur(16px)" }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Activos</p>
                <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{activeCount}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">Con acceso</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#3B82F618", border: "1px solid #3B82F630" }}>
                <CheckCircle2 className="h-5 w-5" style={{ color: "#3B82F6" }} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full opacity-60" style={{ background: "linear-gradient(to right, #3B82F6, transparent)" }} />
          </div>

          {/* Admins */}
          <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: "#3B82F6", filter: "blur(16px)" }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Admins</p>
                <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{adminCount}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">Permisos elevados</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#3B82F618", border: "1px solid #3B82F630" }}>
                <ShieldCheck className="h-5 w-5" style={{ color: "#3B82F6" }} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full opacity-60" style={{ background: "linear-gradient(to right, #3B82F6, transparent)" }} />
          </div>

          {/* Empleados */}
          <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: "#3B82F6", filter: "blur(16px)" }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Empleados</p>
                <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{staffCount}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">Rol staff</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#3B82F618", border: "1px solid #3B82F630" }}>
                <User2 className="h-5 w-5" style={{ color: "#3B82F6" }} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full opacity-60" style={{ background: "linear-gradient(to right, #3B82F6, transparent)" }} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Listado</CardTitle>
          <CardDescription className="text-[#64748B] dark:text-[#94A3B8]">Usuarios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando usuarios...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6 text-sm text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]">
              No hay usuarios registrados.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm shadow-black/5 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/20">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white text-xs text-[#64748B] backdrop-blur dark:bg-[#0B1424]/95 dark:text-[#94A3B8]">
                    <tr className="border-b border-[#E2E8F0] dark:border-[#1F2A44]">
                      <th className="px-4 py-3 font-semibold">Nombre</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell">Email</th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell">Rol</th>
                      <th className="hidden px-4 py-3 font-semibold lg:table-cell">Notif. correo</th>
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1F2A44]">
                    {users.map((u, idx) => (
                      <tr
                        key={u.id}
                        className={cn(
                          "group transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#111E35]",
                          idx % 2 === 1 ? "bg-[#F8FAFC] dark:bg-[#111E35]" : "bg-transparent"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] shadow-sm dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                              <User2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#0F172A] dark:text-[#F1F5F9]">{u.name}</p>
                              <p className="truncate text-xs text-[#64748B] dark:text-[#94A3B8] sm:hidden">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-[#64748B] dark:text-[#94A3B8] sm:table-cell">
                          <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{u.email}</span>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <span
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                              u.role === "admin"
                                ? "border-[#3B82F6]/25 bg-[#3B82F6]/10 text-[#0F172A] dark:border-[#3B82F6]/30 dark:text-[#F1F5F9]"
                                : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]"
                            )}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {roleLabel(u.role)}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          {u.receive_notifications !== false ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-2.5 py-1 text-xs font-semibold text-[#3B82F6]">
                              <Bell className="h-3 w-3" />
                              Activas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#94A3B8] dark:border-[#1F2A44] dark:bg-[#111E35]">
                              <BellOff className="h-3 w-3" />
                              Omitir
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(u)}
                              aria-label="Editar"
                              className="rounded-xl border border-transparent text-[#0F172A] group-hover:border-[#E2E8F0] group-hover:bg-[#F8FAFC] dark:text-[#F1F5F9] dark:group-hover:border-[#1F2A44] dark:group-hover:bg-[#111E35]"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(u)}
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
                    onClick={() => fetchUsers({ nextPage: Math.max(1, page - 1) })}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9"
                    disabled={loading || page >= totalPages}
                    onClick={() => fetchUsers({ nextPage: Math.min(totalPages, page + 1) })}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              "relative z-50 flex w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-2xl shadow-black/10 transition-transform dark:border-[#1F2A44] dark:bg-[#0B1424] dark:text-[#F1F5F9] dark:shadow-black/30",
              drawerOpen ? "scale-100" : "scale-95"
            )}
            role="dialog"
            aria-modal="true"
            aria-label={drawerMode === "create" ? "Crear usuario" : "Editar usuario"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-5 dark:border-[#1F2A44]">
              <div>
                <p className="text-sm font-semibold">{drawerMode === "create" ? "Nuevo usuario" : "Editar usuario"}</p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {drawerMode === "create"
                    ? "Completa los datos para crear un usuario."
                    : "Actualiza los datos del usuario."}
                </p>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} className="rounded-xl">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={onSubmit} className="max-h-[calc(100dvh-12rem)] flex-1 overflow-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Nombre"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    className="border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div className="sm:col-span-1">
                  <Label htmlFor="password">{drawerMode === "create" ? "Contraseña *" : "Nueva contraseña"}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={drawerMode === "create" ? "Mínimo 8 caracteres" : "Dejar en blanco para no cambiar"}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required={drawerMode === "create"}
                    className="border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div className="sm:col-span-1">
                  <Label htmlFor="confirm_password">{drawerMode === "create" ? "Confirmar Contraseña *" : "Confirmar contraseña"}</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Repetir contraseña"
                    value={form.confirm_password}
                    onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
                    required={drawerMode === "create"}
                    className="border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div className="sm:col-span-1">
                  <Label htmlFor="role">Rol *</Label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  >
                    <option value="staff">Empleado</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <Label>Usuario activo</Label>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm dark:border-[#1F2A44] dark:bg-[#111E35]">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-white/20"
                    />
                    <span className="text-[#0F172A] dark:text-[#F1F5F9]">
                      {form.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </label>
                </div>

                {/* Notificaciones por correo */}
                <div className="sm:col-span-2">
                  <Label>Notificaciones por correo</Label>
                  <p className="mb-2 text-xs text-[#94A3B8]">Si está desactivado, este usuario NO recibirá correos de avisos de tareas ni servicios.</p>
                  <label className={cn(
                    "inline-flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                    form.receive_notifications
                      ? "border-[#3B82F6]/30 bg-[#3B82F6]/5 dark:bg-[#3B82F6]/10"
                      : "border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35]"
                  )}>
                    <div className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      form.receive_notifications ? "bg-[#3B82F6]" : "bg-[#94A3B8]/40"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        form.receive_notifications ? "translate-x-4" : "translate-x-0.5"
                      )} />
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={form.receive_notifications}
                        onChange={(e) => setForm((p) => ({ ...p, receive_notifications: e.target.checked }))}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                        {form.receive_notifications ? 'Recibe correos' : 'No recibe correos'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {formError ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {formError}
                </div>
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
