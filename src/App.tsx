import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary, LoadingSpinner } from "@/components/common";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { HOME_BY_ROLE } from "@/lib/permissions";

// Lazy loaded pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TenantsPage = lazy(() => import("./pages/TenantsPage"));
const ProfessionalsPage = lazy(() => import("./pages/ProfessionalsPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const BookingsPage = lazy(() => import("./pages/BookingsPage"));
const MyBookingsPage = lazy(() => import("./pages/MyBookingsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
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

// Redireciona para a home do role do usuário autenticado
function HomeRedirect(): JSX.Element {
  const { user } = useAuth();
  const destination = user ? HOME_BY_ROLE[user.role] : "/login";
  return <Navigate to={destination} replace />;
}

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <TooltipProvider>
            <AuthProvider>
              <TenantProvider>
              <Toaster />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Rotas públicas */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forbidden" element={<ForbiddenPage />} />

                    {/* Rota de troca de senha obrigatória (autenticado, sem layout) */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/change-password" element={<ChangePasswordPage />} />
                    </Route>

                    {/* Rotas protegidas: ADMIN e OWNER */}
                    <Route element={<ProtectedRoute requiredRoles={["ADMIN", "OWNER"]} />}>
                      <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/tenants" element={<TenantsPage />} />
                        <Route path="/professionals" element={<ProfessionalsPage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/customers" element={<CustomersPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/reports" element={<NotFound />} />
                      </Route>
                    </Route>

                    {/* Rotas protegidas: ADMIN, OWNER e EMPLOYEE */}
                    <Route element={<ProtectedRoute requiredRoles={["ADMIN", "OWNER", "EMPLOYEE"]} />}>
                      <Route element={<MainLayout />}>
                        <Route path="/bookings" element={<BookingsPage />} />
                        <Route path="/schedule" element={<NotFound />} />
                      </Route>
                    </Route>

                    {/* Rotas protegidas: ADMIN e CLIENT */}
                    <Route element={<ProtectedRoute requiredRoles={["ADMIN", "CLIENT"]} />}>
                      <Route element={<MainLayout />}>
                        <Route path="/my-bookings" element={<MyBookingsPage />} />
                      </Route>
                    </Route>

                    {/* Rotas protegidas: somente ADMIN */}
                    <Route element={<ProtectedRoute requiredRoles={["ADMIN"]} />}>
                      <Route element={<MainLayout />}>
                        <Route path="/settings" element={<SettingsPage />} />
                      </Route>
                    </Route>

                    {/* Rotas protegidas: todos os roles autenticados */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<MainLayout />}>
                        <Route path="/profile" element={<ProfilePage />} />
                      </Route>
                    </Route>

                    {/* Rota raiz: redireciona para home do role */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<HomeRedirect />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TenantProvider>
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
