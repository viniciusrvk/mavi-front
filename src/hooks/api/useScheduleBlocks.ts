import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ScheduleBlock, CreateScheduleBlockRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const scheduleBlockKeys = {
  all: ["schedule-blocks"] as const,
  lists: () => [...scheduleBlockKeys.all, "list"] as const,
  list: (professionalId: string) =>
    [...scheduleBlockKeys.lists(), professionalId] as const,
};

export function useScheduleBlocks(
  professionalId: string | null
): ReturnType<typeof useQuery<ScheduleBlock[], Error>> {
  return useQuery({
    queryKey: scheduleBlockKeys.list(professionalId || ""),
    queryFn: () => api.getScheduleBlocks(professionalId!),
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateScheduleBlock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      professionalId,
      data,
    }: {
      professionalId: string;
      data: CreateScheduleBlockRequest;
    }) => api.createScheduleBlock(professionalId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: scheduleBlockKeys.list(variables.professionalId),
      });
      toast({
        title: "Bloqueio criado!",
        description: "O bloqueio de agenda foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar bloqueio",
        description: error.message,
      });
    },
  });
}

export function useDeleteScheduleBlock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      professionalId,
      blockId,
    }: {
      professionalId: string;
      blockId: string;
    }) => api.deleteScheduleBlock(blockId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: scheduleBlockKeys.list(variables.professionalId),
      });
      toast({
        title: "Bloqueio removido",
        description: "O bloqueio de agenda foi excluído.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover bloqueio",
        description: error.message,
      });
    },
  });
}
