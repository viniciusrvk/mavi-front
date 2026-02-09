import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Availability, CreateAvailabilityRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const availabilityKeys = {
  all: ["availabilities"] as const,
  lists: () => [...availabilityKeys.all, "list"] as const,
  list: (professionalId: string) =>
    [...availabilityKeys.lists(), professionalId] as const,
};

export function useAvailabilities(
  professionalId: string | null
): ReturnType<typeof useQuery<Availability[], Error>> {
  return useQuery({
    queryKey: availabilityKeys.list(professionalId || ""),
    queryFn: () => api.getAvailabilities(professionalId!),
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      professionalId,
      data,
    }: {
      professionalId: string;
      data: CreateAvailabilityRequest;
    }) => api.createAvailability(professionalId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.list(variables.professionalId),
      });
      toast({
        title: "Disponibilidade adicionada!",
        description: "O horário foi cadastrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar disponibilidade",
        description: error.message,
      });
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      professionalId,
      availabilityId,
    }: {
      professionalId: string;
      availabilityId: string;
    }) => api.deleteAvailability(professionalId, availabilityId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.list(variables.professionalId),
      });
      toast({
        title: "Disponibilidade removida",
        description: "O horário foi excluído.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover disponibilidade",
        description: error.message,
      });
    },
  });
}
