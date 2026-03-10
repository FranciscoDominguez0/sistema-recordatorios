"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BellRing, LogOut, Menu, Moon, Search, SlidersHorizontal, Sun, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import NotificationsPanel from "@/components/layout/NotificationsPanel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function titleFromPath(pathname: string) {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/usuarios": "Usuarios",
    "/clientes": "Clientes",
    "/servicios": "Servicios",
    "/tareas": "Tareas",
    "/configuracion": "Configuración",
    "/auditoria": "Auditoría"
  };
  return map[pathname] ?? "Panel";
}

function searchPlaceholderFromPath(pathname: string) {
  const map: Record<string, string> = {
    "/usuarios": "Buscar por nombre o email",
    "/clientes": "Buscar por nombre o email",
    "/servicios": "Buscar por servicio o cliente"
  };
  return map[pathname] ?? "Buscar";
}

export default function AppTopbar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const pathname = usePathname();
  const title = useMemo(() => titleFromPath(pathname ?? "/dashboard"), [pathname]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const placeholder = useMemo(
    () => searchPlaceholderFromPath(pathname ?? "/dashboard"),
    [pathname]
  );

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [servicesStatus, setServicesStatus] = useState<string>("");
  const debounceRef = useRef<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const nextIsDark = saved ? saved === "dark" : false;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.classList.toggle("light", !nextIsDark);
  }, []);

  useEffect(() => {
    const q = (searchParams?.get("search") ?? "").toString();
    setGlobalSearch(q);

    const st = (searchParams?.get("status") ?? "").toString();
    setServicesStatus(st);
  }, [searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) setAdvancedOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      document.documentElement.classList.toggle("light", !next);
      return next;
    });
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const applySearchToUrl = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const trimmed = value.trim();
    if (trimmed) params.set("search", trimmed);
    else params.delete("search");

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`);
  };

  const applyStatusToUrl = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const trimmed = value.trim();
    if (trimmed) params.set("status", trimmed);
    else params.delete("status");

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`);
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const current = (searchParams?.get("search") ?? "").toString();
      if (current !== globalSearch.trim()) applySearchToUrl(globalSearch);
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch, pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-[#F8FAFC]/80 backdrop-blur dark:border-[#1F2A44] dark:bg-[#0B1424]/80">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onOpenSidebar?.()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] transition-colors hover:bg-[#DBEAFE] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:hover:bg-[#162844] lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">{title}</h2>
        </div>

        <div className="hidden min-w-0 flex-1 items-center sm:flex">
          <div className="relative w-full max-w-[460px]" ref={popoverRef}>
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Search className="h-4 w-4 text-[#64748B] dark:text-[#94A3B8]" />
            </div>
            <div className="absolute -inset-[1px] rounded-full bg-[linear-gradient(90deg,rgba(59,130,246,0.32),rgba(16,185,129,0.16),rgba(245,158,11,0.12))] opacity-70 blur-[8px]" />
            <Input
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
              }}
              placeholder={placeholder}
              className="relative h-10 w-full rounded-full border-[#E2E8F0] bg-white/95 pl-10 pr-20 text-sm text-[#0F172A] placeholder:text-[#64748B] shadow-sm shadow-black/5 backdrop-blur focus-visible:ring-[#4F46E5]/15 focus-visible:border-[#4F46E5]/35 dark:border-[#1F2A44] dark:bg-[#111E35]/80 dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:shadow-black/20 dark:focus-visible:ring-[#3B82F6]/40 dark:focus-visible:border-[#3B82F6]/60"
            />

            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
              {globalSearch.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearch("");
                    applySearchToUrl("");
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E8F0] bg-white/70 text-[#64748B] transition-colors hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8] dark:hover:bg-[#162844]"
                  aria-label="Limpiar búsqueda"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E8F0] bg-white/70 text-[#0F172A] transition-colors hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:hover:bg-[#162844]"
                aria-label="Búsqueda avanzada"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {advancedOpen ? (
              <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-xl shadow-black/10 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/30">
                <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Búsqueda avanzada</p>

                {pathname === "/servicios" ? (
                  <div className="mt-3">
                    <Label className="text-xs text-[#64748B] dark:text-[#94A3B8]">Estado</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        { key: "", label: "Todos" },
                        { key: "activo", label: "Activo" },
                        { key: "vencido", label: "Vencido" },
                        { key: "completado", label: "Completado" }
                      ].map((opt) => (
                        <button
                          key={opt.key || "all"}
                          type="button"
                          onClick={() => {
                            setServicesStatus(opt.key);
                            applyStatusToUrl(opt.key);
                          }}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                            (servicesStatus || "") === opt.key
                              ? "border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#0F172A] dark:text-[#F1F5F9]"
                              : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#94A3B8] dark:hover:bg-[#162844]"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[#64748B] dark:text-[#94A3B8]">Sin filtros adicionales en este módulo.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] transition-colors hover:bg-[#DBEAFE] dark:border-[#1F2A44] dark:bg-[#111E35] dark:hover:bg-[#162844]"
            aria-label="Notificaciones"
          >
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#3B82F6]" />
            <BellRing className="h-4 w-4 text-[#2563EB] dark:text-[#F1F5F9]" />
          </button>

          <button
            type="button"
            onClick={toggleDark}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] transition-colors hover:bg-[#DBEAFE] dark:border-[#1F2A44] dark:bg-[#111E35] dark:hover:bg-[#162844]"
            aria-label="Cambiar modo oscuro"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-[#0F172A] dark:text-[#F1F5F9]" />
            ) : (
              <Moon className="h-4 w-4 text-[#2563EB] dark:text-[#F1F5F9]" />
            )}
          </button>

          <Button
            variant="secondary"
            onClick={onLogout}
            className="rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm shadow-black/5 hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:text-[#F1F5F9] dark:hover:bg-[#162844]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      {notificationsOpen ? (
        <NotificationsPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          isDark={isDark}
        />
      ) : null}
    </header>
  );
}
