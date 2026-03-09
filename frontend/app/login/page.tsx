import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#08112F]">
      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-44 -translate-x-1/2 lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,47,0)_0%,rgba(0,0,0,0.70)_38%,rgba(8,17,47,0.92)_52%,rgba(8,17,47,1)_100%)] opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(90,119,223,0.22),transparent_55%),radial-gradient(circle_at_60%_65%,rgba(62,83,160,0.18),transparent_60%)]" />
          <div className="absolute inset-0 backdrop-blur-2xl" />
        </div>

        <section className="relative hidden overflow-hidden border-r border-[#323954] bg-[#08112F] lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#08112F_0%,#0B1536_26%,#323954_52%,#3E53A0_78%,#5A77DF_100%)] opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(90,119,223,0.30),transparent_55%),radial-gradient(circle_at_70%_30%,rgba(62,83,160,0.26),transparent_60%),radial-gradient(circle_at_75%_78%,rgba(8,17,47,0.95),transparent_52%)]" />
          <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(236,238,240,0.18)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(204,212,222,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(204,212,222,0.14)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -left-32 top-[-10%] h-[24rem] w-[24rem] rounded-full bg-[#5A77DF]/14 blur-3xl" />
          <div className="absolute -right-40 bottom-[-12%] h-[26rem] w-[26rem] rounded-full bg-[#3E53A0]/18 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div>
              <p className="text-sm font-medium tracking-wide text-[#CCD4DE]">Vigitec Alertas</p>
            </div>

            <div className="max-w-lg">
              <h1 className="text-4xl font-semibold tracking-tight text-[#ECEEF0]">Vigitec Alertas</h1>
              <p className="mt-4 text-lg leading-relaxed text-[#CCD4DE]">
                Bienvenido a tu centro de alertas. Gestiona recordatorios, clientes y servicios desde un solo panel,
                con visibilidad clara y control total.
              </p>

              <div className="mt-10 flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#CCD4DE]" />
                <p className="text-sm text-[#CCD4DE]">Acceso con token y auditoría de actividad para trazabilidad y seguridad.</p>
              </div>
            </div>

            <div className="text-xs text-[#CCD4DE]/70">Vigitec Panamá</div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-6 py-12">
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(90,119,223,0.14),transparent_52%),radial-gradient(circle_at_85%_80%,rgba(62,83,160,0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_40%,rgba(8,17,47,0.95),rgba(0,0,0,1)_58%)]" />
          <div className="relative w-full max-w-md">
            <LoginForm companyName="Vigitec Panamá" initials="VP" />
          </div>
        </section>
      </div>
    </div>
  );
}
