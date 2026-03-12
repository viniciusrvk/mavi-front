import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppUserResponse, CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(): ReturnType<typeof useQuery<AppUserResponse[], Error>> {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => api.getUsers(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUser(id: string): ReturnType<typeof useQuery<AppUserResponse, Error>> {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => api.getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser(): ReturnType<typeof useMutation<AppUserResponse, Error, CreateUserRequest>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => api.createUser(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast({
        title: "Usuário cadastrado!",
        description: `${data.name} foi adicionado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar usuário",
        description: error.message,
      });
    },
  });
}

export function useUpdateUser(): ReturnType<typeof useMutation<AppUserResponse, Error, { id: string; data: UpdateUserRequest }>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) => api.updateUser(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      toast({
        title: "Usuário atualizado!",
        description: `${data.name} foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error.message,
      });
    },
  });
}

export function useDeleteUser(): ReturnType<typeof useMutation<void, Error, string>> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast({
        title: "Usuário desativado!",
        description: "O usuário foi desativado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao desativar usuário",
        description: error.message,
      });
    },
  });
}

export function useChangePassword(): ReturnType<typeof useMutation<void, Error, ChangePasswordRequest>> {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => api.changePassword(data),
    onSuccess: () => {
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message,
      });
    },
  });
}
