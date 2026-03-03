import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, Scissors, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, LoadingSpinner, EmptyState, ErrorState } from "@/components/common";
import { useBookings } from "@/hooks/api/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { getStatusConfig } from "@/lib/booking-utils";
import { formatCurrency } from "@/lib/formatters";
import type { Booking } from "@/types/api";

function BookingCard({ booking }: { booking: Booking }): JSX.Element {
  const statusConfig = getStatusConfig(booking.status);
  const startDate = parseISO(booking.startTime);
  const endDate = parseISO(booking.endTime);

  const serviceNames = booking.services
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((s) => s.serviceName)
    .join(", ");

  const totalPrice = booking.price ?? booking.services.reduce((acc, s) => acc + s.price, 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Data e hora */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              {format(startDate, "HH:mm")} – {format(endDate, "HH:mm")}
            </div>
          </div>

          {/* Badge de status */}
          <Badge variant={statusConfig.variant} className="self-start sm:mt-0.5">
            {statusConfig.label}
          </Badge>
        </div>

        <div className="mt-3 border-t pt-3 flex flex-col gap-2">
          {/* Serviços */}
          <div className="flex items-center gap-2 text-sm">
            <Scissors className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{serviceNames || "—"}</span>
          </div>

          {/* Profissional */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 flex-shrink-0" />
            <span>{booking.professionalName}</span>
          </div>

          {/* Preço total */}
          {totalPrice > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{formatCurrency(totalPrice)}</span>
            </div>
          )}

          {/* Motivo de cancelamento */}
          {booking.cancellationReason && (
            <div className="flex items-start gap-2 text-sm text-destructive mt-1">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{booking.cancellationReason}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyBookingsPage(): JSX.Element {
  const { user } = useAuth();
  const { data: bookings, isLoading, isError, error } = useBookings();

  const myBookings = useMemo(() => {
    if (!bookings || !user?.customerId) return [];
    return [...bookings]
      .filter((b) => b.customerId === user.customerId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [bookings, user?.customerId]);

  // Conta por status para o sumário
  const upcoming = myBookings.filter((b) =>
    b.status === "REQUESTED" || b.status === "CONFIRMED"
  ).length;

  if (!user?.customerId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Meus Agendamentos"
          description="Acompanhe seus agendamentos"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-base font-medium text-foreground">
              Sua conta não está vinculada a um cliente.
            </p>
            <p className="text-sm text-muted-foreground">
              Contate o administrador para vincular seu acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Meus Agendamentos"
          description="Acompanhe seus agendamentos"
        />
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Meus Agendamentos"
          description="Acompanhe seus agendamentos"
        />
        <ErrorState
          title="Erro ao carregar agendamentos"
          description={error?.message ?? "Tente novamente mais tarde."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Agendamentos"
        description={
          upcoming > 0
            ? `Você tem ${upcoming} agendamento${upcoming !== 1 ? "s" : ""} pendente${upcoming !== 1 ? "s" : ""} ou confirmado${upcoming !== 1 ? "s" : ""}`
            : "Acompanhe seus agendamentos"
        }
      />

      {myBookings.length === 0 ? (
        <EmptyState
          title="Nenhum agendamento encontrado"
          description="Quando você realizar um agendamento, ele aparecerá aqui."
        />
      ) : (
        <>
          {/* Agendamentos ativos */}
          {(() => {
            const active = myBookings.filter(
              (b) => b.status === "REQUESTED" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS"
            );
            if (active.length === 0) return null;
            return (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Próximos / Em andamento
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Histórico */}
          {(() => {
            const past = myBookings.filter(
              (b) =>
                b.status === "COMPLETED" ||
                b.status === "CANCELLED" ||
                b.status === "REJECTED" ||
                b.status === "NO_SHOW"
            );
            if (past.length === 0) return null;
            return (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Histórico
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            );
          })()}
        </>
      )}
    </div>
  );
}
