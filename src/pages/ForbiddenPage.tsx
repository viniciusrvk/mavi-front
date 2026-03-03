import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <h1 className="text-6xl font-bold text-destructive">403</h1>
      <h2 className="text-2xl font-semibold">Acesso Negado</h2>
      <p className="text-muted-foreground max-w-md">
        Você não tem permissão para acessar esta página.
      </p>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        <Button onClick={() => navigate('/')}>Ir para início</Button>
      </div>
    </div>
  );
}
