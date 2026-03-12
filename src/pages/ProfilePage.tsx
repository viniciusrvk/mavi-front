import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, User as UserIcon, KeyRound } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useChangePassword } from "@/hooks/api/useUsers";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/schemas";
import { ROLE_LABELS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInitials } from "@/lib/formatters";
import { PageHeader } from "@/components/common";

export default function ProfilePage() {
  const { user } = useAuth();
  const changePassword = useChangePassword();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setError(null);
      setSuccess(false);
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword || undefined,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      form.reset();
    } catch (err) {
      setError("Erro ao alterar a senha. Verifique a senha atual.");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Meu Perfil" description="Visualize seus dados e altere sua senha" />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do usuário */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Informações</CardTitle>
            </div>
            <CardDescription>Seus dados pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Perfil</span>
                <Badge>{ROLE_LABELS[user.role]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">E-mail</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alteração de senha */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Alterar Senha</CardTitle>
            </div>
            <CardDescription>Atualize sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertDescription>Senha alterada com sucesso!</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Digite sua senha atual"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Repita a nova senha"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {changePassword.isPending ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
