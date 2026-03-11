"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff, Lock, Loader2, Mail } from "lucide-react";

import { login } from "@/services/authService";
import { cn } from "@/lib/utils";

type Props = {
  companyName?: string;
  initials?: string;
};

export default function LoginForm({ companyName = "Vigitec Panamá", initials = "VP" }: Props) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const validate = () => {
    if (!email.trim()) return "Ingresa tu email";
    if (!email.includes("@")) return "Ingresa un email válido";
    if (!password) return "Ingresa tu contraseña";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Bienvenido de vuelta
        </h2>
        <p className="mt-2 text-sm text-[#64748B]">
          Ingresa con tu cuenta para continuar
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Error banner */}
          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 backdrop-blur-sm">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-red-300">Error de autenticación</p>
                <p className="mt-0.5 text-sm text-red-400/80">{error}</p>
              </div>
            </div>
          ) : null}

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-[#94A3B8]">
              Correo electrónico
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute left-0 top-0 flex h-full w-11 items-center justify-center">
                <Mail className="h-4 w-4 text-[#475569] transition-colors group-focus-within:text-[#5A77DF]" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-11 pr-4 text-sm text-white placeholder:text-[#475569] outline-none transition-all focus:border-[#5A77DF]/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#5A77DF]/15 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-[#94A3B8]">
              Contraseña
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute left-0 top-0 flex h-full w-11 items-center justify-center">
                <Lock className="h-4 w-4 text-[#475569] transition-colors group-focus-within:text-[#5A77DF]" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-11 pr-12 text-sm text-white placeholder:text-[#475569] outline-none transition-all focus:border-[#5A77DF]/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#5A77DF]/15 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-[#475569] transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A77DF]/25",
                  isLoading && "pointer-events-none opacity-50"
                )}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#5A77DF] to-[#3E53A0] text-sm font-semibold text-white shadow-lg shadow-[#5A77DF]/20 transition-all hover:shadow-[#5A77DF]/30 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A77DF]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030816] disabled:opacity-60 disabled:hover:brightness-100"
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

            <span className="relative flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar al panel"
              )}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.06]" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#334155]">Vigitec</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.06]" />
        </div>

        <p className="mt-4 text-center text-xs text-[#334155]">
          Solo para uso interno del equipo Vigitec
        </p>
      </div>
    </div>
  );
}
