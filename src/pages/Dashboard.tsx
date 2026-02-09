import { useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Users, 
  Scissors, 
  UserCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/TenantContext";
import { useBookings } from "@/hooks/api/useBookings";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useServices } from "@/hooks/api/useServices";
import { useProfessionals } from "@/hooks/api/useProfessionals";
import { LoadingSpinner } from "@/components/common";
import type { BookingStatus } from "@/types/api";

function getStatusBadge(status: BookingStatus): JSX.Element {
  const variants: Record<BookingStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    REQUESTED: { variant: "outline", label: "Pendente" },
    CONFIRMED: { variant: "default", label: "Confirmado" },
    IN_PROGRESS: { variant: "secondary", label: "Em Andamento" },
    COMPLETED: { variant: "default", label: "Concluído" },
    CANCELLED: { variant: "destructive", label: "Cancelado" },
    REJECTED: { variant: "destructive", label: "Rejeitado" },
    NO_SHOW: { variant: "destructive", label: "Não Compareceu" },
  };
  
  const config = variants[status] || { variant: "outline" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function Dashboard(): JSX.Element {
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { data: customers } = useCustomers();
  const { data: services } = useServices();
  const { data: professionals } = useProfessionals();

  const today = new Date();

  const todayBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings
      .filter((booking) => isSameDay(parseISO(booking.startTime), today))
      .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());
  }, [bookings, today]);

  const stats = useMemo(() => {
    const confirmedToday = todayBookings.filter(b => b.status === "CONFIRMED").length;
    const pendingToday = todayBookings.filter(b => b.status === "REQUESTED").length;
    const activeProfessionals = professionals?.filter(p => p.active).length || 0;
    const todayRevenue = todayBookings
      .filter(b => b.status === "COMPLETED")
      .reduce((sum, b) => sum + (b.price || 0), 0);

    return [
      { 
        title: "Agendamentos Hoje", 
        value: String(todayBookings.length), 
        description: `${confirmedToday} confirmados, ${pendingToday} pendentes`, 
        icon: Calendar,
        color: "text-primary"
      },
      {
        title: "Faturamento do Dia",
        value: `R$ ${todayRevenue.toFixed(2)}`,
        description: `${todayBookings.filter(b => b.status === "COMPLETED").length} atendimentos concluídos`,
        icon: DollarSign,
        color: "text-green-500"
      },
      { 
        title: "Clientes Ativos", 
        value: String(customers?.length || 0), 
        description: "cadastrados no sistema", 
        icon: Users,
        color: "text-accent-foreground"
      },
      { 
        title: "Serviços", 
        value: String(services?.filter(s => s.active).length || 0), 
        description: "serviços ativos", 
        icon: Scissors,
        color: "text-chart-3"
      },
      { 
        title: "Profissionais", 
        value: String(professionals?.length || 0), 
        description: `${activeProfessionals} ativos`, 
        icon: UserCircle,
        color: "text-chart-4"
      },
    ];
  }, [todayBookings, customers, services, professionals]);

  const bookingSummary = useMemo(() => {
    return {
      requested: todayBookings.filter(b => b.status === "REQUESTED").length,
      confirmed: todayBookings.filter(b => b.status === "CONFIRMED").length,
      inProgress: todayBookings.filter(b => b.status === "IN_PROGRESS").length,
      completed: todayBookings.filter(b => b.status === "COMPLETED").length,
      cancelled: todayBookings.filter(b => b.status === "CANCELLED").length,
      rejected: todayBookings.filter(b => b.status === "REJECTED").length,
      noShow: todayBookings.filter(b => b.status === "NO_SHOW").length,
    };
  }, [todayBookings]);

  const isLoading = tenantLoading || bookingsLoading;

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (!currentTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Nenhum Estabelecimento Selecionado</h2>
          <p className="text-muted-foreground mt-1">
            Selecione ou crie um estabelecimento para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao {currentTenant.name}! Aqui está o resumo do seu dia.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agenda de Hoje
            </CardTitle>
            <CardDescription>
              {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBookings.slice(0, 5).map((booking) => {
                  const customer = customers?.find(c => c.id === booking.customerId);
                  const service = services?.find(s => s.id === booking.serviceId);
                  const professional = professionals?.find(p => p.id === booking.professionalId);
                  return (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-primary min-w-[50px]">
                          {format(parseISO(booking.startTime), "HH:mm")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{customer?.name || "Cliente"}</p>
                          <p className="text-xs text-muted-foreground">
                            {service?.name || "Serviço"} • {professional?.name || "Profissional"}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  );
                })}
                {todayBookings.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{todayBookings.length - 5} agendamentos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Resumo do Dia
            </CardTitle>
            <CardDescription>
              Horário de funcionamento: {currentTenant.openTime} - {currentTenant.closeTime}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{bookingSummary.requested}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{bookingSummary.confirmed}</p>
                  <p className="text-xs text-muted-foreground">Confirmados</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{bookingSummary.inProgress}</p>
                  <p className="text-xs text-muted-foreground">Em Andamento</p>
                </div>
                <div className="rounded-lg bg-green-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{bookingSummary.completed}</p>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{bookingSummary.cancelled}</p>
                  <p className="text-xs text-muted-foreground">Cancelados</p>
                </div>
                <div className="rounded-lg bg-orange-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{bookingSummary.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejeitados</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center col-span-2">
                  <p className="text-2xl font-bold">{bookingSummary.noShow}</p>
                  <p className="text-xs text-muted-foreground">Não Compareceram</p>
                </div>
              </div>
              
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium mb-2">Total de Agendamentos Hoje</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-lg font-semibold">{todayBookings.length}</span>
                  <span className="text-sm text-muted-foreground">agendamentos</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
