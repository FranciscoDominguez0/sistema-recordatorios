"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { BellRing, LogOut, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import NotificationsPanel from "@/components/layout/NotificationsPanel";

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

export default function AppTopbar() {
  const pathname = usePathname();
  const title = useMemo(() => titleFromPath(pathname ?? "/dashboard"), [pathname]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const nextIsDark = saved ? saved === "dark" : false;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.classList.toggle("light", !nextIsDark);
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

  return (
    <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/80 backdrop-blur dark:border-[#1F2A44] dark:bg-[#0B1424]/80">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <div>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Bienvenido</p>
          <h2 className="text-lg font-semibold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white transition-colors hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:hover:bg-[#162844]"
            aria-label="Notificaciones"
          >
            <BellRing className="h-4 w-4 text-[#0F172A] dark:text-[#F1F5F9]" />
          </button>

          <button
            type="button"
            onClick={toggleDark}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white transition-colors hover:bg-[#F8FAFC] dark:border-[#1F2A44] dark:bg-[#111E35] dark:hover:bg-[#162844]"
            aria-label="Cambiar modo oscuro"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-[#0F172A] dark:text-[#F1F5F9]" />
            ) : (
              <Moon className="h-4 w-4 text-[#0F172A] dark:text-[#F1F5F9]" />
            )}
          </button>

          <Button variant="secondary" onClick={onLogout} className="rounded-xl">
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
