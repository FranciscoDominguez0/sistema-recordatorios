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
  const adminCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);
  const staffCount = useMemo(() => users.filter((u) => u.role === "staff").length, [users]);

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
    <div className="space-y-6 text-[#ECEEF0]">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#ECEEF0]">Usuarios</h1>
            <p className="mt-1 text-sm text-[#CCD4DE]">Gestiona los usuarios que acceden al sistema.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email"
              className="h-11 border-white/10 bg-[#323954] text-[#ECEEF0] placeholder:text-[#CCD4DE]/60 focus-visible:ring-[#5A77DF]/40 focus-visible:border-[#5A77DF]/60 sm:w-[260px]"
            />
            <Button variant="secondary" onClick={() => fetchUsers(search)} className="w-full sm:w-auto">
              Buscar
            </Button>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#08112F]/70 p-4 shadow-sm shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-[#CCD4DE]">Total</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#323954] text-[#ECEEF0] shadow-sm">
                <User2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#ECEEF0]">{users.length}</p>
            <p className="mt-1 text-xs text-[#CCD4DE]/75">Usuarios registrados</p>
          </div>

          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 shadow-sm shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-emerald-200/80">Activos</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/25 bg-white/10 text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-100">{activeCount}</p>
            <p className="mt-1 text-xs text-emerald-200/80">Con acceso habilitado</p>
          </div>

          <div className="rounded-2xl border border-[#5A77DF]/30 bg-[#3E53A0]/25 p-4 shadow-sm shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-[#ECEEF0]/80">Admins</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#ECEEF0]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#ECEEF0]">{adminCount}</p>
            <p className="mt-1 text-xs text-[#CCD4DE]/80">Permisos elevados</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#08112F]/70 p-4 shadow-sm shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-[#CCD4DE]">Empleados</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#323954] text-[#ECEEF0] shadow-sm">
                <User2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#ECEEF0]">{staffCount}</p>
            <p className="mt-1 text-xs text-[#CCD4DE]/75">Rol staff</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-base text-[#ECEEF0]">Listado</CardTitle>
          <CardDescription className="text-[#CCD4DE]">Usuarios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#CCD4DE]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando usuarios...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#323954]/40 p-6 text-sm text-[#CCD4DE]">
              No hay usuarios registrados.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#08112F]/70 shadow-sm shadow-black/20">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#08112F]/90 text-xs text-[#CCD4DE] backdrop-blur">
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 font-semibold">Nombre</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Rol</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((u, idx) => (
                      <tr
                        key={u.id}
                        className={cn(
                          "group transition-colors hover:bg-white/[0.04]",
                          idx % 2 === 1 ? "bg-[#323954]/35" : "bg-transparent"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#323954] text-[#ECEEF0] shadow-sm">
                              <User2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#ECEEF0]">{u.name}</p>
                              <p className="truncate text-xs text-[#CCD4DE]/75">ID {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#CCD4DE]">
                          <span className="font-medium text-[#ECEEF0]">{u.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                              u.role === "admin"
                                ? "border-[#5A77DF]/30 bg-[#3E53A0]/25 text-[#ECEEF0]"
                                : "border-white/15 bg-white/10 text-[#CCD4DE]"
                            )}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {roleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-[#CCD4DE]">
                              <XCircle className="h-3.5 w-3.5" />
                              Inactivo
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
                              className="rounded-xl border border-transparent text-[#ECEEF0] group-hover:border-white/10 group-hover:bg-white/5"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(u)}
                              aria-label="Eliminar"
                              className="rounded-xl border border-transparent text-red-200 hover:bg-red-500/10"
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
            </div>
          )}
        </CardContent>
      </Card>

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
            "fixed right-0 top-0 z-50 flex h-dvh w-[92vw] max-w-[520px] flex-col border-l border-white/10 bg-[#08112F] text-[#ECEEF0] shadow-2xl shadow-black/30 transition-transform",
            drawerOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label={drawerMode === "create" ? "Crear usuario" : "Editar usuario"}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
            <div>
              <p className="text-sm font-semibold">{drawerMode === "create" ? "Nuevo usuario" : "Editar usuario"}</p>
              <p className="mt-1 text-xs text-[#CCD4DE]">
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
                  className="border-white/10 bg-[#323954] text-[#ECEEF0] placeholder:text-[#CCD4DE]/60 focus-visible:ring-[#5A77DF]/40 focus-visible:border-[#5A77DF]/60"
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
                  className="border-white/10 bg-[#323954] text-[#ECEEF0] placeholder:text-[#CCD4DE]/60 focus-visible:ring-[#5A77DF]/40 focus-visible:border-[#5A77DF]/60"
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
                  className="border-white/10 bg-[#323954] text-[#ECEEF0] placeholder:text-[#CCD4DE]/60 focus-visible:ring-[#5A77DF]/40 focus-visible:border-[#5A77DF]/60"
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
                  className="border-white/10 bg-[#323954] text-[#ECEEF0] placeholder:text-[#CCD4DE]/60 focus-visible:ring-[#5A77DF]/40 focus-visible:border-[#5A77DF]/60"
                />
              </div>

              <div className="sm:col-span-1">
                <Label htmlFor="role">Rol *</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#323954] px-3 text-sm text-[#ECEEF0] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#5A77DF]/40 focus-visible:border-[#5A77DF]/60"
                >
                  <option value="staff">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <Label>Usuario activo</Label>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20"
                  />
                  <span className="text-[#ECEEF0]">
                    {form.is_active ? "Activo" : "Inactivo"}
                  </span>
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
  );
}
