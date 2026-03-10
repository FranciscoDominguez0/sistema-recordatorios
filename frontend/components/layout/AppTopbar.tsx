"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { BellRing, LogOut, Moon, Radar, Sun } from "lucide-react";

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
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#08112F]/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <div>
          <p className="text-sm text-[#CCD4DE]">Bienvenido</p>
          <h2 className="text-lg font-semibold tracking-tight text-[#ECEEF0]">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            aria-label="Centro de alertas"
          >
            <Radar className="h-4 w-4 text-[#ECEEF0]" />
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            aria-label="Notificaciones"
          >
            <BellRing className="h-4 w-4 text-[#ECEEF0]" />
          </button>

          <button
            type="button"
            onClick={toggleDark}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            aria-label="Cambiar modo oscuro"
          >
            {isDark ? <Sun className="h-4 w-4 text-[#ECEEF0]" /> : <Moon className="h-4 w-4 text-[#ECEEF0]" />}
          </button>

          <Button variant="secondary" onClick={onLogout} className="rounded-xl">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        isDark={isDark}
      />
    </header>
  );
}
