import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Building2, Clock, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useTenant } from "@/contexts/TenantContext";
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant } from "@/hooks/api/useTenants";
import { PageHeader, SearchInput, EmptyState, ErrorState, LoadingSpinner, ConfirmDialog } from "@/components/common";
import { tenantCreateSchema, type TenantCreateFormData } from "@/lib/schemas";
import type { Tenant } from "@/types/api";

export default function TenantsPage(): JSX.Element {
  const { setCurrentTenant, currentTenant } = useTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);

  const defaultValues: TenantCreateFormData = { name: "", slug: "", openTime: "08:00", closeTime: "18:00", taxId: "" };

  const form = useForm<TenantCreateFormData>({
    resolver: zodResolver(tenantCreateSchema),
    defaultValues,
  });

  const { data: tenants, isLoading, isError, error } = useTenants();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

  const isEditing = !!editingTenant;

  const openCreateDialog = (): void => {
    setEditingTenant(null);
    form.reset(defaultValues);
    setIsDialogOpen(true);
  };

  const openEditDialog = (tenant: Tenant): void => {
    setEditingTenant(tenant);
    form.reset({ 
      name: tenant.name, 
      slug: tenant.slug, 
      openTime: tenant.openTime, 
      closeTime: tenant.closeTime, 
      taxId: tenant.taxId || "" 
    });
    setIsDialogOpen(true);
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setEditingTenant(null);
    form.reset(defaultValues);
  };

  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    return tenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tenants, searchQuery]);

  const handleSubmit = (data: TenantCreateFormData): void => {
    if (isEditing && editingTenant) {
      updateTenant.mutate(
        { 
          id: editingTenant.id, 
          data: { 
            name: data.name, 
            openTime: data.openTime, 
            closeTime: data.closeTime, 
            taxId: data.taxId || undefined 
          } 
        },
        { onSuccess: closeDialog }
      );
    } else {
      createTenant.mutate(
        {
          name: data.name,
          slug: data.slug,
          openTime: data.openTime,
          closeTime: data.closeTime,
          taxId: data.taxId || undefined,
        },
        { onSuccess: closeDialog }
      );
    }
  };

  const handleSelectTenant = (tenant: Tenant): void => {
    setCurrentTenant(tenant);
  };

  const handleDelete = (): void => {
    if (deleteTenantId) {
      deleteTenant.mutate(deleteTenantId, {
        onSuccess: () => setDeleteTenantId(null),
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Estabelecimentos"
          description="Gerencie os estabelecimentos do sistema"
        />
        <ErrorState
          title="Erro ao carregar estabelecimentos"
          description={error?.message || "Ocorreu um erro ao carregar os estabelecimentos. Por favor, tente novamente."}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estabelecimentos"
        description="Gerencie os estabelecimentos do sistema"
        action={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Estabelecimento
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Estabelecimento" : "Novo Estabelecimento"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Atualize os dados do estabelecimento." : "Crie um novo estabelecimento para gerenciar agendamentos."}
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
                      <Input placeholder="Salão da Maria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Slug (URL) {isEditing && <span className="text-muted-foreground text-xs">(não editável)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="salao-da-maria"
                        disabled={isEditing}
                        className={isEditing ? "bg-muted" : ""}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0001-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="openTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abertura</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="closeTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fechamento</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                  disabled={createTenant.isPending || updateTenant.isPending}
                >
                  {(createTenant.isPending || updateTenant.isPending)
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
        placeholder="Buscar estabelecimentos..."
      />

      {filteredTenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum estabelecimento encontrado"
          description={searchQuery ? "Tente uma busca diferente" : "Crie seu primeiro estabelecimento para começar"}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.map((tenant) => (
            <Card 
              key={tenant.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                currentTenant?.id === tenant.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectTenant(tenant)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tenant.name}</CardTitle>
                      <CardDescription>{tenant.slug}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(tenant); }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTenantId(tenant.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{tenant.openTime} - {tenant.closeTime}</span>
                  </div>
                  <Badge variant={tenant.active ? "default" : "secondary"}>
                    {tenant.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {tenant.taxId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    CNPJ: {tenant.taxId}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTenantId}
        onOpenChange={(open) => !open && setDeleteTenantId(null)}
        title="Excluir estabelecimento"
        description="Tem certeza que deseja excluir este estabelecimento? Esta ação não pode ser desfeita e todos os dados associados serão perdidos."
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteTenant.isPending}
      />
    </div>
  );
}
