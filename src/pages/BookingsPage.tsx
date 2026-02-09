import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  Scissors,
  Filter,
  X,
  Check,
  Play,
  Ban,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useBookings, useCreateBooking, useUpdateBookingStatus, useCancelBooking, useRejectBooking } from "@/hooks/api/useBookings";
import { useProfessionals } from "@/hooks/api/useProfessionals";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useServices } from "@/hooks/api/useServices";
import { useAvailableSlots } from "@/hooks/api/useAvailableSlots";
import { useProfessionalServices, useServiceProfessionals } from "@/hooks/api/useProfessionalServices";
import { RescheduleDialog } from "@/components/bookings/RescheduleDialog";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/common";
import { Input } from "@/components/ui/input";
import type { BookingStatus, Booking } from "@/types/api";

const statuses = [
  { value: "all", label: "Todos" },
  { value: "REQUESTED", label: "Pendentes" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "COMPLETED", label: "Concluídos" },
  { value: "CANCELLED", label: "Cancelados" },
];

function getStatusConfig(status: BookingStatus): { variant: "default" | "secondary" | "destructive" | "outline"; label: string; color: string } {
  const configs: Record<BookingStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; color: string }> = {
    REQUESTED: { variant: "outline", label: "Pendente", color: "bg-amber-500" },
    CONFIRMED: { variant: "default", label: "Confirmado", color: "bg-primary" },
    IN_PROGRESS: { variant: "secondary", label: "Em Andamento", color: "bg-chart-3" },
    COMPLETED: { variant: "default", label: "Concluído", color: "bg-green-500" },
    CANCELLED: { variant: "destructive", label: "Cancelado", color: "bg-destructive" },
    REJECTED: { variant: "destructive", label: "Rejeitado", color: "bg-destructive" },
    NO_SHOW: { variant: "destructive", label: "Não Compareceu", color: "bg-muted" },
  };
  return configs[status];
}

export default function BookingsPage(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reasonDialogAction, setReasonDialogAction] = useState<"cancel" | "reject" | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newBooking, setNewBooking] = useState({
    customerId: "",
    serviceIds: [] as string[],
    professionalId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
  });

  const { data: bookings, isLoading, isError, error } = useBookings();
  const { data: professionals } = useProfessionals();
  const { data: customers } = useCustomers();
  const { data: services } = useServices();
  const createBooking = useCreateBooking();
  const updateBookingStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();
  const rejectBooking = useRejectBooking();

  // Dynamic filtering: service -> professionals, professional -> services
  const { data: serviceProfessionals } = useServiceProfessionals(
    newBooking.serviceIds.length > 0 ? newBooking.serviceIds[0] : null
  );
  const { data: professionalServicesList } = useProfessionalServices(
    newBooking.professionalId || null
  );

  // Filtered options for create dialog
  const filteredProfessionals = useMemo(() => {
    const activeProfessionals = professionals?.filter(p => p.active) || [];
    if (newBooking.serviceIds.length === 0 || !serviceProfessionals) return activeProfessionals;
    const validIds = new Set(serviceProfessionals.map(sp => sp.professionalId));
    return activeProfessionals.filter(p => validIds.has(p.id));
  }, [professionals, newBooking.serviceIds, serviceProfessionals]);

  const filteredServices = useMemo(() => {
    const activeServices = services?.filter(s => s.active) || [];
    if (!newBooking.professionalId || !professionalServicesList) return activeServices;
    const validIds = new Set(professionalServicesList.map(ps => ps.serviceId));
    return activeServices.filter(s => validIds.has(s.id));
  }, [services, newBooking.professionalId, professionalServicesList]);

  // Effective price/duration for all selected services
  const effectiveInfo = useMemo(() => {
    if (newBooking.serviceIds.length === 0 || !newBooking.professionalId || !professionalServicesList) return null;
    let totalPrice = 0;
    let totalDuration = 0;
    for (const sid of newBooking.serviceIds) {
      const ps = professionalServicesList.find(ps => ps.serviceId === sid);
      if (ps) {
        totalPrice += ps.effectivePrice;
        totalDuration += ps.effectiveDurationMinutes;
      }
    }
    if (totalDuration === 0) return null;
    return { price: totalPrice, duration: totalDuration };
  }, [newBooking.serviceIds, newBooking.professionalId, professionalServicesList]);

  // Busca slots disponíveis quando profissional e data estão selecionados
  const { data: availableSlots, isLoading: isSlotsLoading } = useAvailableSlots(
    newBooking.professionalId && newBooking.date
      ? {
          professionalId: newBooking.professionalId,
          date: newBooking.date,
          serviceIds: newBooking.serviceIds.length > 0 ? newBooking.serviceIds : undefined,
        }
      : null
  );

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((booking) => {
      const bookingDate = parseISO(booking.startTime);
      const dateMatch = isSameDay(bookingDate, selectedDate);
      const professionalMatch = selectedProfessional === "all" || booking.professionalId === selectedProfessional;
      const statusMatch = selectedStatus === "all" || booking.status === selectedStatus;
      return dateMatch && professionalMatch && statusMatch;
    });
  }, [bookings, selectedDate, selectedProfessional, selectedStatus]);

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus): void => {
    updateBookingStatus.mutate(
      { id: bookingId, status: newStatus },
      {
        onSuccess: () => setSelectedBooking(null),
      }
    );
  };

  const handleCreate = (): void => {
    const startTime = `${newBooking.date}T${newBooking.time}:00`;
    createBooking.mutate(
      {
        customerId: newBooking.customerId,
        serviceIds: newBooking.serviceIds,
        professionalId: newBooking.professionalId,
        startTime,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewBooking({
            customerId: "",
            serviceIds: [],
            professionalId: "",
            date: format(new Date(), "yyyy-MM-dd"),
            time: "",
          });
        },
      }
    );
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CalendarIcon className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Erro ao carregar agendamentos</h2>
          <p className="text-muted-foreground mt-1">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agendamentos"
        description="Gerencie os agendamentos do estabelecimento"
        action={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Crie um novo agendamento para um cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Select 
                    value={newBooking.customerId} 
                    onValueChange={(value) => setNewBooking({ ...newBooking, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Serviços</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start font-normal">
                        <Scissors className="mr-2 h-4 w-4" />
                        {newBooking.serviceIds.length === 0
                          ? "Selecione os serviços"
                          : `${newBooking.serviceIds.length} serviço(s) selecionado(s)`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                        {filteredServices.map((service) => {
                          const isChecked = newBooking.serviceIds.includes(service.id);
                          return (
                            <label
                              key={service.id}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  const updated = { ...newBooking, time: "" };
                                  if (checked) {
                                    updated.serviceIds = [...newBooking.serviceIds, service.id];
                                  } else {
                                    updated.serviceIds = newBooking.serviceIds.filter(id => id !== service.id);
                                  }
                                  setNewBooking(updated);
                                }}
                              />
                              <span className="flex-1 text-sm">{service.name}</span>
                              <span className="text-xs text-muted-foreground">
                                R$ {service.price.toFixed(2)}
                              </span>
                            </label>
                          );
                        })}
                        {filteredServices.length === 0 && (
                          <p className="text-sm text-muted-foreground p-2">Nenhum serviço disponível</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {newBooking.serviceIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newBooking.serviceIds.map(sid => {
                        const svc = services?.find(s => s.id === sid);
                        return svc ? (
                          <Badge key={sid} variant="secondary" className="text-xs">
                            {svc.name}
                            <button
                              type="button"
                              className="ml-1 hover:text-destructive"
                              onClick={() => setNewBooking({
                                ...newBooking,
                                serviceIds: newBooking.serviceIds.filter(id => id !== sid),
                                time: "",
                              })}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Profissional</Label>
                  <Select
                    value={newBooking.professionalId}
                    onValueChange={(value) => {
                      const updated = { ...newBooking, professionalId: value, time: "" };
                      // Clear service if not compatible
                      if (updated.serviceId && professionalServicesList) {
                        const validIds = new Set(professionalServicesList.map(ps => ps.serviceId));
                        if (!validIds.has(updated.serviceId)) {
                          updated.serviceId = "";
                        }
                      }
                      setNewBooking(updated);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProfessionals.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id}>
                          {professional.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {effectiveInfo && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p><strong>Preço efetivo:</strong> R$ {effectiveInfo.price.toFixed(2)}</p>
                    <p><strong>Duração:</strong> {effectiveInfo.duration} min</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(parseISO(newBooking.date), "dd/MM/yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={parseISO(newBooking.date)}
                          onSelect={(date) => date && setNewBooking({ ...newBooking, date: format(date, "yyyy-MM-dd"), time: "" })}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label>Horário</Label>
                    <Select
                      value={newBooking.time}
                      onValueChange={(value) => setNewBooking({ ...newBooking, time: value })}
                      disabled={!newBooking.professionalId || !newBooking.date}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!newBooking.professionalId ? "Selecione um profissional" : isSlotsLoading ? "Carregando..." : "Selecione o horário"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isSlotsLoading ? (
                          <SelectItem value="loading" disabled>Carregando horários...</SelectItem>
                        ) : availableSlots && availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <SelectItem 
                              key={slot.time} 
                              value={slot.time}
                              disabled={!slot.available}
                            >
                              {slot.time} {!slot.available && "(Indisponível)"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            {newBooking.professionalId ? "Nenhum horário disponível" : "Selecione um profissional primeiro"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!newBooking.customerId || newBooking.serviceIds.length === 0 || !newBooking.professionalId || createBooking.isPending}
                >
                  {createBooking.isPending ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {professionals?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Week View */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          {weekDays.map((day) => (
            <Button
              key={day.toISOString()}
              variant={isSameDay(day, selectedDate) ? "default" : "outline"}
              className="flex flex-col h-auto py-2 px-3"
              onClick={() => setSelectedDate(day)}
            >
              <span className="text-xs">{format(day, "EEE", { locale: ptBR })}</span>
              <span className="text-lg font-bold">{format(day, "d")}</span>
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="Nenhum agendamento"
              description="Não há agendamentos para esta data com os filtros selecionados."
            />
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const customer = customers?.find(c => c.id === booking.customerId);
                const professional = professionals?.find(p => p.id === booking.professionalId);
                const serviceNames = booking.services.map(s => s.serviceName).join(", ");
                return (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1 h-12 rounded-full ${statusConfig.color}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-semibold">
                            {format(parseISO(booking.startTime), "HH:mm")} - {booking.endTime ? format(parseISO(booking.endTime), "HH:mm") : "--:--"}
                          </span>
                        </div>
                        <p className="font-medium mt-1">{customer?.name || "Cliente"}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Scissors className="h-3 w-3" />
                            {serviceNames || "Serviço"}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {professional?.name || "Profissional"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary">
                        R$ {booking.price != null ? Number(booking.price).toFixed(2) : "0.00"}
                      </span>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedBooking && (() => {
            const customer = customers?.find(c => c.id === selectedBooking.customerId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Detalhes do Agendamento</DialogTitle>
                  <DialogDescription>
                    Gerencie o status deste agendamento
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Horário</p>
                      <p className="font-medium">
                        {format(parseISO(selectedBooking.startTime), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{customer?.name || "Cliente"}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors className="h-5 w-5 text-primary" />
                      <p className="text-sm text-muted-foreground">Serviços</p>
                    </div>
                    <div className="space-y-1">
                      {selectedBooking.services.map((svc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{svc.serviceName}</span>
                          <span className="text-muted-foreground">
                            {svc.durationMinutes}min — R$ {Number(svc.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                      <p className="text-sm text-muted-foreground">Status Atual</p>
                      <Badge variant={getStatusConfig(selectedBooking.status).variant} className="mt-1">
                        {getStatusConfig(selectedBooking.status).label}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      R$ {selectedBooking.price != null ? Number(selectedBooking.price).toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  {selectedBooking.status === "REQUESTED" && (
                    <>
                      <Button 
                        variant="outline" 
                        className="text-destructive"
                        onClick={() => {
                          setReasonDialogAction("reject");
                          setReasonText("");
                        }}
                        disabled={updateBookingStatus.isPending || rejectBooking.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                      <Button 
                        onClick={() => handleStatusChange(selectedBooking.id, "CONFIRMED")}
                        disabled={updateBookingStatus.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar
                      </Button>
                    </>
                  )}
                  {selectedBooking.status === "CONFIRMED" && (
                    <>
                      <Button 
                        variant="outline" 
                        className="text-destructive"
                        onClick={() => {
                          setReasonDialogAction("cancel");
                          setReasonText("");
                        }}
                        disabled={updateBookingStatus.isPending || cancelBooking.isPending}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setRescheduleBooking(selectedBooking);
                          setSelectedBooking(null);
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reagendar
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleStatusChange(selectedBooking.id, "NO_SHOW")}
                        disabled={updateBookingStatus.isPending}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Não Compareceu
                      </Button>
                      <Button 
                        onClick={() => handleStatusChange(selectedBooking.id, "IN_PROGRESS")}
                        disabled={updateBookingStatus.isPending}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar
                      </Button>
                    </>
                  )}
                  {selectedBooking.status === "IN_PROGRESS" && (
                    <Button 
                      onClick={() => handleStatusChange(selectedBooking.id, "COMPLETED")}
                      disabled={updateBookingStatus.isPending}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Concluir
                    </Button>
                  )}
                </DialogFooter>

                {/* Reason dialog for cancel/reject */}
                <Dialog open={reasonDialogAction !== null} onOpenChange={(open) => { if (!open) setReasonDialogAction(null); }}>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>
                        {reasonDialogAction === "cancel" ? "Cancelar Agendamento" : "Rejeitar Agendamento"}
                      </DialogTitle>
                      <DialogDescription>
                        {reasonDialogAction === "cancel"
                          ? "Informe o motivo do cancelamento (opcional)."
                          : "Informe o motivo da rejeição (opcional)."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label>Motivo</Label>
                      <Input
                        placeholder="Ex: Cliente solicitou cancelamento"
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setReasonDialogAction(null)}>
                        Voltar
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={cancelBooking.isPending || rejectBooking.isPending}
                        onClick={() => {
                          if (reasonDialogAction === "cancel") {
                            cancelBooking.mutate(
                              { id: selectedBooking.id, reason: reasonText || undefined },
                              { onSuccess: () => { setReasonDialogAction(null); setSelectedBooking(null); } }
                            );
                          } else {
                            rejectBooking.mutate(
                              { id: selectedBooking.id, reason: reasonText || undefined },
                              { onSuccess: () => { setReasonDialogAction(null); setSelectedBooking(null); } }
                            );
                          }
                        }}
                      >
                        {reasonDialogAction === "cancel" ? "Cancelar Agendamento" : "Rejeitar Agendamento"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <RescheduleDialog
        booking={rescheduleBooking}
        open={!!rescheduleBooking}
        onOpenChange={(open) => !open && setRescheduleBooking(null)}
      />
    </div>
  );
}
