"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff, Lock, Loader2, Mail } from "lucide-react";

import { login } from "@/services/authService";
import { cn } from "@/lib/utils";

export default function LoginForm() {
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
    <div className="w-full">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-[1.65rem] font-bold tracking-tight text-white">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-sm text-[#556580]">
          Ingresa con tu cuenta para continuar
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Error */}
        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-300/90">{error}</p>
          </div>
        ) : null}

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-[13px] font-medium text-[#8694A9]">
            Correo electrónico
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute left-0 top-0 flex h-full w-11 items-center justify-center">
              <Mail className="h-[18px] w-[18px] text-[#3D4F6A] transition-colors group-focus-within:text-[#5A77DF]" />
            </div>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-11 pr-4 text-sm text-white placeholder:text-[#3D4F6A] outline-none transition-all focus:border-[#5A77DF]/30 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#5A77DF]/10 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="login-password" className="text-[13px] font-medium text-[#8694A9]">
            Contraseña
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute left-0 top-0 flex h-full w-11 items-center justify-center">
              <Lock className="h-[18px] w-[18px] text-[#3D4F6A] transition-colors group-focus-within:text-[#5A77DF]" />
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-11 pr-12 text-sm text-white placeholder:text-[#3D4F6A] outline-none transition-all focus:border-[#5A77DF]/30 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#5A77DF]/10 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-[#3D4F6A] transition-colors hover:bg-white/[0.06] hover:text-white/70",
                isLoading && "pointer-events-none opacity-50"
              )}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#5A77DF] text-sm font-semibold text-white shadow-lg shadow-[#5A77DF]/15 transition-all hover:bg-[#4D68CC] hover:shadow-[#5A77DF]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A77DF]/40 disabled:opacity-60"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />

          <span className="relative flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </span>
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-[11px] text-[#2D3D54]">
        Solo para uso interno del equipo Vigitec
      </p>
    </div>
  );
}
