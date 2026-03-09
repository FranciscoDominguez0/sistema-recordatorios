import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-neutral-200 bg-neutral-950 lg:block dark:border-neutral-800">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.18),transparent_45%)]" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div>
              <p className="text-sm font-medium tracking-wide text-white/80">Vigitec Panamá</p>
            </div>

            <div className="max-w-lg">
              <h1 className="text-4xl font-semibold tracking-tight text-white">
                Vigitec Panamá
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/80">
                Sistema inteligente de gestión de recordatorios, clientes y servicios.
              </p>

              <div className="mt-10 flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <p className="text-sm text-white/70">
                  Seguridad por token y auditoría de actividad integrada.
                </p>
              </div>
            </div>

            <div className="text-xs text-white/60">
              Plataforma SaaS moderna
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-6 py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.10),transparent_45%)]" />
          <div className="relative w-full max-w-md">
            <LoginForm companyName="Vigitec Panamá" initials="VP" />
          </div>
        </section>
      </div>
    </div>
  );
}
