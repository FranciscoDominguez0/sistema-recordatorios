"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Radar, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

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

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <div>
          <p className="text-sm text-zinc-500">Bienvenido</p>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white transition-colors hover:bg-zinc-50"
            aria-label="Centro de alertas"
          >
            <Radar className="h-4 w-4 text-zinc-700" />
          </button>

          <Button variant="secondary" onClick={onLogout} className="rounded-xl">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
