"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  Users,
  BriefcaseBusiness,
  Camera
} from "lucide-react";

import { cn } from "@/lib/utils";
import { uploadAvatar } from "@/services/usersService";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/usuarios", label: "Administradores", icon: Users },
  { href: "/clientes", label: "Clientes", icon: BriefcaseBusiness },
  { href: "/servicios", label: "Servicios", icon: ShieldCheck },
  { href: "/tareas", label: "Tareas", icon: ClipboardList },
  { href: "/historial-correos", label: "Historial de Correos", icon: Mail },
  { href: "/configuracion", label: "Configuración", icon: Settings },
  { href: "/auditorias", label: "Auditorías", icon: Activity }
] as const;

type AppSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function AppSidebar(props: AppSidebarProps) {
  const { mobileOpen = false, onMobileClose } = props;
  const pathname = usePathname();
  const [profileName, setProfileName] = useState<string>("");
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        id?: unknown;
        name?: unknown;
        email?: unknown;
        avatar_url?: unknown;
        avatarUrl?: unknown;
      };

      const name = typeof parsed?.name === "string" ? parsed.name : null;
      const email = typeof parsed?.email === "string" ? parsed.email : null;
      const id = typeof parsed?.id === "number" ? parsed.id : null;
      const urlCandidate =
        typeof parsed?.avatar_url === "string"
          ? parsed.avatar_url
          : typeof parsed?.avatarUrl === "string"
            ? parsed.avatarUrl
            : null;

      if (name) setProfileName(name);
      if (email) setProfileEmail(email);
      if (id) setUserId(id);
      if (urlCandidate) setAvatarUrl(urlCandidate);
    } catch {
      // ignore
    }
  }, []);

  const initials = useMemo(() => {
    const parts = (profileName ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
    return `${first}${second ?? ""}`.toUpperCase();
  }, [profileName]);

  const hasProfile = Boolean(profileName || profileEmail);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !userId) return;

      if (!file.type.startsWith("image/")) return;
      if (file.size > 2 * 1024 * 1024) return; // max 2MB

      setUploading(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const updated = await uploadAvatar(userId, base64);
        const newAvatarUrl = updated.avatar_url || null;
        setAvatarUrl(newAvatarUrl);

        // Update localStorage
        const raw = localStorage.getItem("user");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            parsed.avatar_url = newAvatarUrl;
            localStorage.setItem("user", JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [userId]
  );

  /* ── Avatar circle (shared between desktop & mobile sidebars) ── */
  const avatarCircle = (
    <button
      type="button"
      onClick={handleAvatarClick}
      disabled={uploading}
      className="group/avatar relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#5A77DF]/40 bg-gradient-to-br from-[#5A77DF]/20 to-[#3E53A0]/30 text-lg font-bold text-white shadow-lg shadow-[#5A77DF]/10 transition-all hover:border-[#5A77DF]/70 hover:shadow-[#5A77DF]/25"
      title="Cambiar imagen de perfil"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={profileName} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}

      {/* Hover overlay with camera icon */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover/avatar:opacity-100">
        <Camera className="h-5 w-5 text-white" />
      </div>

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
    </button>
  );

  /* ── Hidden file input ── */
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleFileChange}
    />
  );

  return (
    <>
      {fileInput}

      {/* ━━━ Desktop sidebar ━━━ */}
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/10 bg-[#08112F] text-[#ECEEF0] lg:flex lg:flex-col xl:w-80">
        {/* ── User profile at top ── */}
        <div className="px-6 py-5">
          <div className="flex flex-col items-center gap-3">
            {avatarCircle}

            {hasProfile && (
              <div className="min-w-0 text-center">
                <p className="truncate text-sm font-semibold text-white">{profileName}</p>
                {profileEmail ? (
                  <p className="truncate text-xs text-[#CCD4DE]/80">{profileEmail}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-1 px-4 py-2">
          {nav.map((item) => {
            const active = (pathname ?? "") === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-[#CCD4DE] hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-[#5A77DF]" : "text-[#CCD4DE]/80")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Vigitec logo at bottom ── */}
        <div className="px-6 py-4">
          <div className="mb-3 h-px w-full bg-gradient-to-r from-transparent via-[#5A77DF]/30 to-transparent" />
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-2 rounded-xl bg-[#5A77DF]/5 blur-md" />
              <Image
                src="/brand/logo.png"
                alt="Vigitec"
                width={120}
                height={38}
                className="relative h-6 w-auto object-contain opacity-70 transition-opacity hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* ━━━ Mobile overlay ━━━ */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => onMobileClose?.()} />
      ) : null}

      {/* ━━━ Mobile sidebar ━━━ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#08112F] text-[#ECEEF0] transition-transform duration-200 lg:hidden flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── User profile at top ── */}
        <div className="px-6 py-5">
          <div className="flex flex-col items-center gap-3">
            {avatarCircle}

            {hasProfile && (
              <div className="min-w-0 text-center">
                <p className="truncate text-sm font-semibold text-white">{profileName}</p>
                {profileEmail ? (
                  <p className="truncate text-xs text-[#CCD4DE]/80">{profileEmail}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-1 px-4 py-2">
          {nav.map((item) => {
            const active = (pathname ?? "") === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onMobileClose?.()}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-[#CCD4DE] hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-[#5A77DF]" : "text-[#CCD4DE]/80")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Vigitec logo at bottom ── */}
        <div className="px-6 py-4">
          <div className="mb-3 h-px w-full bg-gradient-to-r from-transparent via-[#5A77DF]/30 to-transparent" />
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-2 rounded-xl bg-[#5A77DF]/5 blur-md" />
              <Image
                src="/brand/logo.png"
                alt="Vigitec"
                width={120}
                height={38}
                className="relative h-6 w-auto object-contain opacity-70 transition-opacity hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
