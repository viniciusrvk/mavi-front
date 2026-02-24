/**
 * Utilitários compartilhados para booking/agendamento.
 */
import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types/api";

export interface StatusConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
  color: string;
}

const STATUS_CONFIGS: Record<BookingStatus, StatusConfig> = {
  REQUESTED: { variant: "outline", label: "Pendente", color: "bg-amber-500" },
  CONFIRMED: { variant: "default", label: "Confirmado", color: "bg-primary" },
  IN_PROGRESS: { variant: "secondary", label: "Em Andamento", color: "bg-chart-3" },
  COMPLETED: { variant: "default", label: "Concluído", color: "bg-green-500" },
  CANCELLED: { variant: "destructive", label: "Cancelado", color: "bg-destructive" },
  REJECTED: { variant: "destructive", label: "Rejeitado", color: "bg-destructive" },
  NO_SHOW: { variant: "destructive", label: "Não Compareceu", color: "bg-muted" },
};

export function getStatusConfig(status: BookingStatus): StatusConfig {
  return STATUS_CONFIGS[status];
}

export function BookingStatusBadge({ status }: { status: BookingStatus }): JSX.Element {
  const config = getStatusConfig(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
