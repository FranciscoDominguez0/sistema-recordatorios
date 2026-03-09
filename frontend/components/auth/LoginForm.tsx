"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { login } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card className="w-full max-w-md border-white/5 bg-[#08112F]/45 text-[#ECEEF0] shadow-2xl shadow-black/40 backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 items-center rounded-2xl border border-[#323954] bg-[#08112F]/40 px-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.png"
                alt={`${companyName} logo`}
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const placeholder = target.parentElement?.querySelector<HTMLDivElement>("[data-logo-fallback]");
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
              <div
                data-logo-fallback
                style={{ display: "none" }}
                className="h-7 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#323954_0%,#3E53A0_55%,#5A77DF_100%)] px-3 text-sm font-semibold text-[#ECEEF0]"
              >
                {initials}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#ECEEF0]">{companyName}</p>
              <p className="text-xs text-[#CCD4DE]">Accede a tu panel de control</p>
            </div>
          </div>
        </div>

        <div>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>Accede a tu panel de control</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {error ? (
            <div className="rounded-2xl border border-[#5A77DF]/20 bg-black/30 p-4 text-[#ECEEF0] shadow-sm shadow-black/30 backdrop-blur transition">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-[#5A77DF]/12 p-2 text-[#CCD4DE]">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5">No se pudo iniciar sesión</p>
                  <p className="mt-1 text-sm text-[#CCD4DE]">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#CCD4DE]">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#CCD4DE]/70" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-[#323954] bg-[#08112F]/55 text-[#ECEEF0] placeholder:text-[#CCD4DE]/60 focus-visible:ring-[#5A77DF]/25 focus-visible:border-[#5A77DF]"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#CCD4DE]">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#CCD4DE]/70" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-11 border-[#323954] bg-[#08112F]/55 text-[#ECEEF0] placeholder:text-[#CCD4DE]/60 focus-visible:ring-[#5A77DF]/25 focus-visible:border-[#5A77DF]"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#CCD4DE]/70 transition-colors hover:bg-[#323954]/40 hover:text-[#ECEEF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A77DF]/25",
                  isLoading && "pointer-events-none opacity-60"
                )}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#5A77DF] text-white hover:bg-[#3E53A0] focus-visible:ring-[#5A77DF]/30"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
