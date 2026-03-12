"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const DEFAULT_IDLE_MINUTES = 30;

function safeParseJwt(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isJwtExpired(token: string) {
  const payload = safeParseJwt(token);
  const exp = payload?.exp;
  if (!exp || !Number.isFinite(Number(exp))) return false;
  return Date.now() >= Number(exp) * 1000;
}

function logoutToLogin(pathname: string | null) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  const safePath = pathname ?? "/";
  window.location.href = `/login?next=${encodeURIComponent(safePath)}`;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return logoutToLogin(pathname);
    if (isJwtExpired(token)) return logoutToLogin(pathname);

    const idleMinutesRaw = (process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES ?? "").trim();
    const idleMinutes = Number(idleMinutesRaw) > 0 ? Number(idleMinutesRaw) : DEFAULT_IDLE_MINUTES;
    const idleMs = idleMinutes * 60 * 1000;

    let lastActivity = Date.now();
    const bump = () => { lastActivity = Date.now(); };

    const interval = window.setInterval(() => {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        window.clearInterval(interval);
        return;
      }

      if (isJwtExpired(currentToken)) {
        window.clearInterval(interval);
        logoutToLogin(pathname);
        return;
      }

      if (Date.now() - lastActivity >= idleMs) {
        window.clearInterval(interval);
        logoutToLogin(pathname);
      }
    }, 10_000);

    window.addEventListener("mousemove", bump, { passive: true });
    window.addEventListener("keydown", bump);
    window.addEventListener("click", bump);
    window.addEventListener("scroll", bump, { passive: true });
    window.addEventListener("touchstart", bump, { passive: true });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("click", bump);
      window.removeEventListener("scroll", bump);
      window.removeEventListener("touchstart", bump);
    };
  }, [pathname]);

  return <>{children}</>;
}
