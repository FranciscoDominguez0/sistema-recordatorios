"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Loader2, Pencil, Plus, Trash2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  createClient,
  deleteClient,
  getClientsPaginated,
  updateClient,
  type ClientItem
} from "@/services/clientsService";

type DrawerMode = "create" | "edit";

type FormState = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  notes: ""
};

export default function ClientesPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [withEmail, setWithEmail] = useState(0);
  const [withPhone, setWithPhone] = useState(0);
  const [withNotes, setWithNotes] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<ClientItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async ({ nextSearch, nextPage }: { nextSearch?: string; nextPage?: number } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const finalSearch = nextSearch ?? search;
      const finalPage = nextPage ?? page;

      const result = await getClientsPaginated({
        page: finalPage,
        limit,
        search: finalSearch
      });

      setClients(result.data);
      setTotalClients(result.pagination.total ?? 0);
      setTotalPages(result.pagination.total_pages ?? 1);
      setPage(result.pagination.page ?? finalPage);

      setWithEmail(Number(result.summary?.with_email ?? 0));
      setWithPhone(Number(result.summary?.with_phone ?? 0));
      setWithNotes(Number(result.summary?.with_notes ?? 0));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = (searchParams?.get("search") ?? "").toString();
    setSearch(q);
    setPage(1);
    fetchClients({ nextSearch: q, nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openCreate = () => {
    setDrawerMode("create");
    setEditingClient(null);
    setForm(initialForm);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (client: ClientItem) => {
    setDrawerMode("edit");
    setEditingClient(client);
    setForm({
      name: client.name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      notes: client.notes ?? ""
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const validate = () => {
    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim();

    if (!normalizedName) return "Nombre requerido";
    if (!normalizedEmail) return "Email requerido";

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
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined
      };

      if (drawerMode === "create") {
        await createClient(payload);
      } else {
        if (!editingClient) throw new Error("Cliente no seleccionado");
        await updateClient(editingClient.id, payload);
      }

      toast({
        title: drawerMode === "create" ? "Cliente creado" : "Cliente actualizado",
        variant: "success"
      });

      setDrawerOpen(false);
      await fetchClients({ nextPage: page });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo guardar cliente";
      setFormError(message);
      toast({ title: "Error", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (client: ClientItem) => {
    setDeletingClient(client);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteClient(deletingClient.id);
      toast({ title: "Cliente eliminado", variant: "success" });
      setDeleteOpen(false);
      setDeletingClient(null);
      await fetchClients({ nextPage: page });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo eliminar cliente";
      setError(message);
      toast({ title: "Error", description: message, variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const emailRate = useMemo(() => {
    if (!totalClients) return 0;
    return Math.round((withEmail / totalClients) * 100);
  }, [withEmail, totalClients]);

  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar cliente"
        description={deletingClient ? `¿Seguro que deseas eliminar el cliente ${deletingClient.name}?` : ""}
        confirmText={deleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        loading={deleting}
        variant="danger"
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (deleting) return;
          setDeleteOpen(open);
          if (!open) setDeletingClient(null);
        }}
      />
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Clientes</h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">Gestiona tus clientes registrados.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total", value: totalClients, sub: "Registrados", Icon: BriefcaseBusiness },
            { label: "Con email", value: withEmail, sub: `${emailRate}% del total`, Icon: CheckCircle2 },
            { label: "Con teléfono", value: withPhone, sub: "Contactables", Icon: BriefcaseBusiness },
            { label: "Con notas", value: withNotes, sub: "Info adicional", Icon: CheckCircle2 },
          ].map(({ label, value, sub, Icon }) => (
            <div key={label} className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1F2A44] dark:bg-[#0B1424]">
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: "#3B82F6", filter: "blur(16px)" }} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{value}</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">{sub}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#3B82F618", border: "1px solid #3B82F630" }}>
                  <Icon className="h-5 w-5" style={{ color: "#3B82F6" }} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-full opacity-60" style={{ background: "linear-gradient(to right, #3B82F6, transparent)" }} />
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Listado</CardTitle>
          <CardDescription className="text-[#64748B] dark:text-[#94A3B8]">Clientes registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando clientes...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6 text-sm text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]">
              No hay clientes registrados.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm shadow-black/5 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/20">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white text-xs text-[#64748B] backdrop-blur dark:bg-[#0B1424]/95 dark:text-[#94A3B8]">
                    <tr className="border-b border-[#E2E8F0] dark:border-[#1F2A44]">
                      <th className="px-4 py-3 font-semibold">Nombre</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell">Email</th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell">Teléfono</th>
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1F2A44]">
                    {clients.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={cn(
                          "group transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#111E35]",
                          idx % 2 === 1 ? "bg-[#F8FAFC] dark:bg-[#111E35]" : "bg-transparent"
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{c.name}</p>
                          {c.notes ? <p className="truncate text-xs text-[#64748B] dark:text-[#94A3B8]">{c.notes}</p> : null}
                          {/* Email visible only on mobile (shown inline under name) */}
                          <p className="mt-0.5 truncate text-xs text-[#64748B] dark:text-[#94A3B8] sm:hidden">{c.email}</p>
                        </td>
                        <td className="hidden px-4 py-3 text-[#64748B] dark:text-[#94A3B8] sm:table-cell">
                          <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{c.email}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-[#64748B] dark:text-[#94A3B8] md:table-cell">{c.phone || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(c)}
                              aria-label="Editar"
                              className="rounded-xl border border-transparent text-[#0F172A] group-hover:border-[#E2E8F0] group-hover:bg-[#F8FAFC] dark:text-[#F1F5F9] dark:group-hover:border-[#1F2A44] dark:group-hover:bg-[#111E35]"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(c)}
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
                    onClick={() => fetchClients({ nextPage: Math.max(1, page - 1) })}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9"
                    disabled={loading || page >= totalPages}
                    onClick={() => fetchClients({ nextPage: Math.min(totalPages, page + 1) })}
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
            aria-label={drawerMode === "create" ? "Crear cliente" : "Editar cliente"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-5 dark:border-[#1F2A44]">
              <div>
                <p className="text-sm font-semibold">{drawerMode === "create" ? "Nuevo cliente" : "Editar cliente"}</p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {drawerMode === "create"
                    ? "Completa los datos para crear un cliente."
                    : "Actualiza los datos del cliente."}
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

                <div className="sm:col-span-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+507 ..."
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input
                    id="notes"
                    placeholder="Notas"
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    className="border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
                  />
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
