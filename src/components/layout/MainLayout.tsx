import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Outlet } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { LoadingSpinner, ErrorState } from "@/components/common";

export function MainLayout() {
  const { isLoading, error, refreshTenants } = useTenant();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Carregando estabelecimentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <ErrorState
          title="Erro ao carregar estabelecimentos"
          description={error}
          onRetry={refreshTenants}
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-3 lg:px-6">
            <SidebarTrigger className="h-10 w-10" aria-label="Menu" />
            <div className="h-6 w-px bg-border md:hidden" />
            <span className="text-sm font-medium text-muted-foreground truncate md:hidden">MAVI</span>
          </header>
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
