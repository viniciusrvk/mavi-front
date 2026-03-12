import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Users,
  MoreHorizontal,
  Edit,
  UserX,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/api/useUsers";
import {
  PageHeader,
  SearchInput,
  EmptyState,
  LoadingSpinner,
  ConfirmDialog,
  ErrorState,
} from "@/components/common";
import { getInitials } from "@/lib/formatters";
import { ROLE_LABELS } from "@/lib/permissions";
import { userCreateSchema, type UserCreateFormData } from "@/lib/schemas";
import { useAuth } from "@/contexts/AuthContext";
import type { AppUserResponse, UserRole } from "@/types/api";

const ROLE_BADGE_VARIANT: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
  ADMIN: "destructive",
  OWNER: "default",
  EMPLOYEE: "secondary",
  CLIENT: "outline",
};

export default function UsersPage(): JSX.Element {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUserResponse | null>(null);
  const [toggleUserId, setToggleUserId] = useState<AppUserResponse | null>(null);

  const form = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { name: "", email: "", role: "" },
  });

  const { data: users, isLoading, isError, error } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const isEditing = !!editingUser;

  const availableRoles: UserRole[] = currentUser?.role === "ADMIN"
    ? ["ADMIN", "OWNER", "EMPLOYEE", "CLIENT"]
    : ["OWNER", "EMPLOYEE", "CLIENT"];

  const openCreateDialog = (): void => {
    setEditingUser(null);
    form.reset({ name: "", email: "", role: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: AppUserResponse): void => {
    setEditingUser(user);
    form.reset({ name: user.name, email: user.email, role: user.role });
    setIsDialogOpen(true);
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setEditingUser(null);
    form.reset({ name: "", email: "", role: "" });
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleSubmit = (data: UserCreateFormData): void => {
    if (isEditing && editingUser) {
      updateUser.mutate(
        { id: editingUser.id, data: { name: data.name, email: data.email, role: data.role } },
        { onSuccess: closeDialog }
      );
    } else {
      createUser.mutate(data, { onSuccess: closeDialog });
    }
  };

  const handleToggleActive = (): void => {
    if (toggleUserId) {
      if (toggleUserId.active) {
        deleteUser.mutate(toggleUserId.id, { onSuccess: () => setToggleUserId(null) });
      } else {
        updateUser.mutate(
          { id: toggleUserId.id, data: { active: true } },
          { onSuccess: () => setToggleUserId(null) }
        );
      }
    }
  };

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />;
  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar usuários"
        description={error?.message || "Ocorreu um erro inesperado."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários do sistema"
        action={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Atualize os dados do usuário."
                : "Cadastre um novo usuário. A senha padrão será MudarSenha."}
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  disabled={createUser.isPending || updateUser.isPending}
                >
                  {createUser.isPending || updateUser.isPending
                    ? isEditing ? "Salvando..." : "Criando..."
                    : isEditing ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar por nome ou e-mail..."
      />

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum usuário encontrado"
          description={searchQuery ? "Tente uma busca diferente" : "Cadastre usuários para começar"}
        />
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={ROLE_BADGE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                        {!u.active && <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>}
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
                      <DropdownMenuItem onClick={() => openEditDialog(u)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setToggleUserId(u)}>
                        {u.active ? (
                          <><UserX className="mr-2 h-4 w-4" />Desativar</>
                        ) : (
                          <><UserCheck className="mr-2 h-4 w-4" />Ativar</>
                        )}
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
                  <TableHead>Usuário</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className={!u.active ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_BADGE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? "default" : "outline"}>
                        {u.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(u)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToggleUserId(u)}>
                            {u.active ? (
                              <><UserX className="mr-2 h-4 w-4" />Desativar</>
                            ) : (
                              <><UserCheck className="mr-2 h-4 w-4" />Ativar</>
                            )}
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
        open={!!toggleUserId}
        onOpenChange={(open) => !open && setToggleUserId(null)}
        title={toggleUserId?.active ? "Desativar usuário" : "Ativar usuário"}
        description={
          toggleUserId?.active
            ? "Tem certeza que deseja desativar este usuário? Ele não poderá mais acessar o sistema."
            : "Deseja reativar este usuário?"
        }
        confirmText={toggleUserId?.active ? "Desativar" : "Ativar"}
        onConfirm={handleToggleActive}
        variant={toggleUserId?.active ? "destructive" : "default"}
        isLoading={deleteUser.isPending || updateUser.isPending}
      />
    </div>
  );
}
