import AppSidebar from "@/components/layout/AppSidebar";
import AppTopbar from "@/components/layout/AppTopbar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#5A77DF]">
        <div className="flex">
          <AppSidebar />

          <div className="min-w-0 flex-1">
            <AppTopbar />
            <main className="mx-auto w-full max-w-[1400px] p-6">
              <div className="rounded-[32px] border border-white/10 bg-[#08112F]/95 p-6 text-[#ECEEF0] shadow-2xl shadow-black/20">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
