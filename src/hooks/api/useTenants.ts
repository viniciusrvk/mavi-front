import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Tenant, CreateTenantRequest, UpdateTenantRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const tenantKeys = {
  all: ["tenants"] as const,
  lists: () => [...tenantKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...tenantKeys.lists(), filters] as const,
  details: () => [...tenantKeys.all, "detail"] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
};

export function useTenants(): ReturnType<typeof useQuery<Tenant[], Error>> {
  return useQuery({
    queryKey: tenantKeys.lists(),
    queryFn: () => api.getTenants(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTenant(id: string): ReturnType<typeof useQuery<Tenant, Error>> {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => api.getTenant(id),
    enabled: !!id,
  });
}

export function useCreateTenant(): ReturnType<typeof useMutation<Tenant, Error, CreateTenantRequest>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTenantRequest) => api.createTenant(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast({
        title: "Estabelecimento criado!",
        description: `${data.name} foi criado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar estabelecimento",
        description: error.message,
      });
    },
  });
}

export function useUpdateTenant(): ReturnType<typeof useMutation<Tenant, Error, { id: string; data: UpdateTenantRequest }>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantRequest }) => api.updateTenant(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(data.id) });
      toast({
        title: "Estabelecimento atualizado!",
        description: `${data.name} foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar estabelecimento",
        description: error.message,
      });
    },
  });
}

export function useDeleteTenant(): ReturnType<typeof useMutation<void, Error, string>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast({
        title: "Estabelecimento excluído!",
        description: "O estabelecimento foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir estabelecimento",
        description: error.message,
      });
    },
  });
}
