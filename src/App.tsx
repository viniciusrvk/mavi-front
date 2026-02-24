import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary, LoadingSpinner } from "@/components/common";

// Lazy loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TenantsPage = lazy(() => import("./pages/TenantsPage"));
const ProfessionalsPage = lazy(() => import("./pages/ProfessionalsPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const BookingsPage = lazy(() => import("./pages/BookingsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure QueryClient with retry and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function PageLoader(): JSX.Element {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <TenantProvider>
            <Toaster />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tenants" element={<TenantsPage />} />
                    <Route path="/professionals" element={<ProfessionalsPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/bookings" element={<BookingsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TenantProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
