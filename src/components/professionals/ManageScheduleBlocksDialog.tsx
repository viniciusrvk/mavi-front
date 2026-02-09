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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import {
  useScheduleBlocks,
  useCreateScheduleBlock,
  useDeleteScheduleBlock,
} from "@/hooks/api/useScheduleBlocks";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface ManageScheduleBlocksDialogProps {
  professionalId: string | null;
  professionalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageScheduleBlocksDialog({
  professionalId,
  professionalName,
  open,
  onOpenChange,
}: ManageScheduleBlocksDialogProps) {
  const { data: blocks = [], isLoading } = useScheduleBlocks(professionalId);
  const createBlock = useCreateScheduleBlock();
  const deleteBlock = useDeleteScheduleBlock();

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!professionalId || !startTime || !endTime) return;
    createBlock.mutate(
      {
        professionalId,
        data: {
          startTime: startTime.length === 16 ? `${startTime}:00` : startTime,
          endTime: endTime.length === 16 ? `${endTime}:00` : endTime,
          reason: reason || undefined,
        },
      },
      {
        onSuccess: () => {
          setStartTime("");
          setEndTime("");
          setReason("");
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!professionalId || !deleteBlockId) return;
    deleteBlock.mutate(
      { professionalId, blockId: deleteBlockId },
      { onSuccess: () => setDeleteBlockId(null) }
    );
  };

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sort blocks: future first, then past
  const sortedBlocks = [...blocks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Bloqueios de Agenda — {professionalName}
            </DialogTitle>
            <DialogDescription>
              Bloqueie períodos em que o profissional não estará disponível para
              atendimento.
            </DialogDescription>
          </DialogHeader>

          {/* Block list */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : sortedBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum bloqueio cadastrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBlocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(block.startTime)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(block.endTime)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {block.reason || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteBlockId(block.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Create block form */}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-medium">Novo Bloqueio</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Início</Label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fim</Label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <Input
              placeholder="Motivo (opcional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              onClick={handleCreate}
              disabled={!startTime || !endTime || createBlock.isPending}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar Bloqueio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteBlockId}
        onOpenChange={(open) => !open && setDeleteBlockId(null)}
        title="Excluir bloqueio"
        description="Deseja remover este bloqueio de agenda?"
        onConfirm={handleConfirmDelete}
        isLoading={deleteBlock.isPending}
      />
    </>
  );
}
