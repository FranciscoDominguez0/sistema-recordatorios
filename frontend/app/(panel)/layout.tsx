"use client";

import { useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopbar from "@/components/layout/AppTopbar";
import AuthGuard from "@/components/auth/AuthGuard";
import { ToastProvider } from "@/components/ui/toast";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <ToastProvider>
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-black dark:text-[#F1F5F9]">
          <div className="min-h-screen lg:pl-72 xl:pl-80">
            <AppSidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

            <div className="min-w-0 flex-1">
              <div className="sticky top-0 z-30">
                <AppTopbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
              </div>
              <main className="mx-auto w-full max-w-[1600px] p-6 2xl:max-w-[1800px] 2xl:p-8">
                <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-6 shadow-2xl shadow-black/5 dark:border-neutral-900 dark:bg-[#080808] dark:shadow-black/20">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
