import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground mt-2">Página não encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          A página que você está procurando não existe ou foi movida.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Voltar ao Início</Link>
      </Button>
    </div>
  );
};

export default NotFound;
