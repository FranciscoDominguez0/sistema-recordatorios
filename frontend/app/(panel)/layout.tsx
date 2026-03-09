import AppSidebar from "@/components/layout/AppSidebar";
import AppTopbar from "@/components/layout/AppTopbar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#ECEEF0]">
        <div className="flex">
          <AppSidebar />

          <div className="min-w-0 flex-1">
            <AppTopbar />
            <main className="mx-auto w-full max-w-[1400px] p-6">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
