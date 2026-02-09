import { useState, useMemo } from "react";
import { 
  Plus, 
  UserCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  Scissors,
  CalendarX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useProfessionals, useCreateProfessional, useUpdateProfessional, useDeleteProfessional } from "@/hooks/api/useProfessionals";
import { PageHeader, SearchInput, EmptyState, LoadingSpinner, ConfirmDialog } from "@/components/common";
import { ManageServicesDialog } from "@/components/professionals/ManageServicesDialog";
import { ManageAvailabilityDialog } from "@/components/professionals/ManageAvailabilityDialog";
import { ManageScheduleBlocksDialog } from "@/components/professionals/ManageScheduleBlocksDialog";
import type { Professional } from "@/types/api";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfessionalsPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [deleteProfessionalId, setDeleteProfessionalId] = useState<string | null>(null);
  const [manageServicesProfId, setManageServicesProfId] = useState<string | null>(null);
  const [manageAvailabilityProfId, setManageAvailabilityProfId] = useState<string | null>(null);
  const [manageBlocksProfId, setManageBlocksProfId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { data: professionals, isLoading, isError, error } = useProfessionals();
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();
  const deleteProfessional = useDeleteProfessional();

  const isEditing = !!editingProfessional;

  const openCreateDialog = (): void => {
    setEditingProfessional(null);
    setFormData({ name: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (professional: Professional): void => {
    setEditingProfessional(professional);
    setFormData({ name: professional.name });
    setIsDialogOpen(true);
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setEditingProfessional(null);
    setFormData({ name: "" });
  };

  const filteredProfessionals = useMemo(() => {
    if (!professionals) return [];
    return professionals.filter((professional) =>
      professional.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [professionals, searchQuery]);

  const handleSubmit = (): void => {
    if (isEditing && editingProfessional) {
      updateProfessional.mutate(
        { id: editingProfessional.id, data: { name: formData.name } },
        { onSuccess: closeDialog }
      );
    } else {
      createProfessional.mutate(
        { name: formData.name },
        { onSuccess: closeDialog }
      );
    }
  };

  const handleDelete = (): void => {
    if (deleteProfessionalId) {
      deleteProfessional.mutate(deleteProfessionalId, {
        onSuccess: () => setDeleteProfessionalId(null),
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <UserCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Erro ao carregar profissionais</h2>
          <p className="text-muted-foreground mt-1">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profissionais"
        description="Gerencie os profissionais do estabelecimento"
        action={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Atualize os dados do profissional." : "Adicione um novo profissional ao estabelecimento."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome do profissional"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || createProfessional.isPending || updateProfessional.isPending}
            >
              {(createProfessional.isPending || updateProfessional.isPending) 
                ? (isEditing ? "Salvando..." : "Criando...") 
                : (isEditing ? "Salvar" : "Criar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar profissionais..."
      />

      {filteredProfessionals.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Nenhum profissional encontrado"
          description={searchQuery ? "Tente uma busca diferente" : "Adicione profissionais para começar"}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfessionals.map((professional) => (
            <Card key={professional.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(professional.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{professional.name}</CardTitle>
                      <Badge 
                        variant={professional.active ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {professional.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(professional)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setManageServicesProfId(professional.id)}>
                        <Scissors className="mr-2 h-4 w-4" />
                        Gerenciar Serviços
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setManageAvailabilityProfId(professional.id)}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Disponibilidade
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setManageBlocksProfId(professional.id)}>
                        <CalendarX className="mr-2 h-4 w-4" />
                        Bloqueios
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteProfessionalId(professional.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  ID: {professional.id.slice(0, 8)}...
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteProfessionalId}
        onOpenChange={(open) => !open && setDeleteProfessionalId(null)}
        title="Excluir profissional"
        description="Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteProfessional.isPending}
      />

      <ManageServicesDialog
        professionalId={manageServicesProfId}
        professionalName={professionals?.find(p => p.id === manageServicesProfId)?.name || ""}
        open={!!manageServicesProfId}
        onOpenChange={(open) => !open && setManageServicesProfId(null)}
      />

      <ManageAvailabilityDialog
        professionalId={manageAvailabilityProfId}
        professionalName={professionals?.find(p => p.id === manageAvailabilityProfId)?.name || ""}
        open={!!manageAvailabilityProfId}
        onOpenChange={(open) => !open && setManageAvailabilityProfId(null)}
      />

      <ManageScheduleBlocksDialog
        professionalId={manageBlocksProfId}
        professionalName={professionals?.find(p => p.id === manageBlocksProfId)?.name || ""}
        open={!!manageBlocksProfId}
        onOpenChange={(open) => !open && setManageBlocksProfId(null)}
      />
    </div>
  );
}
