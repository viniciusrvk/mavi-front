import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common";
import type { UserRole } from "@/types/api";

interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ requiredRoles }: ProtectedRouteProps): JSX.Element {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redireciona para troca de senha obrigatória no primeiro login
  if (user?.mustChangePassword && window.location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
