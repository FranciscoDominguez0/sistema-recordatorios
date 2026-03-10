"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, ShieldCheck, Trash2, User2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createUser,
  deleteUser,
  getUsers,
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
};

const initialForm: FormState = {
  name: "",
  email: "",
  password: "",
  confirm_password: "",
  role: "staff",
  is_active: true
};

function roleLabel(role: UserRole) {
  return role === "admin" ? "Administrador" : "Empleado";
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const activeCount = useMemo(() => users.filter((u) => u.is_active).length, [users]);

  const fetchUsers = async (nextSearch?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers(nextSearch ?? search);
      setUsers(data);
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
      is_active: Boolean(user.is_active)
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
          is_active: form.is_active
        });
      } else {
        if (!editingUser) throw new Error("Usuario no seleccionado");

        const hasPassword = Boolean(form.password || form.confirm_password);
        await updateUser(editingUser.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          is_active: form.is_active,
          ...(hasPassword ? { password: form.password } : {})
        });
      }

      setDrawerOpen(false);
      setForm(initialForm);
      setEditingUser(null);
      await fetchUsers();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "No se pudo guardar usuario");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (user: UserItem) => {
    const ok = window.confirm(`¿Eliminar el usuario ${user.name}?`);
    if (!ok) return;

    try {
      await deleteUser(user.id);
      await fetchUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar usuario");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Usuarios</CardTitle>
              <CardDescription>Gestiona los usuarios que acceden al sistema.</CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email"
                className="h-11 sm:w-[260px]"
              />
              <Button
                variant="secondary"
                onClick={() => fetchUsers(search)}
                className="w-full sm:w-auto"
              >
                Buscar
              </Button>
              <Button onClick={openCreate} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando usuarios...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-white/40 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-white/5 dark:text-neutral-300">
                No hay usuarios registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                      <th className="px-3 py-3">Nombre</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Rol</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900/5 text-neutral-900 dark:bg-white/10 dark:text-neutral-100">
                              <User2 className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-neutral-600 dark:text-neutral-300">{u.email}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-3 py-1 text-xs font-medium text-neutral-800 dark:border-white/10 dark:bg-white/5 dark:text-neutral-100">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {roleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-neutral-500/20 bg-neutral-500/10 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200">
                              <XCircle className="h-3.5 w-3.5" />
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(u)} aria-label="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(u)}
                              aria-label="Eliminar"
                              className="text-red-600 hover:bg-red-500/10 dark:text-red-300"
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
            <CardDescription>Estado actual del módulo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{users.length}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Activos</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn(drawerOpen ? "" : "pointer-events-none")}
      >
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setDrawerOpen(false)}
        />

        <aside
          className={cn(
            "fixed right-0 top-0 z-50 flex h-dvh w-[92vw] max-w-[520px] flex-col border-l border-black/10 bg-white text-neutral-900 shadow-2xl transition-transform dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100",
            drawerOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label={drawerMode === "create" ? "Crear usuario" : "Editar usuario"}
        >
          <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-5 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold">{drawerMode === "create" ? "Nuevo usuario" : "Editar usuario"}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {drawerMode === "create"
                  ? "Completa los datos para crear un usuario."
                  : "Actualiza los datos del usuario."}
              </p>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} className="rounded-xl">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={onSubmit} className="flex-1 overflow-auto p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Nombre"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
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
                />
              </div>

              <div className="sm:col-span-1">
                <Label htmlFor="role">Rol *</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-neutral-900/10 focus-visible:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus-visible:ring-neutral-100/10"
                >
                  <option value="staff">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <Label>Usuario activo</Label>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900/40">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  <span className="text-neutral-800 dark:text-neutral-100">
                    {form.is_active ? "Activo" : "Inactivo"}
                  </span>
                </label>
              </div>
            </div>

            {formError ? (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
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
  );
}
