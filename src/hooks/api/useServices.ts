import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Service, CreateServiceRequest, UpdateServiceRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, "detail"] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

export function useServices(): ReturnType<typeof useQuery<Service[], Error>> {
  return useQuery({
    queryKey: serviceKeys.lists(),
    queryFn: () => api.getServices(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useService(id: string): ReturnType<typeof useQuery<Service, Error>> {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => api.getService(id),
    enabled: !!id,
  });
}

export function useCreateService(): ReturnType<typeof useMutation<Service, Error, CreateServiceRequest>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateServiceRequest) => api.createService(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast({
        title: "Serviço criado!",
        description: `${data.name} foi adicionado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar serviço",
        description: error.message,
      });
    },
  });
}

export function useUpdateService(): ReturnType<typeof useMutation<Service, Error, { id: string; data: UpdateServiceRequest }>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRequest }) => api.updateService(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(data.id) });
      toast({
        title: "Serviço atualizado!",
        description: `${data.name} foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar serviço",
        description: error.message,
      });
    },
  });
}

export function useDeleteService(): ReturnType<typeof useMutation<void, Error, string>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast({
        title: "Serviço excluído!",
        description: "O serviço foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir serviço",
        description: error.message,
      });
    },
  });
}
