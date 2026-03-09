import { Mail, Timer, Users, CheckSquare2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: any }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#3E53A0]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-zinc-900">{value}</div>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Servicios Próximos" value="0" subtitle="Próximos 7 días" icon={Timer} />
        <StatCard title="Tareas Pendientes" value="0" subtitle="Asignadas a ti" icon={CheckSquare2} />
        <StatCard title="Total Clientes" value="0" subtitle="Registrados" icon={Users} />
        <StatCard title="Correos Hoy" value="0" subtitle="Enviados" icon={Mail} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Servicios Próximos a Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-6 text-sm text-zinc-600">
              No hay servicios próximos a vencer
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tus Tareas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-6 text-sm text-zinc-600">
              No tienes tareas pendientes
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
