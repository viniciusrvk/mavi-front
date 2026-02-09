import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = "Erro ao carregar dados",
  description = "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
  onRetry,
  isRetrying = false,
}: ErrorStateProps): JSX.Element {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-center mt-1 max-w-md">{description}</p>
        {onRetry && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Tentando..." : "Tentar novamente"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
