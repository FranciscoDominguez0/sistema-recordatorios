"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
  X,
  XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  createEmailSetting,
  deleteEmailSetting,
  getAllEmailSettings,
  setDefaultEmailSetting,
  testEmailSetting,
  updateEmailSetting,
  type EmailSettingItem
} from "@/services/emailSettingsService";

import {
  createTemplate,
  deleteTemplate,
  getAllTemplates,
  updateTemplate,
  type EmailTemplateItem
} from "@/services/emailTemplatesService";

import {
  getCompanySettings,
  saveCompanySettings,
  type CompanySettings
} from "@/services/companyService";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
type Tab = "smtp" | "plantillas" | "empresa";

const inputCls =
  "border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6]/40 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60";

const TEMPLATE_DEFS = [
  { name: "cliente_recordatorio", label: "Recordatorio a cliente", desc: "Se envía al cliente cuando un servicio está por vencer." },
  { name: "admin_reminder",       label: "Aviso a administrador",  desc: "Notificación interna al admin cuando un servicio está por vencer." },
  { name: "interno_tarea",        label: "Tarea interna",          desc: "Notificaciones internas del equipo." }
];

// ─────────────────────────────────────────────────────────────────────────────
// Email HTML preview renderer
// ─────────────────────────────────────────────────────────────────────────────
function buildEmailHtml(opts: { logo: string; firma: string; companyName: string; subject: string; body: string }) {
  const { logo, firma, companyName, subject, body } = opts;
  const bodyHtml = body
    .replace(/\n/g, "<br/>")
    .replace(/\{\{cliente\}\}/g, "<strong>Cliente Ejemplo</strong>")
    .replace(/\{\{servicio\}\}/g, "<em>Servicio Premium</em>")
    .replace(/\{\{tarea\}\}/g, "<em>Cobrar a cliente Acme Corp</em>")
    .replace(/\{\{admin\}\}/g, "<strong>Administrador</strong>")
    .replace(/\{\{fecha_vencimiento\}\}/g, "<strong>31/03/2026</strong>")
    .replace(/\{\{logo_empresa\}\}/g, logo ? `<img src="${logo}" alt="Logo" style="max-height:50px"/>` : "")
    .replace(/\{\{firma_empresa\}\}/g, firma ? firma.replace(/\n/g, "<br/>") : "");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr><td style="background:linear-gradient(135deg,#08112F 0%,#1a2f6e 100%);padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>${logo ? `<img src="${logo}" alt="${companyName}" style="max-height:48px;max-width:200px;object-fit:contain;display:block;"/>` : `<span style="color:#fff;font-size:20px;font-weight:700;">${companyName || "Tu Empresa"}</span>`}</td>
        <td align="right"><span style="color:rgba(255,255,255,0.6);font-size:12px;">Notificación del sistema</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#3B82F6;padding:12px 32px;"><p style="margin:0;color:#fff;font-size:14px;font-weight:600;">${subject || "Asunto del correo"}</p></td></tr>
    <tr><td style="background:#ffffff;padding:36px 32px;"><div style="color:#1e293b;font-size:15px;line-height:1.7;">${bodyHtml}</div></td></tr>
    ${firma ? `<tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 32px;"><p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Firma</p><div style="color:#334155;font-size:13px;line-height:1.6;">${firma.replace(/\n/g, "<br/>")}</div></td></tr>` : ""}
    <tr><td style="background:#08112F;padding:16px 32px;"><p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-align:center;">Mensaje generado automáticamente · ${companyName || "Sistema de recordatorios"}</p></td></tr>
  </table></td></tr></table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("smtp");

  // ── SMTP ────────────────────────────────────────────────────────────────────
  const [smtpList, setSmtpList] = useState<EmailSettingItem[]>([]);
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpDrawerOpen, setSmtpDrawerOpen] = useState(false);
  const [editingSmtp, setEditingSmtp] = useState<EmailSettingItem | null>(null);
  const [smtpForm, setSmtpForm] = useState({ smtp_host: "", smtp_port: "587", smtp_email: "", smtp_password: "", encryption: "tls" as "tls" | "ssl" });
  const [smtpFormError, setSmtpFormError] = useState<string | null>(null);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smtpDeleteOpen, setSmtpDeleteOpen] = useState(false);
  const [deletingSmtp, setDeletingSmtp] = useState<EmailSettingItem | null>(null);
  const [deletingSmtpLoading, setDeletingSmtpLoading] = useState(false);

  const fetchSmtp = async () => {
    setSmtpLoading(true);
    try { setSmtpList(await getAllEmailSettings()); } catch { /* silent */ }
    finally { setSmtpLoading(false); }
  };
  useEffect(() => { fetchSmtp(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const openSmtpDrawer = (item?: EmailSettingItem) => {
    setEditingSmtp(item ?? null);
    setSmtpForm(item
      ? { smtp_host: item.smtp_host ?? "", smtp_port: String(item.smtp_port ?? 587), smtp_email: item.smtp_email ?? "", smtp_password: "", encryption: item.encryption ?? "tls" }
      : { smtp_host: "", smtp_port: "587", smtp_email: "", smtp_password: "", encryption: "tls" }
    );
    setSmtpFormError(null); setShowPassword(false); setSmtpDrawerOpen(true);
  };

  const onSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSmtpFormError(null);
    if (!smtpForm.smtp_host.trim()) return setSmtpFormError("Host SMTP requerido");
    if (!smtpForm.smtp_email.trim()) return setSmtpFormError("Email SMTP requerido");
    if (!editingSmtp && !smtpForm.smtp_password.trim()) return setSmtpFormError("Contraseña requerida");
    setSmtpSaving(true);
    try {
      const payload = { smtp_host: smtpForm.smtp_host.trim(), smtp_port: Number(smtpForm.smtp_port), smtp_email: smtpForm.smtp_email.trim(), smtp_password: smtpForm.smtp_password.trim(), encryption: smtpForm.encryption };
      editingSmtp ? await updateEmailSetting(editingSmtp.id, payload) : await createEmailSetting(payload);
      toast({ title: editingSmtp ? "SMTP actualizado" : "SMTP agregado", variant: "success" });
      setSmtpDrawerOpen(false); await fetchSmtp();
    } catch (e: unknown) { setSmtpFormError(e instanceof Error ? e.message : "Error al guardar"); }
    finally { setSmtpSaving(false); }
  };

  const confirmDeleteSmtp = async () => {
    if (!deletingSmtp) return;
    setDeletingSmtpLoading(true);
    try {
      await deleteEmailSetting(deletingSmtp.id);
      toast({ title: "Email SMTP eliminado", variant: "success" });
      setSmtpDeleteOpen(false); setDeletingSmtp(null); await fetchSmtp();
    } catch (e: unknown) { toast({ title: "Error", description: e instanceof Error ? e.message : "", variant: "error" }); }
    finally { setDeletingSmtpLoading(false); }
  };

  // ── PLANTILLAS ──────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selected, setSelected] = useState<EmailTemplateItem | null>(null);
  const [tplForm, setTplForm] = useState({ name: "", subject: "", body: "" });
  const [tplError, setTplError] = useState<string | null>(null);
  const [tplSaving, setTplSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ templateKey: "cliente_recordatorio", name: "cliente_recordatorio", subject: "", body: "" });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTpl, setDeletingTpl] = useState<EmailTemplateItem | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // company settings — para preview de plantillas
  const [companyCached, setCompanyCached] = useState<CompanySettings | null>(null);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const result = await getAllTemplates();
      setTemplates(result);
      if (!selected && result.length > 0) { setSelected(result[0]); setTplForm({ name: result[0].name, subject: result[0].subject, body: result[0].body }); }
    } catch { /* silent */ }
    finally { setTemplatesLoading(false); }
  };

  useEffect(() => { if (tab === "plantillas") { fetchTemplates(); getCompanySettings().then(setCompanyCached).catch(() => {}); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  const selectTemplate = (t: EmailTemplateItem) => { setSelected(t); setTplForm({ name: t.name, subject: t.subject, body: t.body }); setTplError(null); setPreviewMode(false); };

  const onSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return;
    if (!tplForm.subject.trim()) return setTplError("El asunto es requerido");
    if (!tplForm.body.trim()) return setTplError("El cuerpo es requerido");
    setTplSaving(true);
    try { await updateTemplate(selected.id, tplForm); toast({ title: "Plantilla guardada", variant: "success" }); await fetchTemplates(); }
    catch (e: unknown) { setTplError(e instanceof Error ? e.message : "Error al guardar"); }
    finally { setTplSaving(false); }
  };

  const onCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.subject.trim()) return setCreateError("El asunto es requerido");
    if (!createForm.body.trim()) return setCreateError("El cuerpo es requerido");
    setCreateSaving(true);
    try { await createTemplate({ name: createForm.name.trim(), subject: createForm.subject.trim(), body: createForm.body.trim() }); toast({ title: "Plantilla creada", variant: "success" }); setCreateDrawerOpen(false); await fetchTemplates(); }
    catch (e: unknown) { setCreateError(e instanceof Error ? e.message : "Error al crear"); }
    finally { setCreateSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deletingTpl) return;
    setDeletingLoading(true);
    try {
      await deleteTemplate(deletingTpl.id);
      toast({ title: "Plantilla eliminada", variant: "success" });
      if (selected?.id === deletingTpl.id) { setSelected(null); setTplForm({ name: "", subject: "", body: "" }); }
      setDeleteOpen(false); setDeletingTpl(null); await fetchTemplates();
    } catch (e: unknown) { toast({ title: "Error", description: e instanceof Error ? e.message : "", variant: "error" }); }
    finally { setDeletingLoading(false); }
  };

  const tplLabel = (name: string) => TEMPLATE_DEFS.find((t) => t.name === name)?.label ?? name;
  const tplDesc  = (name: string) => TEMPLATE_DEFS.find((t) => t.name === name)?.desc ?? "";

  const emailPreviewHtml = buildEmailHtml({
    logo: companyCached?.logo_base64 ?? "",
    firma: companyCached?.firma ?? "",
    companyName: companyCached?.company_name ?? "",
    subject: tplForm.subject,
    body: tplForm.body
  });

  // ── EMPRESA ─────────────────────────────────────────────────────────────────
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [companyData, setCompanyData] = useState<CompanySettings | null>(null);
  const [companyForm, setCompanyForm] = useState({ company_name: "", firma: "", logo_base64: "" });
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchCompany = async () => {
    setCompanyLoading(true);
    try {
      const data = await getCompanySettings();
      setCompanyData(data);
      setCompanyForm({ company_name: data.company_name ?? "", firma: data.firma ?? "", logo_base64: data.logo_base64 ?? "" });
    } catch { /* silent */ }
    finally { setCompanyLoading(false); }
  };

  useEffect(() => { if (tab === "empresa") fetchCompany(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) { toast({ title: "El logo no debe superar 512 KB", variant: "error" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setCompanyForm((p) => ({ ...p, logo_base64: (ev.target?.result as string) ?? "" })); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaving(true);
    try {
      await saveCompanySettings(companyForm);
      toast({ title: "Identidad de empresa guardada", variant: "success" });
      setCompanySaved(true); setTimeout(() => setCompanySaved(false), 2500);
      await fetchCompany();
    } catch (e: unknown) { toast({ title: "Error", description: e instanceof Error ? e.message : "", variant: "error" }); }
    finally { setCompanySaving(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">
      <ConfirmDialog open={deleteOpen} title="Eliminar plantilla" description={deletingTpl ? `¿Seguro que deseas eliminar "${tplLabel(deletingTpl.name)}"?` : ""} confirmText={deletingLoading ? "Eliminando..." : "Eliminar"} cancelText="Cancelar" loading={deletingLoading} variant="danger" onConfirm={confirmDelete} onOpenChange={(open) => { if (deletingLoading) return; setDeleteOpen(open); if (!open) setDeletingTpl(null); }} />

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">Gestiona la configuración del sistema.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-1 dark:border-[#1F2A44] dark:bg-[#111E35] sm:w-fit">
        {([
          { key: "smtp",      icon: <Mail className="h-4 w-4" />,      label: "SMTP" },
          { key: "plantillas",icon: <FileText className="h-4 w-4" />,  label: "Plantillas" },
          { key: "empresa",   icon: <Building2 className="h-4 w-4" />, label: "Empresa" }
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors", tab === t.key ? "bg-white text-[#0F172A] shadow-sm dark:bg-[#1F2A44] dark:text-[#F1F5F9]" : "text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F1F5F9]")}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB SMTP ══════════════ */}
      {tab === "smtp" && (
        <div className="space-y-5">
          <ConfirmDialog open={smtpDeleteOpen} title="Eliminar email SMTP" description={deletingSmtp ? `¿Seguro que deseas eliminar "${deletingSmtp.smtp_email}"?` : ""} confirmText={deletingSmtpLoading ? "Eliminando..." : "Eliminar"} cancelText="Cancelar" loading={deletingSmtpLoading} variant="danger" onConfirm={confirmDeleteSmtp} onOpenChange={(open) => { if (deletingSmtpLoading) return; setSmtpDeleteOpen(open); if (!open) setDeletingSmtp(null); }} />

          <div className="flex items-start gap-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-800 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            El sistema usa el email marcado como <strong>Principal</strong>. Puedes tener varios configurados.
          </div>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div><CardTitle className="text-base">Emails SMTP</CardTitle><CardDescription>Configura uno o más servidores de correo. Solo se usa el marcado como principal.</CardDescription></div>
              <Button onClick={() => openSmtpDrawer()} className="shrink-0"><Plus className="h-4 w-4" /> Agregar email</Button>
            </CardHeader>
            <CardContent>
              {smtpLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
              ) : smtpList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-10 text-sm text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]"><Mail className="mb-3 h-10 w-10 opacity-30" />No hay emails SMTP configurados.</div>
              ) : (
                <div className="space-y-3">
                  {smtpList.map((item) => (
                    <div key={item.id} className={cn("overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors dark:bg-[#0B1424]", item.is_default ? "border-[#3B82F6]/30 dark:border-[#3B82F6]/40" : "border-[#E2E8F0] dark:border-[#1F2A44]")}>
                      <div className="flex items-start gap-4 p-4">
                        {/* Icon */}
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", item.is_default ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 dark:border-[#3B82F6]/40 dark:bg-[#3B82F6]/15" : "border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35]")}>
                          <Mail className={cn("h-5 w-5", item.is_default ? "text-[#3B82F6]" : "text-[#64748B] dark:text-[#94A3B8]")} />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{item.smtp_email}</p>
                            {item.is_default && (
                              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-400/30 dark:text-amber-300">
                                <Star className="h-3 w-3" /> Principal
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[#64748B] dark:text-[#94A3B8]">{item.smtp_host}:{item.smtp_port} · {item.encryption?.toUpperCase()}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1">
                          {!item.is_default && (
                            <Button variant="secondary" size="icon" onClick={() => setDefaultEmailSetting(item.id).then(fetchSmtp)} className="h-8 w-8 rounded-xl" title="Marcar como principal">
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="secondary" size="icon" onClick={() => openSmtpDrawer(item)} className="h-8 w-8 rounded-xl" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeletingSmtp(item); setSmtpDeleteOpen(true); }} className="h-8 w-8 rounded-xl text-red-600 hover:bg-red-500/10 dark:text-red-400" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Test con el principal */}
                  {smtpList.some((s) => s.is_default) && (
                    <div className="flex justify-end">
                      <Button variant="secondary" onClick={async () => { setSmtpTesting(true); try { const r = await testEmailSetting(); toast({ title: r.message, variant: "success" }); } catch (e: unknown) { toast({ title: "Error", description: e instanceof Error ? e.message : "", variant: "error" }); } finally { setSmtpTesting(false); } }} disabled={smtpTesting}>
                        {smtpTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}Probar email principal
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════ TAB PLANTILLAS ══════════════ */}
      {tab === "plantillas" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[260px_1fr]">
          {/* Lista */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">Plantillas</p>
              <Button size="icon" onClick={() => { setCreateForm({ templateKey: "cliente_recordatorio", name: "cliente_recordatorio", subject: "", body: "" }); setCreateError(null); setCreateDrawerOpen(true); }} className="h-7 w-7 rounded-lg"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {templatesLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
            ) : templates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center text-xs text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]"><FileText className="mx-auto mb-2 h-6 w-6 opacity-40" />Sin plantillas.</div>
            ) : (
              <div className="space-y-1">
                {templates.map((t) => (
                  <button key={t.id} onClick={() => selectTemplate(t)} className={cn("group flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors", selected?.id === t.id ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 dark:border-[#3B82F6]/40 dark:bg-[#3B82F6]/15" : "border-transparent hover:border-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:border-[#1F2A44] dark:hover:bg-[#111E35]")}>
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#0F172A] dark:text-[#F1F5F9]">{tplLabel(t.name)}</p>
                      <p className="mt-0.5 truncate text-xs text-[#64748B] dark:text-[#94A3B8]">{tplDesc(t.name) || t.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* Aviso: logo/firma se toman de la tab Empresa */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 dark:border-[#1F2A44] dark:bg-[#111E35]">
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">El logo y la firma se configuran en la pestaña <strong className="text-[#0F172A] dark:text-[#F1F5F9]">Empresa</strong>.</p>
            </div>
          </div>

          {/* Editor */}
          <div>
            {!selected ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#64748B] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8]">
                <div className="text-center"><FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />Selecciona una plantilla para editarla.</div>
              </div>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div><CardTitle className="text-base">{tplLabel(selected.name)}</CardTitle><CardDescription>{tplDesc(selected.name) || selected.name}</CardDescription></div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" size="icon" onClick={() => setPreviewMode((p) => !p)} className="h-9 w-9 rounded-xl" title={previewMode ? "Editar" : "Vista previa"}>
                      {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setDeletingTpl(selected); setDeleteOpen(true); }} className="h-9 w-9 rounded-xl text-red-600 hover:bg-red-500/10 dark:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewMode ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 dark:border-[#1F2A44] dark:bg-[#111E35]">
                        <Mail className="h-4 w-4 shrink-0 text-[#64748B] dark:text-[#94A3B8]" />
                        <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Asunto:</span>
                        <span className="text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]">{tplForm.subject || "—"}</span>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm dark:border-[#1F2A44]">
                        <iframe srcDoc={emailPreviewHtml} className="h-[540px] w-full" title="Vista previa del correo" sandbox="allow-same-origin" />
                      </div>
                      <p className="text-center text-[10px] text-[#64748B] dark:text-[#94A3B8]">Vista previa con datos de ejemplo</p>
                    </div>
                  ) : (
                    <form onSubmit={onSaveTemplate} className="space-y-4">
                      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
                        <span className="font-semibold">Clientes:</span> <strong>{"{{cliente}}"}</strong> · <strong>{"{{servicio}}"}</strong> · <strong>{"{{fecha_vencimiento}}"}</strong><br/>
                        <span className="font-semibold">Tareas internas:</span> <strong>{"{{admin}}"}</strong> · <strong>{"{{tarea}}"}</strong> · <strong>{"{{fecha_vencimiento}}"}</strong>
                      </div>
                      <div><Label htmlFor="tpl-subject">Asunto</Label><Input id="tpl-subject" placeholder="Recordatorio de vencimiento - {{servicio}}" value={tplForm.subject} onChange={(e) => setTplForm((p) => ({ ...p, subject: e.target.value }))} className={inputCls} /></div>
                      <div>
                        <div className="mb-1 flex items-center justify-between"><Label htmlFor="tpl-body">Cuerpo del correo</Label><button type="button" onClick={() => setPreviewMode(true)} className="flex items-center gap-1 text-xs text-[#3B82F6] hover:underline"><Eye className="h-3 w-3" /> Vista previa</button></div>
                        <textarea id="tpl-body" rows={14} placeholder="Estimado {{cliente}},..." value={tplForm.body} onChange={(e) => setTplForm((p) => ({ ...p, body: e.target.value }))} className="mt-1 w-full resize-y rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 font-mono text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none transition focus:border-[#3B82F6]/40 focus:ring-2 focus:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8]" />
                      </div>
                      {tplError ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{tplError}</div> : null}
                      <div className="flex justify-end"><Button type="submit" disabled={tplSaving}>{tplSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Guardar plantilla</Button></div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB EMPRESA ══════════════ */}
      {tab === "empresa" && (
        <div className="max-w-xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identidad de empresa</CardTitle>
              <CardDescription>Logo, nombre y firma que aparecen en todos los correos enviados.</CardDescription>
            </CardHeader>
            <CardContent>
              {companyLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
              ) : (
                <form onSubmit={onSaveCompany} className="space-y-5">

                  {/* Logo */}
                  <div>
                    <Label className="mb-2 block text-sm">Logo de la empresa</Label>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    {companyForm.logo_base64 ? (
                      <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-[#3B82F6]/30 bg-[#3B82F6]/5 p-4 transition-colors dark:border-[#3B82F6]/40 dark:bg-[#3B82F6]/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={companyForm.logo_base64} alt="Logo" className="mx-auto max-h-20 w-auto object-contain" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <button type="button" onClick={() => logoInputRef.current?.click()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur hover:bg-white/30" title="Cambiar logo"><Upload className="h-4 w-4" /></button>
                          <button type="button" onClick={() => setCompanyForm((p) => ({ ...p, logo_base64: "" }))} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/80 text-white hover:bg-red-500" title="Quitar logo"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] py-8 text-[#64748B] transition-colors hover:border-[#3B82F6]/40 hover:bg-[#3B82F6]/5 hover:text-[#3B82F6] dark:border-[#1F2A44] dark:bg-[#111E35] dark:hover:border-[#3B82F6]/40">
                        <ImageIcon className="h-8 w-8 opacity-40" />
                        <span className="text-sm font-medium">Haz clic para subir el logo</span>
                        <span className="text-xs opacity-60">PNG, JPG, SVG · máx. 512 KB</span>
                      </button>
                    )}
                  </div>

                  {/* Nombre */}
                  <div>
                    <Label htmlFor="co-name">Nombre de la empresa</Label>
                    <Input id="co-name" placeholder="Ej: Vigitec Panamá S.A." value={companyForm.company_name} onChange={(e) => setCompanyForm((p) => ({ ...p, company_name: e.target.value }))} className={inputCls} />
                    <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Aparece en el encabezado y pie del correo cuando no hay logo.</p>
                  </div>

                  {/* Firma */}
                  <div>
                    <Label htmlFor="co-firma">Firma del correo</Label>
                    <textarea
                      id="co-firma"
                      rows={5}
                      placeholder={"Atentamente,\nFrancisco Domínguez\nGerente General\ncontacto@vigitec.com\n+507 000-0000"}
                      value={companyForm.firma}
                      onChange={(e) => setCompanyForm((p) => ({ ...p, firma: e.target.value }))}
                      className="mt-1 w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none transition focus:border-[#3B82F6]/40 focus:ring-2 focus:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8]"
                    />
                    <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Texto de firma que se muestra al final de cada correo enviado.</p>
                  </div>

                  {/* Preview mini */}
                  {(companyForm.logo_base64 || companyForm.company_name || companyForm.firma) && (
                    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#1F2A44]">
                      <div className="flex items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 dark:border-[#1F2A44] dark:bg-[#111E35]">
                        <Eye className="h-3.5 w-3.5 text-[#64748B] dark:text-[#94A3B8]" />
                        <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Vista previa del encabezado y firma</span>
                      </div>
                      <iframe
                        srcDoc={buildEmailHtml({ logo: companyForm.logo_base64, firma: companyForm.firma, companyName: companyForm.company_name, subject: "Ejemplo de correo", body: "Este es el contenido del correo..." })}
                        className="h-60 w-full"
                        title="Vista previa"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={companySaving}>
                      {companySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : companySaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {companySaved ? "¡Guardado!" : "Guardar identidad"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {companyData?.updated_at && (
            <p className="text-center text-xs text-[#94A3B8] dark:text-[#64748B]">
              Última actualización: {new Date(companyData.updated_at).toLocaleString("es-PA")}
            </p>
          )}
        </div>
      )}

      {/* ════════ DRAWER SMTP ════════ */}
      <div className={cn("fixed inset-0 z-40", smtpDrawerOpen ? "" : "pointer-events-none")}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", smtpDrawerOpen ? "opacity-100" : "opacity-0")} onClick={() => setSmtpDrawerOpen(false)} />
        <div className={cn("absolute inset-0 flex items-center justify-center p-4 transition-opacity", smtpDrawerOpen ? "opacity-100" : "opacity-0")}>
          <aside className={cn("relative z-50 flex w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#1F2A44] dark:bg-[#0B1424]", smtpDrawerOpen ? "scale-100" : "scale-95")} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-5 dark:border-[#1F2A44]">
              <div><p className="text-sm font-semibold">{editingSmtp ? "Editar SMTP" : "Nueva configuración SMTP"}</p><p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Configura tu servidor de correo saliente.</p></div>
              <Button variant="ghost" size="icon" onClick={() => setSmtpDrawerOpen(false)} className="rounded-xl"><XCircle className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={onSmtpSubmit} className="max-h-[calc(100dvh-12rem)] flex-1 overflow-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label htmlFor="smtp-host">Host SMTP</Label><Input id="smtp-host" placeholder="smtp.gmail.com" value={smtpForm.smtp_host} onChange={(e) => setSmtpForm((p) => ({ ...p, smtp_host: e.target.value }))} className={inputCls} /></div>
                <div><Label htmlFor="smtp-port">Puerto</Label><Input id="smtp-port" type="number" placeholder="587" value={smtpForm.smtp_port} onChange={(e) => setSmtpForm((p) => ({ ...p, smtp_port: e.target.value }))} className={inputCls} /></div>
                <div>
                  <Label htmlFor="smtp-enc">Cifrado</Label>
                  <select id="smtp-enc" value={smtpForm.encryption} onChange={(e) => setSmtpForm((p) => ({ ...p, encryption: e.target.value as "tls" | "ssl" }))} className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#3B82F6]/40 focus:ring-2 focus:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                    <option value="tls">TLS</option><option value="ssl">SSL</option>
                  </select>
                </div>
                <div className="sm:col-span-2"><Label htmlFor="smtp-email">Usuario / Email</Label><Input id="smtp-email" type="email" placeholder="tu@email.com" value={smtpForm.smtp_email} onChange={(e) => setSmtpForm((p) => ({ ...p, smtp_email: e.target.value }))} className={inputCls} /></div>
                <div className="sm:col-span-2">
                  <Label htmlFor="smtp-pass">Contraseña{editingSmtp ? " (vacío = sin cambio)" : ""}</Label>
                  <div className="relative">
                    <Input id="smtp-pass" type={showPassword ? "text" : "password"} placeholder="••••••••" value={smtpForm.smtp_password} onChange={(e) => setSmtpForm((p) => ({ ...p, smtp_password: e.target.value }))} className={cn(inputCls, "pr-10")} />
                    <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
              </div>
              {smtpFormError ? <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{smtpFormError}</div> : null}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setSmtpDrawerOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={smtpSaving}>{smtpSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Guardar configuración</Button>
              </div>
            </form>
          </aside>
        </div>
      </div>

      {/* ════════ DRAWER CREAR PLANTILLA ════════ */}
      <div className={cn("fixed inset-0 z-40", createDrawerOpen ? "" : "pointer-events-none")}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", createDrawerOpen ? "opacity-100" : "opacity-0")} onClick={() => setCreateDrawerOpen(false)} />
        <div className={cn("absolute inset-0 flex items-center justify-center p-4 transition-opacity", createDrawerOpen ? "opacity-100" : "opacity-0")}>
          <aside className={cn("relative z-50 flex w-full max-w-[600px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#1F2A44] dark:bg-[#0B1424]", createDrawerOpen ? "scale-100" : "scale-95")} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-5 dark:border-[#1F2A44]">
              <div><p className="text-sm font-semibold">Nueva plantilla</p><p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Elige el tipo y define el contenido.</p></div>
              <Button variant="ghost" size="icon" onClick={() => setCreateDrawerOpen(false)} className="rounded-xl"><XCircle className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={onCreateTemplate} className="max-h-[calc(100dvh-12rem)] flex-1 space-y-4 overflow-auto p-5">
              <div>
                <Label htmlFor="tpl-type">Tipo de plantilla</Label>
                <select id="tpl-type" value={createForm.templateKey} onChange={(e) => { const k = e.target.value; setCreateForm((p) => ({ ...p, templateKey: k, name: k })); }} className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#3B82F6]/40 focus:ring-2 focus:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]">
                  {TEMPLATE_DEFS.map((d) => <option key={d.name} value={d.name}>{d.label}</option>)}
                  <option value="personalizada">Personalizada</option>
                </select>
              </div>
              {createForm.templateKey === "personalizada" && (
                <div><Label htmlFor="tpl-custom-name">Nombre interno</Label><Input id="tpl-custom-name" placeholder="Ej: bienvenida_cliente" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
              )}
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
                <span className="font-semibold">Clientes:</span> <strong>{"{{cliente}}"}</strong> · <strong>{"{{servicio}}"}</strong> · <strong>{"{{fecha_vencimiento}}"}</strong><br/>
                <span className="font-semibold">Tareas internas:</span> <strong>{"{{admin}}"}</strong> · <strong>{"{{tarea}}"}</strong> · <strong>{"{{fecha_vencimiento}}"}</strong>
              </div>
              <div><Label htmlFor="tpl-new-subject">Asunto</Label><Input id="tpl-new-subject" placeholder="Asunto del correo" value={createForm.subject} onChange={(e) => setCreateForm((p) => ({ ...p, subject: e.target.value }))} className={inputCls} /></div>
              <div><Label htmlFor="tpl-new-body">Cuerpo del correo</Label><textarea id="tpl-new-body" rows={10} placeholder="Estimado {{cliente}},..." value={createForm.body} onChange={(e) => setCreateForm((p) => ({ ...p, body: e.target.value }))} className="mt-1 w-full resize-y rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 font-mono text-sm placeholder:text-[#64748B] outline-none transition focus:border-[#3B82F6]/40 focus:ring-2 focus:ring-[#3B82F6]/25 dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8]" /></div>
              {createError ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{createError}</div> : null}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setCreateDrawerOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createSaving}>{createSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Crear plantilla</Button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
