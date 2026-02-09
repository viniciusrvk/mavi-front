import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Tenant } from '@/types/api';
import { api } from '@/lib/api';

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;
  refreshTenants: () => Promise<Tenant[]>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setTenants(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar estabelecimentos';
      console.error('Failed to fetch tenants:', err);
      setError(errorMessage);
      setTenants([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeTenant = async () => {
      const fetchedTenants = await refreshTenants();
      const savedTenantId = localStorage.getItem('mavi-tenant-id');
      
      if (savedTenantId && fetchedTenants.length > 0) {
        const savedTenant = fetchedTenants.find((t: Tenant) => t.id === savedTenantId);
        if (savedTenant) {
          setCurrentTenant(savedTenant);
        } else if (fetchedTenants.length > 0) {
          setCurrentTenant(fetchedTenants[0]);
        }
      } else if (fetchedTenants.length > 0) {
        setCurrentTenant(fetchedTenants[0]);
      }
    };

    initializeTenant();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        tenants,
        isLoading,
        error,
        refreshTenants,
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
