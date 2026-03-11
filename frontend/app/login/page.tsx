import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030816]">
      {/* ── Background effects ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[20%] top-[-15%] h-[50rem] w-[50rem] rounded-full bg-[#5A77DF]/8 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute -right-[15%] bottom-[-10%] h-[45rem] w-[45rem] rounded-full bg-[#3E53A0]/10 blur-[100px] animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(rgba(90,119,223,0.5)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(90,119,223,0.10),transparent_70%)]" />
      </div>

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* ━━━ Left panel ━━━ */}
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-[#060E24] via-[#0A1332] to-[#0D1A42]" />

          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(90,119,223,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(90,119,223,0.4)_1px,transparent_1px)] [background-size:64px_64px]" />

          {/* Glow */}
          <div className="absolute -left-20 top-[15%] h-72 w-72 rounded-full bg-[#5A77DF]/12 blur-[80px]" />
          <div className="absolute -right-24 bottom-[20%] h-80 w-80 rounded-full bg-[#3E53A0]/15 blur-[100px]" />

          <div className="relative z-10 flex flex-1 flex-col justify-between p-14 xl:p-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5A77DF] shadow-md shadow-[#5A77DF]/20">
                <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-wide text-white/90">Vigitec Panamá</span>
            </div>

            {/* Main content */}
            <div>
              <h1 className="text-[2.5rem] font-bold leading-[1.15] tracking-tight text-white xl:text-[2.85rem]">
                Administra tus
                <br />
                servicios y clientes
                <br />
                <span className="text-[#5A77DF]">sin complicaciones.</span>
              </h1>

              <div className="mt-10 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5A77DF]" />
                  <p className="text-sm leading-relaxed text-[#7A8BA8]">
                    Seguimiento de vencimientos con avisos automáticos por correo electrónico.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5A77DF]" />
                  <p className="text-sm leading-relaxed text-[#7A8BA8]">
                    Historial de actividad para mantener trazabilidad de cada operación.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5A77DF]" />
                  <p className="text-sm leading-relaxed text-[#7A8BA8]">
                    Roles y permisos diferenciados para el equipo.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-xs text-[#3D4F6A]">Vigitec Panamá © 2026</p>
          </div>
        </section>

        {/* Divider */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 lg:block">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-[#5A77DF]/15 to-transparent" />
        </div>

        {/* ━━━ Right panel ━━━ */}
        <section className="relative flex items-center justify-center px-6 py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(90,119,223,0.05),transparent_55%)]" />

          <div className="relative w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5A77DF] shadow-lg shadow-[#5A77DF]/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">Vigitec Panamá</p>
            </div>

            <LoginForm companyName="Vigitec Panamá" initials="VP" />

            <p className="mt-8 text-center text-xs text-[#3D4F6A] lg:hidden">Vigitec Panamá © 2026</p>
          </div>
        </section>
      </div>
    </div>
  );
}
