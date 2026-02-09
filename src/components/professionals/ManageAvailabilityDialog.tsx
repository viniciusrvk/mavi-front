import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus } from "lucide-react";
import {
  useAvailabilities,
  useCreateAvailability,
  useDeleteAvailability,
} from "@/hooks/api/useAvailabilities";
import type { DayOfWeek } from "@/types/api";

interface ManageAvailabilityDialogProps {
  professionalId: string | null;
  professionalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: "MONDAY", label: "Segunda-feira" },
  { value: "TUESDAY", label: "Terça-feira" },
  { value: "WEDNESDAY", label: "Quarta-feira" },
  { value: "THURSDAY", label: "Quinta-feira" },
  { value: "FRIDAY", label: "Sexta-feira" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export function ManageAvailabilityDialog({
  professionalId,
  professionalName,
  open,
  onOpenChange,
}: ManageAvailabilityDialogProps) {
  const { data: availabilities = [], isLoading } =
    useAvailabilities(professionalId);
  const createAvailability = useCreateAvailability();
  const deleteAvailability = useDeleteAvailability();

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | "">("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");

  // Group availabilities by day
  const groupedByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    availabilities: availabilities
      .filter((a) => a.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  const handleCreate = () => {
    if (!professionalId || !dayOfWeek) return;
    createAvailability.mutate(
      {
        professionalId,
        data: { dayOfWeek, startTime, endTime },
      },
      {
        onSuccess: () => {
          setDayOfWeek("");
          setStartTime("08:00");
          setEndTime("18:00");
        },
      }
    );
  };

  const handleDelete = (availabilityId: string) => {
    if (!professionalId) return;
    deleteAvailability.mutate({ professionalId, availabilityId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Disponibilidade — {professionalName}</DialogTitle>
          <DialogDescription>
            Configure os horários de atendimento do profissional por dia da
            semana.
          </DialogDescription>
        </DialogHeader>

        {/* Weekly grid */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {groupedByDay.map((day) => (
              <div key={day.value}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium w-20">
                    {DAY_LABELS[day.value]}
                  </span>
                  {day.availabilities.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Sem horário
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {day.availabilities.map((a) => (
                        <Badge
                          key={a.id}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {a.startTime.substring(0, 5)} —{" "}
                          {a.endTime.substring(0, 5)}
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="ml-1 hover:text-destructive"
                            disabled={deleteAvailability.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Add availability form */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Adicionar Horário</Label>
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={dayOfWeek}
              onValueChange={(v) => setDayOfWeek(v as DayOfWeek)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dia..." />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!dayOfWeek || createAvailability.isPending}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
