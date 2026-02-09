import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SlotRule, CreateSlotRuleRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const slotRuleKeys = {
  all: ["slot-rules"] as const,
  detail: (tenantId: string) =>
    [...slotRuleKeys.all, tenantId] as const,
};

export function useSlotRule(
  tenantId: string | null
): ReturnType<typeof useQuery<SlotRule | null, Error>> {
  return useQuery({
    queryKey: slotRuleKeys.detail(tenantId || ""),
    queryFn: async () => {
      return await api.getSlotRule(tenantId!);
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSlotRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateSlotRuleRequest;
    }) => api.createSlotRule(tenantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: slotRuleKeys.detail(variables.tenantId),
      });
      toast({
        title: "Configuração salva!",
        description: "As regras de horários foram criadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configuração",
        description: error.message,
      });
    },
  });
}

export function useUpdateSlotRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      tenantId,
      ruleId,
      data,
    }: {
      tenantId: string;
      ruleId: string;
      data: CreateSlotRuleRequest;
    }) => api.updateSlotRule(tenantId, ruleId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: slotRuleKeys.detail(variables.tenantId),
      });
      toast({
        title: "Configuração atualizada!",
        description: "As regras de horários foram atualizadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar configuração",
        description: error.message,
      });
    },
  });
}
