"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      const safePath = pathname ?? "/";
      window.location.href = `/login?next=${encodeURIComponent(safePath)}`;
    }
  }, [pathname]);

  return <>{children}</>;
}
