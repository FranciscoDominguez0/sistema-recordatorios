"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  BriefcaseBusiness
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/clientes", label: "Clientes", icon: BriefcaseBusiness },
  { href: "/servicios", label: "Servicios", icon: ShieldCheck },
  { href: "/tareas", label: "Tareas", icon: ClipboardList },
  { href: "/configuracion", label: "Configuración", icon: Settings },
  { href: "/auditoria", label: "Auditoría", icon: Activity }
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

  const hasProfile = Boolean(profileName || profileEmail);

  return (
    <>
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/10 bg-[#08112F] text-[#ECEEF0] lg:flex lg:flex-col xl:w-80">
        <div className="px-6 py-5">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Image
                src="/brand/logo.png"
                alt="Vigitec"
                width={200}
                height={64}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>

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

        <div className="px-4 py-4">
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
                {hasProfile ? (
                  <>
                    <p className="truncate text-xs font-semibold text-white">{profileName}</p>
                    {profileEmail ? <p className="truncate text-xs text-[#CCD4DE]/80">{profileEmail}</p> : null}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => onMobileClose?.()} />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#08112F] text-[#ECEEF0] transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-6 py-5">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Image
                src="/brand/logo.png"
                alt="Vigitec"
                width={200}
                height={64}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>

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
      </aside>
    </>
  );
}
