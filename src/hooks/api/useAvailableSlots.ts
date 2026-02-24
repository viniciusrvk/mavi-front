import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TimeSlot, GetAvailabilitySlotsParams } from "@/types/api";

/**
 * Extrai o horário de uma string ISO 8601.
 * "2026-01-25T09:00:00" → "09:00"
 */
function formatSlotTime(isoString: string): string {
  return isoString.split('T')[1].substring(0, 5);
}

/**
 * Hook para buscar horários disponíveis de um profissional
 * 
 * @param params - Parâmetros da consulta
 * @param params.professionalId - ID do profissional (obrigatório)
 * @param params.date - Data no formato YYYY-MM-DD (obrigatório)
 * @param params.serviceIds - IDs dos serviços (opcional, define duração total do slot)
 * @param enabled - Se a query deve ser executada
 */
export function useAvailableSlots(
  params: GetAvailabilitySlotsParams | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["available-slots", params?.professionalId, params?.date, params?.serviceIds],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!params) return [];
      
      const slots = await api.getAvailableSlots(params);
      
      // Transforma o formato da API para o formato do frontend
      return slots.map(slot => ({
        time: formatSlotTime(slot.startTime),
        available: slot.available,
      }));
    },
    enabled: enabled && !!params?.professionalId && !!params?.date,
    staleTime: 1000 * 60, // 1 minuto - slots podem mudar com frequência
  });
}

/**
 * Hook para buscar apenas horários disponíveis (filtra indisponíveis)
 */
export function useAvailableSlotsOnly(
  params: GetAvailabilitySlotsParams | null,
  enabled = true
) {
  const query = useAvailableSlots(params, enabled);
  
  return {
    ...query,
    data: query.data?.filter(slot => slot.available),
  };
}
