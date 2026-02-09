import { useState, useEffect } from "react";
import { Clock, Bell, Palette, Globe, Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import { useSlotRule, useCreateSlotRule, useUpdateSlotRule } from "@/hooks/api/useSlotRules";
import { LoadingSpinner } from "@/components/common";
import type { SlotMode } from "@/types/api";

export default function SettingsPage() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || null;
  const { data: slotRule, isLoading: loadingRule } = useSlotRule(tenantId);
  const createSlotRule = useCreateSlotRule();
  const updateSlotRule = useUpdateSlotRule();

  const isSaving = createSlotRule.isPending || updateSlotRule.isPending;

  const [mode, setMode] = useState<SlotMode>("INTERVAL");
  const [intervalMinutes, setIntervalMinutes] = useState("30");
  const [bufferMinutes, setBufferMinutes] = useState("0");
  const [fixedTimes, setFixedTimes] = useState<string[]>([]);
  const [newFixedTime, setNewFixedTime] = useState("09:00");

  // Populate state from loaded slot rule
  useEffect(() => {
    if (slotRule) {
      setMode(slotRule.mode);
      setIntervalMinutes(String(slotRule.intervalMinutes || 30));
      setBufferMinutes(String(slotRule.bufferBetweenServicesMinutes || 0));
      setFixedTimes(slotRule.fixedTimes || []);
    }
  }, [slotRule]);

  const handleSaveSlotRules = () => {
    if (!tenantId) return;
    const data = {
      mode,
      intervalMinutes: mode === "INTERVAL" ? Number(intervalMinutes) : undefined,
      bufferBetweenServicesMinutes: Number(bufferMinutes) || undefined,
      fixedTimes: mode === "FIXED" ? fixedTimes : undefined,
    };

    if (slotRule?.id) {
      updateSlotRule.mutate({ tenantId, ruleId: slotRule.id, data });
    } else {
      createSlotRule.mutate({ tenantId, data });
    }
  };

  const addFixedTime = () => {
    if (newFixedTime && !fixedTimes.includes(newFixedTime) && fixedTimes.length < 10) {
      setFixedTimes([...fixedTimes, newFixedTime].sort());
    }
  };

  const removeFixedTime = (time: string) => {
    setFixedTimes(fixedTimes.filter((t) => t !== time));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <div className="grid gap-6">
        {/* Slot Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Regras de Horários
            </CardTitle>
            <CardDescription>
              Configure como os horários disponíveis são calculados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRule ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Modo de Slots</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as SlotMode)}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Horários Fixos</SelectItem>
                      <SelectItem value="INTERVAL">Intervalos Regulares</SelectItem>
                      <SelectItem value="SERVICE_DURATION">Baseado na Duração do Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Define como os horários disponíveis são apresentados aos clientes
                  </p>
                </div>

                {mode === "INTERVAL" && (
                  <div className="grid gap-2">
                    <Label>Intervalo entre Slots (minutos)</Label>
                    <Select value={intervalMinutes} onValueChange={setIntervalMinutes}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {mode === "FIXED" && (
                  <div className="grid gap-2">
                    <Label>Horários Fixos</Label>
                    <div className="flex flex-wrap gap-2">
                      {fixedTimes.map((time) => (
                        <div
                          key={time}
                          className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                        >
                          {time}
                          <button
                            onClick={() => removeFixedTime(time)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={newFixedTime}
                        onChange={(e) => setNewFixedTime(e.target.value)}
                        className="w-32"
                      />
                      <Button variant="outline" size="sm" onClick={addFixedTime} disabled={fixedTimes.length >= 10}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Defina os horários exatos em que os slots estarão disponíveis (máximo 10)
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Buffer entre Serviços (minutos)</Label>
                  <Select value={bufferMinutes} onValueChange={setBufferMinutes}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem intervalo</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Tempo de descanso entre um atendimento e outro
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSlotRules}
                    disabled={isSaving}
                  >
                    {isSaving ? "Salvando..." : slotRule?.id ? "Atualizar Regras" : "Salvar Regras"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure as notificações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificar novos agendamentos</Label>
                <p className="text-xs text-muted-foreground">
                  Receba uma notificação quando um cliente agendar
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembrete de agendamento</Label>
                <p className="text-xs text-muted-foreground">
                  Envie lembretes automáticos para os clientes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificar cancelamentos</Label>
                <p className="text-xs text-muted-foreground">
                  Receba alertas quando um agendamento for cancelado
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize a aparência do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Tema</Label>
              <Select defaultValue="light">
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Locale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localização
            </CardTitle>
            <CardDescription>
              Configure idioma e fuso horário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Idioma</Label>
              <Select defaultValue="pt-BR">
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Fuso Horário</Label>
              <Select defaultValue={currentTenant?.timezone || "America/Sao_Paulo"}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                  <SelectItem value="America/Noronha">Fernando de Noronha (UTC-2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => {}}>
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
