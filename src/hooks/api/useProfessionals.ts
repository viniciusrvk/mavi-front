import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Professional, CreateProfessionalRequest, UpdateProfessionalRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const professionalKeys = {
  all: ["professionals"] as const,
  lists: () => [...professionalKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...professionalKeys.lists(), filters] as const,
  details: () => [...professionalKeys.all, "detail"] as const,
  detail: (id: string) => [...professionalKeys.details(), id] as const,
};

export function useProfessionals(): ReturnType<typeof useQuery<Professional[], Error>> {
  return useQuery({
    queryKey: professionalKeys.lists(),
    queryFn: () => api.getProfessionals(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfessional(id: string): ReturnType<typeof useQuery<Professional, Error>> {
  return useQuery({
    queryKey: professionalKeys.detail(id),
    queryFn: () => api.getProfessional(id),
    enabled: !!id,
  });
}

export function useCreateProfessional(): ReturnType<typeof useMutation<Professional, Error, CreateProfessionalRequest>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateProfessionalRequest) => api.createProfessional(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      toast({
        title: "Profissional cadastrado!",
        description: `${data.name} foi adicionado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar profissional",
        description: error.message,
      });
    },
  });
}

export function useUpdateProfessional(): ReturnType<typeof useMutation<Professional, Error, { id: string; data: UpdateProfessionalRequest }>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfessionalRequest }) => api.updateProfessional(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: professionalKeys.detail(data.id) });
      toast({
        title: "Profissional atualizado!",
        description: `${data.name} foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar profissional",
        description: error.message,
      });
    },
  });
}

export function useDeleteProfessional(): ReturnType<typeof useMutation<void, Error, string>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteProfessional(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      toast({
        title: "Profissional excluído!",
        description: "O profissional foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir profissional",
        description: error.message,
      });
    },
  });
}
