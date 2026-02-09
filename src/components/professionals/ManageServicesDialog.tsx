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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit, Check, X } from "lucide-react";
import { useServices } from "@/hooks/api";
import {
  useProfessionalServices,
  useAssignService,
  useUpdateServiceAssignment,
  useUnassignService,
} from "@/hooks/api/useProfessionalServices";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface ManageServicesDialogProps {
  professionalId: string | null;
  professionalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageServicesDialog({
  professionalId,
  professionalName,
  open,
  onOpenChange,
}: ManageServicesDialogProps) {
  const { data: professionalServices = [], isLoading } =
    useProfessionalServices(professionalId);
  const { data: allServices = [] } = useServices();
  const assignService = useAssignService();
  const updateAssignment = useUpdateServiceAssignment();
  const unassignService = useUnassignService();

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  // Filter services not yet assigned
  const assignedServiceIds = new Set(
    professionalServices.map((ps) => ps.serviceId)
  );
  const availableServices = allServices.filter(
    (s) => s.active && !assignedServiceIds.has(s.id)
  );

  const handleAssign = () => {
    if (!professionalId || !selectedServiceId) return;
    assignService.mutate(
      {
        professionalId,
        data: {
          serviceId: selectedServiceId,
          customPrice: customPrice ? Number(customPrice) : undefined,
          customDurationMinutes: customDuration
            ? Number(customDuration)
            : undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedServiceId("");
          setCustomPrice("");
          setCustomDuration("");
        },
      }
    );
  };

  const handleStartEdit = (ps: typeof professionalServices[0]) => {
    setEditingServiceId(ps.serviceId);
    setEditPrice(ps.hasCustomPrice ? String(ps.effectivePrice) : "");
    setEditDuration(
      ps.hasCustomDuration ? String(ps.effectiveDurationMinutes) : ""
    );
  };

  const handleSaveEdit = (serviceId: string) => {
    if (!professionalId) return;
    updateAssignment.mutate(
      {
        professionalId,
        serviceId,
        data: {
          customPrice: editPrice ? Number(editPrice) : undefined,
          customDurationMinutes: editDuration
            ? Number(editDuration)
            : undefined,
        },
      },
      {
        onSuccess: () => setEditingServiceId(null),
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!professionalId || !deleteServiceId) return;
    unassignService.mutate(
      { professionalId, serviceId: deleteServiceId },
      { onSuccess: () => setDeleteServiceId(null) }
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Serviços — {professionalName}</DialogTitle>
            <DialogDescription>
              Associe, edite ou remova serviços deste profissional.
            </DialogDescription>
          </DialogHeader>

          {/* Assigned services */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : professionalServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço associado. Adicione abaixo.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionalServices.map((ps) => (
                  <TableRow key={ps.serviceId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ps.serviceName}
                        {(ps.hasCustomPrice || ps.hasCustomDuration) && (
                          <Badge variant="secondary" className="text-xs">
                            Personalizado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingServiceId === ps.serviceId ? (
                        <Input
                          type="number"
                          placeholder={String(ps.basePrice)}
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 ml-auto"
                          step="0.01"
                        />
                      ) : (
                        <span>
                          {formatCurrency(ps.effectivePrice)}
                          {ps.hasCustomPrice && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (base: {formatCurrency(ps.basePrice)})
                            </span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingServiceId === ps.serviceId ? (
                        <Input
                          type="number"
                          placeholder={String(ps.baseDurationMinutes)}
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          className="w-20 ml-auto"
                        />
                      ) : (
                        <span>
                          {ps.effectiveDurationMinutes}min
                          {ps.hasCustomDuration && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (base: {ps.baseDurationMinutes}min)
                            </span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {editingServiceId === ps.serviceId ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(ps.serviceId)}
                              disabled={updateAssignment.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingServiceId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEdit(ps)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteServiceId(ps.serviceId)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Add service section */}
          {availableServices.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-medium">Adicionar Serviço</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar serviço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Preço custom (opc.)"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  step="0.01"
                />
                <Input
                  type="number"
                  placeholder="Duração custom (opc.)"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAssign}
                disabled={!selectedServiceId || assignService.isPending}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Associar Serviço
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteServiceId}
        onOpenChange={(open) => !open && setDeleteServiceId(null)}
        title="Desassociar serviço"
        description="Deseja remover este serviço do profissional? Os agendamentos existentes não serão afetados."
        onConfirm={handleConfirmDelete}
        isLoading={unassignService.isPending}
      />
    </>
  );
}
