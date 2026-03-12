import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useChangePassword } from "@/hooks/api/useUsers";
import { firstPasswordSchema, type FirstPasswordFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HOME_BY_ROLE } from "@/lib/permissions";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const changePassword = useChangePassword();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FirstPasswordFormData>({
    resolver: zodResolver(firstPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: FirstPasswordFormData) => {
    try {
      setError(null);
      await changePassword.mutateAsync({ newPassword: data.newPassword });
      // Re-login para atualizar o token com mustChangePassword=false
      if (user) {
        try {
          await login(user.email, data.newPassword);
        } catch {
          // Se falhar, faz logout
          logout();
          return;
        }
      }
      navigate(user ? HOME_BY_ROLE[user.role] : "/", { replace: true });
    } catch (err) {
      setError("Erro ao alterar a senha. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Alterar Senha</CardTitle>
          <CardDescription>
            É necessário alterar sua senha no primeiro acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Mínimo 6 caracteres"
                          type={showPassword ? "text" : "password"}
                          autoFocus
                          disabled={isSubmitting}
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Repita a nova senha"
                        type={showPassword ? "text" : "password"}
                        disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
