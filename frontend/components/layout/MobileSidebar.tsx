"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  Radar,
  Settings,
  ShieldCheck,
  Users,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/clientes", label: "Clientes", icon: BriefcaseBusiness },
  { href: "/servicios", label: "Servicios", icon: ShieldCheck },
  { href: "/tareas", label: "Tareas", icon: ClipboardList },
  { href: "/configuracion", label: "Configuración", icon: Settings },
  { href: "/auditorias", label: "Auditorías", icon: Activity }
] as const;

export default function MobileSidebar({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [profileName, setProfileName] = useState<string>("Perfil");
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        name?: unknown;
        email?: unknown;
        avatar_url?: unknown;
        avatarUrl?: unknown;
      };

      const name = typeof parsed?.name === "string" ? parsed.name : null;
      const email = typeof parsed?.email === "string" ? parsed.email : null;
      const urlCandidate =
        typeof parsed?.avatar_url === "string"
          ? parsed.avatar_url
          : typeof parsed?.avatarUrl === "string"
            ? parsed.avatarUrl
            : null;

      if (name) setProfileName(name);
      if (email) setProfileEmail(email);
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

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className={cn("lg:hidden", open ? "" : "pointer-events-none")}> 
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-[82vw] max-w-[320px] flex-col border-r border-white/10 bg-[#08112F] text-[#ECEEF0] shadow-2xl transition-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <Radar className="h-5 w-5 text-[#5A77DF]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Vigitec Alertas</p>
              <p className="truncate text-xs text-[#CCD4DE]/80">Panel administrativo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
            const active = (pathname ?? "") === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[#ECEEF0] text-[#08112F] shadow-sm"
                    : "text-[#CCD4DE] hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-[#3E53A0]" : "text-[#CCD4DE]/80")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10 text-xs font-semibold text-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={profileName} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{profileName}</p>
                <p className="truncate text-xs text-[#CCD4DE]/80">{profileEmail || "Acceso con token"}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
