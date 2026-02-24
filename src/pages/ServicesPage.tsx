import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Scissors, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Clock,
  DollarSign,
  Users
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/api/useServices";
import { PageHeader, SearchInput, EmptyState, LoadingSpinner, ConfirmDialog, ErrorState } from "@/components/common";
import { formatDuration, formatCurrency } from "@/lib/formatters";
import { serviceSchema, type ServiceFormData } from "@/lib/schemas";
import type { Service } from "@/types/api";

export default function ServicesPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", durationMinutes: 30, price: 0 },
  });

  const { data: services, isLoading, isError, error } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const isEditing = !!editingService;

  const openCreateDialog = (): void => {
    setEditingService(null);
    form.reset({ name: "", durationMinutes: 30, price: 0 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service): void => {
    setEditingService(service);
    form.reset({ name: service.name, durationMinutes: service.durationMinutes, price: service.price });
    setIsDialogOpen(true);
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setEditingService(null);
    form.reset({ name: "", durationMinutes: 30, price: 0 });
  };

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter((service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  const handleSubmit = (data: ServiceFormData): void => {
    if (isEditing && editingService) {
      updateService.mutate(
        { id: editingService.id, data: { name: data.name, durationMinutes: data.durationMinutes, price: data.price } },
        { onSuccess: closeDialog }
      );
    } else {
      createService.mutate(
        { name: data.name, durationMinutes: data.durationMinutes, price: data.price },
        { onSuccess: closeDialog }
      );
    }
  };

  const handleDelete = (): void => {
    if (deleteServiceId) {
      deleteService.mutate(deleteServiceId, {
        onSuccess: () => setDeleteServiceId(null),
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar serviços"
        description={error?.message || "Ocorreu um erro inesperado."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Gerencie os serviços oferecidos"
        action={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Atualize os dados do serviço." : "Adicione um novo serviço ao catálogo."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do serviço" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (min)</FormLabel>
                      <FormControl>
                        <Input type="number" min={5} step={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={0.01} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createService.isPending || updateService.isPending}
                >
                  {(createService.isPending || updateService.isPending)
                    ? (isEditing ? "Salvando..." : "Criando...")
                    : (isEditing ? "Salvar" : "Criar")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar serviços..."
      />

      {filteredServices.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum serviço encontrado"
          description={searchQuery ? "Tente uma busca diferente" : "Adicione serviços para começar"}
        />
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="space-y-3 md:hidden">
            {filteredServices.map((service) => (
              <Card key={service.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Scissors className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{service.name}</p>
                        <Badge variant={service.active ? "default" : "secondary"} className="shrink-0">
                          {service.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(service.durationMinutes)}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-primary" />
                          {formatCurrency(service.price)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {service.professionalsCount ?? 0} prof.
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" aria-label="Ações">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(service)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteServiceId(service.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Profissionais</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Scissors className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(service.durationMinutes)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>{formatCurrency(service.price)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{service.professionalsCount ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.active ? "default" : "secondary"}>
                        {service.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteServiceId(service.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={!!deleteServiceId}
        onOpenChange={(open) => !open && setDeleteServiceId(null)}
        title="Excluir serviço"
        description="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteService.isPending}
      />
    </div>
  );
}
