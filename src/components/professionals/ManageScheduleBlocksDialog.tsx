import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import {
  useScheduleBlocks,
  useCreateScheduleBlock,
  useDeleteScheduleBlock,
} from "@/hooks/api/useScheduleBlocks";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { scheduleBlockSchema, type ScheduleBlockFormData } from "@/lib/schemas";

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

  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);

  const form = useForm<ScheduleBlockFormData>({
    resolver: zodResolver(scheduleBlockSchema),
    defaultValues: { startTime: "", endTime: "", reason: "" },
  });

  const handleCreate = (data: ScheduleBlockFormData) => {
    if (!professionalId) return;
    createBlock.mutate(
      {
        professionalId,
        data: {
          startTime: data.startTime.length === 16 ? `${data.startTime}:00` : data.startTime,
          endTime: data.endTime.length === 16 ? `${data.endTime}:00` : data.endTime,
          reason: data.reason || undefined,
        },
      },
      {
        onSuccess: () => {
          form.reset({ startTime: "", endTime: "", reason: "" });
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {sortedBlocks.map((block) => (
                  <div key={block.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Início: </span>
                          <span className="font-medium">{formatDateTime(block.startTime)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Fim: </span>
                          <span className="font-medium">{formatDateTime(block.endTime)}</span>
                        </div>
                        {block.reason && (
                          <p className="text-sm text-muted-foreground truncate">{block.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setDeleteBlockId(block.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden md:block">
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
              </div>
            </>
          )}

          {/* Create block form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="border-t pt-4 space-y-3">
              <FormLabel className="text-sm font-medium">Novo Bloqueio</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Início</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Fim</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Motivo (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={createBlock.isPending}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Criar Bloqueio
              </Button>
            </form>
          </Form>
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
