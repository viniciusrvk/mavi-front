import type { UserRole } from '@/types/api';

// Rotas acessíveis por cada role
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  ADMIN: ['*'], // acesso total
  OWNER: ['/dashboard', '/tenants', '/professionals', '/services', '/customers', '/bookings', '/reports'],
  EMPLOYEE: ['/bookings', '/schedule'],
  CLIENT: ['/my-bookings'],
};

// Verifica se um role tem permissão para uma rota
export function hasRouteAccess(role: UserRole, path: string): boolean {
  const allowed = ROLE_ROUTES[role];
  if (allowed.includes('*')) return true;
  return allowed.some(route => path.startsWith(route));
}

// Rota padrão após login por role
export const HOME_BY_ROLE: Record<UserRole, string> = {
  ADMIN: '/dashboard',
  OWNER: '/dashboard',
  EMPLOYEE: '/bookings',
  CLIENT: '/my-bookings',
};

// Label amigável do role
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  OWNER: 'Proprietário',
  EMPLOYEE: 'Funcionário',
  CLIENT: 'Cliente',
};
