import { Building2, ChevronDown, Plus, AlertCircle, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function TenantSelector() {
  const { currentTenant, setCurrentTenant, tenants, isLoading, error, refreshTenants } = useTenant();
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await refreshTenants();
    setIsRetrying(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-input bg-card p-2">
        <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-destructive font-medium">Erro ao carregar</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleRetry}
          disabled={isRetrying}
        >
          <RefreshCw className={`h-3 w-3 ${isRetrying ? "animate-spin" : ""}`} />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between gap-2 h-auto py-2"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium leading-none">
                {currentTenant?.name || "Selecione"}
              </p>
              {currentTenant && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentTenant.slug}
                </p>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Estabelecimentos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            Nenhum estabelecimento
          </DropdownMenuItem>
        ) : (
          tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => setCurrentTenant(tenant)}
              className={currentTenant?.id === tenant.id ? "bg-accent" : ""}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <div>
                <p className="font-medium">{tenant.name}</p>
                <p className="text-xs text-muted-foreground">{tenant.slug}</p>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/tenants/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Estabelecimento
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
