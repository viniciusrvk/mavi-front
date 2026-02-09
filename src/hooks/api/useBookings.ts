import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Booking, CreateBookingRequest, BookingStatus } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, "detail"] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  byDate: (date: string) => [...bookingKeys.lists(), { date }] as const,
};

export function useBookings(date?: string): ReturnType<typeof useQuery<Booking[], Error>> {
  return useQuery({
    queryKey: date ? bookingKeys.byDate(date) : bookingKeys.lists(),
    queryFn: () => api.getBookings(date ? { date } : undefined),
    staleTime: 1 * 60 * 1000, // 1 minute - bookings change frequently
  });
}

export function useBooking(id: string): ReturnType<typeof useQuery<Booking, Error>> {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => api.getBooking(id),
    enabled: !!id,
  });
}

export function useCreateBooking(): ReturnType<typeof useMutation<Booking, Error, CreateBookingRequest>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateBookingRequest) => api.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast({
        title: "Agendamento criado!",
        description: "O agendamento foi registrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar agendamento",
        description: error.message,
      });
    },
  });
}

const statusMethods: Record<BookingStatus, ((id: string) => Promise<Booking>) | null> = {
  REQUESTED: null,
  CONFIRMED: (id: string) => api.confirmBooking(id),
  IN_PROGRESS: (id: string) => api.startBooking(id),
  COMPLETED: (id: string) => api.completeBooking(id),
  CANCELLED: (id: string) => api.cancelBooking(id),
  REJECTED: null, // Use useRejectBooking instead (requires reason)
  NO_SHOW: (id: string) => api.noShowBooking(id),
};

export function useUpdateBookingStatus(): ReturnType<typeof useMutation<Booking, Error, { id: string; status: BookingStatus }>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusLabels: Record<BookingStatus, string> = {
    REQUESTED: "pendente",
    CONFIRMED: "confirmado",
    IN_PROGRESS: "iniciado",
    COMPLETED: "concluído",
    CANCELLED: "cancelado",
    REJECTED: "rejeitado",
    NO_SHOW: "marcado como não compareceu",
  };

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const method = statusMethods[status];
      if (!method) {
        throw new Error(`Status ${status} não pode ser definido diretamente`);
      }
      return method(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(data.id) });
      toast({
        title: "Status atualizado",
        description: `Agendamento ${statusLabels[data.status]}.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error.message,
      });
    },
  });
}

export function useCancelBooking(): ReturnType<typeof useMutation<Booking, Error, { id: string; reason?: string }>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      api.cancelBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar agendamento",
        description: error.message,
      });
    },
  });
}

export function useRejectBooking(): ReturnType<typeof useMutation<Booking, Error, { id: string; reason?: string }>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.rejectBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast({
        title: "Agendamento rejeitado",
        description: "O agendamento foi rejeitado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao rejeitar agendamento",
        description: error.message,
      });
    },
  });
}

export function useRescheduleBooking(): ReturnType<typeof useMutation<Booking, Error, { id: string; newStartTime: string }>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, newStartTime }: { id: string; newStartTime: string }) =>
      api.rescheduleBooking(id, newStartTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast({
        title: "Agendamento reagendado",
        description: "O agendamento foi reagendado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao reagendar",
        description: error.message,
      });
    },
  });
}
