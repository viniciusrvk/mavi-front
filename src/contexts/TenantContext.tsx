import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import type { Tenant } from '@/types/api';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;
  refreshTenants: () => Promise<Tenant[]>;
  // true quando o usuário só tem um tenant — não deve permitir troca
  isTenantFixed: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  // useAuth() é seguro aqui pois TenantProvider é sempre filho de AuthProvider (ver App.tsx)
  const { user } = useAuth();

  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtra a lista de tenants visíveis de acordo com o role do usuário.
  // ADMIN vê todos. Os demais veem apenas os tenants associados ao seu user.
  const tenants = useMemo<Tenant[]>(() => {
    if (!user || user.role === 'ADMIN') return allTenants;
    return allTenants.filter((t) => user.tenantIds.includes(t.id));
  }, [allTenants, user]);

  // Usuário com exatamente 1 tenant não pode trocar de tenant
  const isTenantFixed = tenants.length === 1;

  const setCurrentTenant = (tenant: Tenant | null) => {
    setCurrentTenantState(tenant);
    api.setTenantId(tenant?.id || null);
    if (tenant) {
      localStorage.setItem('mavi-tenant-id', tenant.id);
    } else {
      localStorage.removeItem('mavi-tenant-id');
    }
  };

  const refreshTenants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTenants();
      setAllTenants(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar estabelecimentos';
      console.error('Failed to fetch tenants:', err);
      setError(errorMessage);
      setAllTenants([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializa tenants quando o usuário estiver disponível
  useEffect(() => {
    if (user === null) return; // aguarda autenticação

    const initializeTenant = async () => {
      const fetchedAll = await refreshTenants();

      // Aplica filtro de role já na inicialização
      const visible =
        user.role === 'ADMIN'
          ? fetchedAll
          : fetchedAll.filter((t) => user.tenantIds.includes(t.id));

      if (visible.length === 0) return;

      const savedTenantId = localStorage.getItem('mavi-tenant-id');
      const savedTenant = savedTenantId
        ? visible.find((t) => t.id === savedTenantId)
        : null;

      setCurrentTenant(savedTenant ?? visible[0]);
    };

    initializeTenant();
    // Recarrega tenants sempre que o usuário logado mudar (ex: troca de conta)
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        tenants,
        isLoading,
        error,
        refreshTenants,
        isTenantFixed,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
