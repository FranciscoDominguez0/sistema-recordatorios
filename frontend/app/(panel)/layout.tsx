"use client";

import { useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopbar from "@/components/layout/AppTopbar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#050B16] dark:text-[#F1F5F9]">
        <div className="min-h-screen lg:pl-72">
          <AppSidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

          <div className="min-w-0 flex-1">
            <div className="sticky top-0 z-30">
              <AppTopbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
            </div>
            <main className="mx-auto w-full max-w-[1400px] p-6">
              <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-6 shadow-2xl shadow-black/5 dark:border-[#1F2A44] dark:bg-[#0B1424] dark:shadow-black/20">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
