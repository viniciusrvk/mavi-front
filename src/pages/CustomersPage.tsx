import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Users, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Phone
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/api/useCustomers";
import { PageHeader, SearchInput, EmptyState, LoadingSpinner, ConfirmDialog, ErrorState } from "@/components/common";
import { getInitials, formatPhone, formatCPF } from "@/lib/formatters";
import { customerCreateSchema, type CustomerCreateFormData } from "@/lib/schemas";
import type { Customer } from "@/types/api";

export default function CustomersPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);

  const form = useForm<CustomerCreateFormData>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: { name: "", phone: "", cpf: "", nickname: "", birthDate: "" },
  });

  const { data: customers, isLoading, isError, error } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const isEditing = !!editingCustomer;

  const openCreateDialog = (): void => {
    setEditingCustomer(null);
    form.reset({ name: "", phone: "", cpf: "", nickname: "", birthDate: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (customer: Customer): void => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      phone: customer.phone,
      cpf: customer.cpf,
      nickname: customer.nickname || "",
      birthDate: customer.birthDate || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    form.reset({ name: "", phone: "", cpf: "", nickname: "", birthDate: "" });
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.cpf.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const handleSubmit = (data: CustomerCreateFormData): void => {
    if (isEditing && editingCustomer) {
      updateCustomer.mutate(
        {
          id: editingCustomer.id,
          data: {
            name: data.name,
            phone: data.phone,
            nickname: data.nickname || undefined,
            birthDate: data.birthDate || undefined,
          },
        },
        { onSuccess: closeDialog }
      );
    } else {
      createCustomer.mutate(
        {
          name: data.name,
          phone: data.phone,
          cpf: data.cpf,
          nickname: data.nickname || undefined,
          birthDate: data.birthDate || undefined,
        },
        { onSuccess: closeDialog }
      );
    }
  };

  const handleDelete = (): void => {
    if (deleteCustomerId) {
      deleteCustomer.mutate(deleteCustomerId, {
        onSuccess: () => setDeleteCustomerId(null),
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar clientes"
        description={error?.message || "Ocorreu um erro inesperado."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes do estabelecimento"
        action={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Atualize os dados do cliente." : "Cadastre um novo cliente."}
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
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="11999999999"
                        maxLength={11}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      CPF {isEditing && <span className="text-muted-foreground text-xs">(não editável)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12345678901"
                        maxLength={11}
                        disabled={isEditing}
                        className={isEditing ? "bg-muted" : ""}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apelido <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Como o cliente gosta de ser chamado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomer.isPending || updateCustomer.isPending}
                >
                  {(createCustomer.isPending || updateCustomer.isPending)
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
        placeholder="Buscar por nome, telefone ou CPF..."
      />

      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={searchQuery ? "Tente uma busca diferente" : "Cadastre clientes para começar"}
        />
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="space-y-3 md:hidden">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatPhone(customer.phone)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        CPF: {formatCPF(customer.cpf)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" aria-label="Ações">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteCustomerId(customer.id)}
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Cliente desde</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{formatPhone(customer.phone)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCPF(customer.cpf)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteCustomerId(customer.id)}
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
        open={!!deleteCustomerId}
        onOpenChange={(open) => !open && setDeleteCustomerId(null)}
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteCustomer.isPending}
      />
    </div>
  );
}
