"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, KeyRound, Loader2, Save, User2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { changeMyPassword, getMe, updateMe, uploadMyAvatar, type UserItem } from "@/services/usersService";

export default function PerfilPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [user, setUser] = useState<UserItem | null>(null);
  const [name, setName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = useMemo(() => {
    const raw = (name || user?.name || "").trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
    return `${first}${second ?? ""}`.toUpperCase();
  }, [name, user?.name]);

  const syncUserToStorage = useCallback((next: UserItem) => {
    const raw = localStorage.getItem("user");
    let parsed: any = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }
    }

    parsed.id = next.id;
    parsed.name = next.name;
    parsed.email = next.email;
    parsed.avatar_url = next.avatar_url ?? null;

    localStorage.setItem("user", JSON.stringify(parsed));
    window.dispatchEvent(new Event("profile:updated"));
  }, []);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me);
      setName(me.name ?? "");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar tu perfil";
      toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const onPickAvatar = () => fileInputRef.current?.click();

  const onChangeAvatar = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        if (!file.type.startsWith("image/")) {
          toast({ title: "Archivo inválido", description: "Selecciona una imagen", variant: "error", presentation: "confirm" });
          return;
        }

        if (file.size > 2 * 1024 * 1024) {
          toast({ title: "Imagen muy grande", description: "Máximo 2MB", variant: "error", presentation: "confirm" });
          return;
        }

        setSavingAvatar(true);

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const updated = await uploadMyAvatar(base64);
        setUser(updated);
        setName(updated.name ?? "");
        syncUserToStorage(updated);

        toast({ title: "Foto actualizada", variant: "success", presentation: "confirm" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "No se pudo actualizar la foto";
        toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
      } finally {
        setSavingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [syncUserToStorage, toast]
  );

  const onSaveProfile = useCallback(async () => {
    const normalized = name.trim();
    if (!normalized) {
      toast({ title: "Nombre requerido", variant: "error", presentation: "confirm" });
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateMe({ name: normalized });
      setUser(updated);
      setName(updated.name ?? "");
      syncUserToStorage(updated);
      toast({ title: "Perfil actualizado", variant: "success", presentation: "confirm" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo actualizar tu perfil";
      toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
    } finally {
      setSavingProfile(false);
    }
  }, [name, syncUserToStorage, toast]);

  const onSavePassword = useCallback(async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: "Completa los campos", variant: "error", presentation: "confirm" });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: "Contraseña débil", description: "Mínimo 8 caracteres", variant: "error", presentation: "confirm" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "No coincide", description: "Confirma tu nueva contraseña", variant: "error", presentation: "confirm" });
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({ title: "Contraseña actualizada", variant: "success", presentation: "confirm" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cambiar la contraseña";
      toast({ title: "Error", description: msg, variant: "error", presentation: "confirm" });
    } finally {
      setSavingPassword(false);
    }
  }, [confirmPassword, currentPassword, newPassword, toast]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-[#0F172A] dark:text-[#F1F5F9]">
        <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando perfil...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#0F172A] dark:text-[#F1F5F9]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Mi perfil</h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
            Administra tu información personal y la seguridad de tu cuenta.
          </p>
        </div>

        <Button
          onClick={fetchMe}
          variant="secondary"
          className="w-full rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm shadow-black/5 hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:hover:bg-[#162844] sm:w-auto"
        >
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              Foto de perfil
            </CardTitle>
            <CardDescription>Esta imagen se mostrará en el menú.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-lg font-bold text-[#0F172A] shadow-sm dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9]",
                  user?.avatar_url ? "" : ""
                )}
              >
                {user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt={user?.name ?? "Avatar"} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}

                <button
                  type="button"
                  onClick={onPickAvatar}
                  disabled={savingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                  aria-label="Cambiar foto"
                >
                  {savingAvatar ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.name ?? ""}</p>
                <p className="truncate text-xs text-[#64748B] dark:text-[#94A3B8]">{user?.email ?? ""}</p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={onPickAvatar} disabled={savingAvatar} className="w-full sm:w-auto">
                    {savingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    Cambiar foto
                  </Button>

                  <Button
                    onClick={onPickAvatar}
                    disabled={savingAvatar}
                    variant="secondary"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm shadow-black/5 hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:hover:bg-[#162844] sm:w-auto"
                  >
                    Elegir archivo
                  </Button>
                </div>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onChangeAvatar} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Datos personales
            </CardTitle>
            <CardDescription>Actualiza tu nombre. El email no se puede cambiar aquí.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>

              <div className="sm:col-span-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled className="mt-1" />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={onSaveProfile} disabled={savingProfile} className="w-full sm:w-auto">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Seguridad
          </CardTitle>
          <CardDescription>Cambia tu contraseña. Recomendado usar una contraseña fuerte.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Contraseña actual</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Nueva contraseña</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Confirmar nueva contraseña</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={onSavePassword} disabled={savingPassword} className="w-full sm:w-auto">
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Cambiar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
