import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030816]">
      {/* ── Dot grid across everything ── */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.04] [background-image:radial-gradient(rgba(90,119,223,0.6)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ━━━ Left panel — darker blue ━━━ */}
        <section className="relative hidden lg:flex lg:flex-col">
          {/* Left panel background */}
          <div className="absolute inset-0 bg-[#040A1A]" />

          {/* Fade right edge into the right panel color */}
          <div className="absolute inset-y-0 right-0 w-[280px] bg-gradient-to-r from-transparent to-[#0C1526]" />

          {/* Glow orbs */}
          <div className="absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-[#5A77DF]/[0.08] blur-[90px]" />
          <div className="absolute left-[30%] bottom-[15%] h-60 w-60 rounded-full bg-[#3E53A0]/[0.07] blur-[80px]" />

          {/* Fine grid — fades at right */}
          <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(90,119,223,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(90,119,223,0.5)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:linear-gradient(to_right,black_50%,transparent_100%)]" />

          <div className="relative z-10 flex flex-1 flex-col justify-between p-14 xl:p-20">
            {/* Top */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#5A77DF]/70">
                Panel interno
              </p>
            </div>

            {/* Center */}
            <div className="max-w-lg">
              <h1 className="text-[2.6rem] font-bold leading-[1.12] tracking-tight text-white xl:text-[3rem]">
                Todo tu equipo.
                <br />
                Todos tus servicios.
                <br />
                <span className="text-[#5A77DF]">Un solo lugar.</span>
              </h1>

              <div className="mt-8 h-px w-12 bg-[#5A77DF]/30" />

              <p className="mt-5 text-[15px] leading-relaxed text-[#566882]">
                Vencimientos, recordatorios y seguimiento de clientes.
                <br />
                Cada acción registrada, cada detalle bajo control.
              </p>
            </div>

            {/* Bottom */}
            <div className="flex items-center justify-between text-[11px] text-[#334155]">
              <span>Vigitec Panamá © 2026</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                En línea
              </span>
            </div>
          </div>
        </section>

        {/* ━━━ Right panel — slightly different tone ━━━ */}
        <section className="relative flex items-center justify-center px-6 py-12">
          {/* Right panel background */}
          <div className="absolute inset-0 bg-[#0C1526]" />

          {/* Fade left edge into the left panel color */}
          <div className="absolute inset-y-0 left-0 w-[280px] bg-gradient-to-l from-transparent to-[#040A1A]" />

          {/* Subtle glow */}
          <div className="absolute right-[15%] top-[20%] h-60 w-60 rounded-full bg-[#5A77DF]/[0.05] blur-[80px]" />

          <div className="relative z-10 w-full max-w-[400px]">
            {/* Logo */}
            <div className="mb-10 flex items-center justify-center lg:justify-start">
              <Image
                src="/brand/logo.png"
                alt="Vigitec"
                width={150}
                height={48}
                priority
                className="h-8 w-auto object-contain"
              />
            </div>

            <LoginForm />

            <p className="mt-8 text-center text-[11px] text-[#334155] lg:hidden">Vigitec Panamá © 2026</p>
          </div>
        </section>
      </div>
    </div>
  );
}
