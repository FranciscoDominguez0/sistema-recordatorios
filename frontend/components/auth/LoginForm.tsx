"use client";

import * as React from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

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
      window.location.href = "/";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 items-center rounded-2xl border border-neutral-200 bg-white px-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
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
                className="h-7 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 px-3 text-sm font-semibold text-neutral-700 dark:from-neutral-900 dark:to-neutral-950 dark:text-neutral-200"
              >
                {initials}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{companyName}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Accede a tu panel de control</p>
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-11"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-100/10",
                  isLoading && "pointer-events-none opacity-60"
                )}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          <div className="flex items-center justify-between">
            <a
              href="#"
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
