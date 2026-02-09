import { useState, useMemo } from "react";
import { 
  Plus, 
  Users, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Phone,
  Calendar as CalendarIcon
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
import { Label } from "@/components/ui/label";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/api/useCustomers";
import { PageHeader, SearchInput, EmptyState, LoadingSpinner, ConfirmDialog } from "@/components/common";
import type { Customer } from "@/types/api";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

function formatCPF(cpf: string): string {
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
}

export default function CustomersPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    cpf: "",
    nickname: "",
    birthDate: "",
  });

  const { data: customers, isLoading, isError, error } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const isEditing = !!editingCustomer;

  const openCreateDialog = (): void => {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", cpf: "", nickname: "", birthDate: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (customer: Customer): void => {
    setEditingCustomer(customer);
    setFormData({
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
    setFormData({ name: "", phone: "", cpf: "", nickname: "", birthDate: "" });
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.cpf.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const handleSubmit = (): void => {
    if (isEditing && editingCustomer) {
      updateCustomer.mutate(
        {
          id: editingCustomer.id,
          data: {
            name: formData.name,
            phone: formData.phone,
            nickname: formData.nickname || undefined,
            birthDate: formData.birthDate || undefined,
          },
        },
        { onSuccess: closeDialog }
      );
    } else {
      createCustomer.mutate(
        {
          name: formData.name,
          phone: formData.phone,
          cpf: formData.cpf,
          nickname: formData.nickname || undefined,
          birthDate: formData.birthDate || undefined,
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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Users className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Erro ao carregar clientes</h2>
          <p className="text-muted-foreground mt-1">{error?.message}</p>
        </div>
      </div>
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
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="11999999999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                maxLength={11}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF {isEditing && <span className="text-muted-foreground text-xs">(não editável)</span>}</Label>
              <Input
                id="cpf"
                placeholder="12345678901"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                maxLength={11}
                disabled={isEditing}
                className={isEditing ? "bg-muted" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nickname">Apelido <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                id="nickname"
                placeholder="Como o cliente gosta de ser chamado"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthDate">Data de Nascimento <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || formData.phone.length !== 11 || (!isEditing && formData.cpf.length !== 11) || createCustomer.isPending || updateCustomer.isPending}
            >
              {(createCustomer.isPending || updateCustomer.isPending)
                ? (isEditing ? "Salvando..." : "Criando...")
                : (isEditing ? "Salvar" : "Criar")}
            </Button>
          </DialogFooter>
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
        <Card>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Ver Agendamentos
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
