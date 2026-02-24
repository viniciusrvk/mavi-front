import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ProfessionalService,
  AssignServiceRequest,
  UpdateProfessionalServiceRequest,
  ServiceProfessional,
} from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const professionalServiceKeys = {
  all: ["professional-services"] as const,
  lists: () => [...professionalServiceKeys.all, "list"] as const,
  list: (professionalId: string) =>
    [...professionalServiceKeys.lists(), professionalId] as const,
};

export const serviceProfessionalKeys = {
  all: ["service-professionals"] as const,
  lists: () => [...serviceProfessionalKeys.all, "list"] as const,
  list: (serviceId: string) =>
    [...serviceProfessionalKeys.lists(), serviceId] as const,
};

export function useProfessionalServices(
  professionalId: string | null
): ReturnType<typeof useQuery<ProfessionalService[], Error>> {
  return useQuery({
    queryKey: professionalServiceKeys.list(professionalId || ""),
    queryFn: () => api.getProfessionalServices(professionalId!),
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useServiceProfessionals(
  serviceId: string | null
): ReturnType<typeof useQuery<ServiceProfessional[], Error>> {
  return useQuery({
    queryKey: serviceProfessionalKeys.list(serviceId || ""),
    queryFn: () => api.getServiceProfessionals(serviceId!),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      professionalId,
      data,
    }: {
      professionalId: string;
      data: AssignServiceRequest;
    }) => api.assignService(professionalId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: professionalServiceKeys.list(variables.professionalId),
      });
      queryClient.invalidateQueries({
        queryKey: serviceProfessionalKeys.all,
      });
      toast({
        title: "Serviço associado!",
        description: "O serviço foi associado ao profissional.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao associar serviço",
        description: error.message,
      });
    },
  });
}

export function useUpdateServiceAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      professionalId,
      serviceId,
      data,
    }: {
      professionalId: string;
      serviceId: string;
      data: UpdateProfessionalServiceRequest;
    }) => api.updateServiceAssignment(professionalId, serviceId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: professionalServiceKeys.list(variables.professionalId),
      });
      queryClient.invalidateQueries({
        queryKey: serviceProfessionalKeys.all,
      });
      toast({
        title: "Serviço atualizado!",
        description: "Os valores personalizados foram salvos.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar serviço",
        description: error.message,
      });
    },
  });
}

export function useUnassignService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      professionalId,
      serviceId,
    }: {
      professionalId: string;
      serviceId: string;
    }) => api.unassignService(professionalId, serviceId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: professionalServiceKeys.list(variables.professionalId),
      });
      queryClient.invalidateQueries({
        queryKey: serviceProfessionalKeys.all,
      });
      toast({
        title: "Serviço desassociado",
        description: "O serviço foi removido do profissional.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao desassociar serviço",
        description: error.message,
      });
    },
  });
}
