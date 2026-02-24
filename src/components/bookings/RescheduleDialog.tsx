import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRescheduleBooking } from "@/hooks/api/useBookings";
import { useAvailableSlotsOnly } from "@/hooks/api/useAvailableSlots";
import type { Booking } from "@/types/api";

interface RescheduleDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleDialog({
  booking,
  open,
  onOpenChange,
}: RescheduleDialogProps) {
  const reschedule = useRescheduleBooking();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Reset state when dialog opens
  useEffect(() => {
    if (open && booking) {
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [open, booking]);

  const { data: availableSlots = [], isLoading: loadingSlots } =
    useAvailableSlotsOnly(
      selectedDate && booking
        ? {
            professionalId: booking.professionalId,
            date: selectedDate,
            serviceIds: booking.services.map(s => s.serviceId),
          }
        : null,
      !!selectedDate && !!booking
    );

  const handleReschedule = () => {
    if (!booking || !selectedDate || !selectedTime) return;
    const newStartTime = `${selectedDate}T${selectedTime}:00`;
    reschedule.mutate(
      { id: booking.id, newStartTime },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  // Minimum date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar Atendimento</DialogTitle>
          <DialogDescription>
            {booking && (
              <>
                <strong>{booking.services.map(s => s.serviceName).join(", ")}</strong> com{" "}
                <strong>{booking.professionalName}</strong> para{" "}
                <strong>{booking.customerName}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              Nova Data
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime("");
              }}
              min={minDate}
            />
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Novo Horário
              </Label>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">
                  Carregando horários...
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário disponível nesta data.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={
                        selectedTime === slot.time ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedTime(slot.time)}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current booking info */}
          {booking && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p className="font-medium">Horário atual:</p>
              <p>
                {format(parseISO(booking.startTime), "dd/MM/yyyy")} às{" "}
                {format(parseISO(booking.startTime), "HH:mm")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleReschedule}
            disabled={
              !selectedDate || !selectedTime || reschedule.isPending
            }
          >
            {reschedule.isPending ? "Reagendando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
