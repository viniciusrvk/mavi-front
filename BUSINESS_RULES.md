# 📋 Regras de Negócio - Sistema MAVI

Sistema de agendamento multi-tenant para estabelecimentos de serviços (salões de beleza, barbearias, clínicas, etc.).

---

## Índice

1. [Tenant (Inquilino/Estabelecimento)](#1--tenant-inquilinoestabelecimento)
2. [Customer (Cliente)](#2--customer-cliente)
3. [Professional (Profissional)](#3--professional-profissional)
4. [Availability (Disponibilidade)](#4--availability-disponibilidade)
5. [ScheduleBlock (Bloqueio de Agenda)](#5--scheduleblock-bloqueio-de-agenda)
6. [Service (Serviço)](#6--service-serviço)
7. [ProfessionalService (Associação Profissional-Serviço)](#7--professionalservice-associação-profissional-serviço)
8. [Booking (Agendamento)](#8--booking-agendamento)
9. [SlotRules e Políticas de Slots](#9--slotrules-e-políticas-de-slots)
10. [Consulta de Disponibilidade](#10--consulta-de-disponibilidade)
11. [Exceções do Sistema](#11--exceções-do-sistema)
12. [Diagrama de Relacionamentos](#12--diagrama-de-relacionamentos)

---

## 1. 🏢 Tenant (Inquilino/Estabelecimento)

O **Tenant** representa um estabelecimento que utiliza o sistema. Toda a aplicação é multi-tenant, ou seja, cada entidade pertence a um tenant específico.

### 1.1 Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `slug` | String(100) | Sim | Identificador URL-friendly |
| `name` | String(255) | Sim | Nome do estabelecimento |
| `taxId` | String(20) | Não | CNPJ do estabelecimento |
| `openTime` | LocalTime | Sim | Horário de abertura |
| `closeTime` | LocalTime | Sim | Horário de fechamento |
| `timezone` | String(50) | Não | Fuso horário |
| `active` | Boolean | Sim | Status ativo (default: true) |

### 1.2 Validações de Entrada (CreateTenantRequest)

| Campo | Validação | Regex/Regra | Mensagem de Erro |
|-------|-----------|-------------|------------------|
| `slug` | `@NotBlank` | - | "Slug is required" |
| `slug` | `@Pattern` | `^[a-z0-9-]+$` | "Slug must contain only lowercase letters, numbers, and hyphens" |
| `name` | `@NotBlank` | - | "Name is required" |
| `openTime` | `@NotNull` | - | "Open time is required" |
| `closeTime` | `@NotNull` | - | "Close time is required" |

### 1.3 Regras de Negócio

#### RN-T01: Unicidade de Slug
- O `slug` deve ser único entre tenants **ativos**
- **Exceção**: Se já existe um tenant **inativo** com o mesmo slug, o sistema **reativa** o tenant existente e atualiza seus dados

```
Exemplo:
1. Tenant "barbearia-centro" existe com active=false
2. Requisição para criar tenant com slug="barbearia-centro"
3. Sistema REATIVA o tenant existente ao invés de criar novo
```

#### RN-T02: Unicidade de TaxId (CNPJ)
- O `taxId` deve ser único entre tenants **ativos**
- Validação ocorre apenas se `taxId` não for nulo ou vazio

```
Exemplo:
Tenant A: taxId="12345678000199", active=true
Tenant B: taxId="12345678000199" ❌ (CNPJ já existe)
Tenant C: taxId=null ✅ (sem CNPJ é permitido)
```

#### RN-T03: Horário Comercial
- `openTime` e `closeTime` definem o horário de funcionamento
- Agendamentos só podem ser realizados dentro deste período
- O horário de término do serviço não pode ultrapassar o `closeTime`

```
Exemplo:
Tenant: openTime=08:00, closeTime=18:00

✅ Booking 08:00-09:00 → Válido (dentro do horário)
✅ Booking 17:00-18:00 → Válido (termina exatamente no fechamento)
❌ Booking 07:00-08:00 → Inválido (começa antes da abertura)
❌ Booking 17:30-18:30 → Inválido (termina após fechamento)
```

---

## 2. 👤 Customer (Cliente)

O **Customer** representa um cliente do estabelecimento que pode realizar agendamentos.

### 2.1 Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `tenant_id` | FK | Sim | Tenant ao qual pertence |
| `cpf` | String(11) | Sim | CPF do cliente |
| `phone` | String(11) | Sim | Telefone (DDNNNNNNNNN) |
| `name` | String(255) | Sim | Nome completo |
| `nickname` | String(80) | Não | Apelido |
| `birthDate` | LocalDate | Não | Data de nascimento |
| `createdAt` | LocalDateTime | Sim (auto) | Data de criação |
| `active` | Boolean | Sim | Status ativo (default: true) |

### 2.2 Validações de Entrada (CreateCustomerRequest)

| Campo | Validação | Regex/Regra | Mensagem de Erro |
|-------|-----------|-------------|------------------|
| `cpf` | `@NotBlank` | - | "CPF is required" |
| `cpf` | `@Size(max=11)` | - | "CPF must have at most 11 characters" |
| `cpf` | `@Pattern` | `^[0-9a-zA-Z]{11}$` | "CPF must contain exactly 11 alphanumeric characters" |
| `phone` | `@NotBlank` | - | "Phone is required" |
| `phone` | `@Size(min=11, max=11)` | - | "Phone must have exactly 11 digits" |
| `phone` | `@Pattern` | `^[0-9]{11}$` | "Phone must contain only numbers in format DDNNNNNNNNN" |
| `name` | `@NotBlank` | - | "Name is required" |
| `name` | `@Size(max=255)` | - | "Name must have at most 255 characters" |
| `name` | `@Pattern` | `^[a-zA-ZÀ-ÿ\\s]+$` | "Name must contain only letters" |
| `nickname` | `@Size(max=80)` | - | "Nickname must have at most 80 characters" |

### 2.3 Validações de Entrada (UpsertCustomerRequest)

| Campo | Validação | Regex/Regra | Mensagem de Erro |
|-------|-----------|-------------|------------------|
| `phone` | `@NotBlank` | - | "Phone is required" |
| `phone` | `@Pattern` | `^[0-9]{11}$` | "Phone must contain only numbers" |
| `name` | `@Size(max=255)` | - | "Name must have at most 255 characters" |

### 2.4 Validações de Entrada (UpdateCustomerRequest)

| Campo | Validação | Regex/Regra | Mensagem de Erro |
|-------|-----------|-------------|------------------|
| `name` | `@Size(max=255)` | - | "Name must have at most 255 characters" |
| `name` | `@Pattern` | `^[a-zA-ZÀ-ÿ\\s]+$` | "Name must contain only letters" |
| `nickname` | `@Size(max=80)` | - | "Nickname must have at most 80 characters" |
| `cpf` | `@Pattern` | `^[0-9a-zA-Z]{11}$` | "CPF must contain exactly 11 alphanumeric characters" |
| `phone` | `@Pattern` | `^[0-9]{11}$` | "Phone must contain only numbers" |

### 2.5 Regras de Negócio

#### RN-C01: Unicidade de CPF por Tenant
- O `cpf` deve ser único dentro do mesmo tenant
- Constraint: `uk_customer_tenant_cpf (tenant_id, cpf)`

```
Exemplo:
Tenant A: Cliente com CPF 12345678901 ✅
Tenant A: Outro cliente com CPF 12345678901 ❌ (duplicado no mesmo tenant)
Tenant B: Cliente com CPF 12345678901 ✅ (tenant diferente, permitido)
```

#### RN-C02: Unicidade de Telefone por Tenant
- O `phone` deve ser único dentro do mesmo tenant
- Constraint: `uk_customer_tenant_phone (tenant_id, phone)`

```
Exemplo:
Tenant A: Cliente com phone 11999998888 ✅
Tenant A: Outro cliente com phone 11999998888 ❌ (duplicado)
Tenant B: Cliente com phone 11999998888 ✅ (tenant diferente)
```

#### RN-C03: Validação de Data de Nascimento
- A data de nascimento não pode ser no futuro

```java
if (birthDate != null && birthDate.isAfter(LocalDate.now())) {
    throw new ValidationException("Birth date cannot be in the future");
}
```

#### RN-C04: Soft Delete
- Exclusão de cliente é lógica (`active = false`)
- Clientes inativos não são retornados em listagens
- O cliente não é removido fisicamente do banco de dados

```
Exemplo:
DELETE /api/v1/customers/{id}
→ Resultado: customer.active = false
→ Cliente ainda existe no banco, mas não aparece em listagens
```

#### RN-C05: Upsert por Telefone
- Operação especial que busca cliente por telefone:
  - **Se encontrar**: atualiza o nome do cliente existente
  - **Se não encontrar**: cria novo cliente com phone e name

```
Exemplo:
PUT /api/v1/customers/upsert
Body: { "phone": "11999998888", "name": "João Silva" }

Caso 1 - Cliente existe com phone 11999998888:
→ Atualiza nome para "João Silva"
→ Retorna cliente atualizado

Caso 2 - Não existe cliente com esse phone:
→ Cria novo cliente com phone=11999998888, name="João Silva"
→ Retorna cliente criado
```

#### RN-C06: Validação de Duplicidade em Atualização
- Ao atualizar CPF ou telefone, verifica se não duplica com outro cliente
- A verificação exclui o próprio cliente sendo atualizado

```java
// Validação de CPF duplicado em update
if (request.cpf() != null && !Objects.equals(request.cpf(), customer.getCpf())) {
    validateDuplicateCpf(tenantId, request.cpf());
}
```

---

## 3. 👨‍💼 Professional (Profissional)

O **Professional** representa um colaborador que realiza serviços no estabelecimento.

### 3.1 Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `name` | String(255) | Sim | Nome do profissional |
| `active` | Boolean | Sim | Status ativo (default: true) |
| `tenant_id` | FK | Sim | Tenant ao qual pertence |

### 3.2 Validações de Entrada (CreateProfessionalRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `name` | `@NotBlank` | "Name is required" |

### 3.3 Validações de Entrada (UpdateProfessionalRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `name` | `@Size(max=255)` | "Name must have at most 255 characters" |

### 3.4 Relacionamentos

```
Professional 1:N Availability        → Disponibilidades semanais
Professional 1:N ScheduleBlock       → Bloqueios de agenda
Professional 1:N Booking             → Agendamentos realizados
Professional 1:N ProfessionalService → Serviços que realiza
```

### 3.5 Regras de Negócio

#### RN-P01: Soft Delete
- Exclusão de profissional é lógica (`active = false`)
- Profissionais inativos não podem receber novos agendamentos

#### RN-P02: Verificação de Serviço
- Método `performsService(serviceId)` verifica se o profissional realiza um serviço específico
- Considera apenas associações ativas (`ProfessionalService.active = true`)

```java
public boolean performsService(String serviceId) {
    return professionalServices.stream()
        .filter(ProfessionalService::isActive)
        .anyMatch(ps -> ps.getService().getId().equals(serviceId));
}
```

#### RN-P03: Lista de Serviços
- `getServices()` retorna apenas serviços ativos que o profissional realiza
- `getServiceIds()` retorna apenas os IDs dos serviços ativos

---

## 4. 📅 Availability (Disponibilidade)

A **Availability** define os horários em que um profissional está disponível para atendimento, configurada por dia da semana.

### 4.1 Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `professional_id` | FK | Sim | Profissional |
| `dayOfWeek` | DayOfWeek | Sim | Dia da semana (MONDAY-SUNDAY) |
| `startTime` | LocalTime | Sim | Hora de início |
| `endTime` | LocalTime | Sim | Hora de fim |
| `active` | Boolean | Sim | Status ativo (default: true) |

### 4.2 Validações de Entrada (CreateAvailabilityRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `dayOfWeek` | `@NotNull` | "Day of week is required" |
| `startTime` | `@NotNull` | "Start time is required" |
| `endTime` | `@NotNull` | "End time is required" |

### 4.3 Regras de Negócio

#### RN-A01: Múltiplas Disponibilidades por Dia
- Um profissional pode ter múltiplas disponibilidades no mesmo dia da semana
- Útil para configurar intervalos (ex: almoço)

```
Exemplo - Profissional com intervalo de almoço:
┌─────────────────────────────────────────────────┐
│ SEGUNDA-FEIRA (MONDAY)                          │
├─────────────────────────────────────────────────┤
│ Availability 1: 08:00 - 12:00 (período manhã)  │
│ Availability 2: 14:00 - 18:00 (período tarde)  │
└─────────────────────────────────────────────────┘

O profissional NÃO estará disponível das 12:00 às 14:00
```

#### RN-A02: Validação em Agendamentos
- Agendamentos devem estar **completamente dentro** de uma janela de disponibilidade
- O início E o fim do agendamento devem estar dentro do período

```
Profissional: Disponível 08:00-12:00 e 14:00-18:00

✅ Booking 09:00-10:00 → Válido (dentro da manhã)
✅ Booking 15:00-16:00 → Válido (dentro da tarde)
❌ Booking 12:30-13:30 → Inválido (fora de qualquer disponibilidade)
❌ Booking 11:00-13:00 → Inválido (ultrapassa disponibilidade da manhã)
❌ Booking 13:00-15:00 → Inválido (começa fora da disponibilidade)
```

#### RN-A03: Disponibilidade vs Horário Comercial
- A disponibilidade do profissional deve estar dentro do horário comercial do tenant
- Mas a disponibilidade pode ser mais restritiva que o horário comercial

```
Tenant: openTime=08:00, closeTime=20:00
Profissional: Availability MONDAY 10:00-16:00

✅ Booking Segunda 10:00-11:00 → Válido
❌ Booking Segunda 08:00-09:00 → Inválido (fora da disponibilidade)
❌ Booking Segunda 17:00-18:00 → Inválido (fora da disponibilidade)
```

---

## 5. 🚫 ScheduleBlock (Bloqueio de Agenda)

O **ScheduleBlock** representa um bloqueio pontual na agenda do profissional (férias, consulta médica, etc.).

### 5.1 Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `professional_id` | FK | Sim | Profissional |
| `startTime` | LocalDateTime | Sim | Data/hora de início do bloqueio |
| `endTime` | LocalDateTime | Sim | Data/hora de fim do bloqueio |
| `reason` | String(500) | Não | Motivo do bloqueio |

### 5.2 Validações de Entrada (CreateScheduleBlockRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `startTime` | `@NotNull` | "Start time is required" |
| `endTime` | `@NotNull` | "End time is required" |
| `reason` | `@Size(max=500)` | "Reason must have at most 500 characters" |

### 5.3 Regras de Negócio

#### RN-SB01: Bloqueio Impede Agendamentos
- Agendamentos não podem ser criados em períodos que **sobrepõem** um bloqueio
- Verificação de sobreposição usa a lógica: `block.start < booking.end AND block.end > booking.start`

```sql
-- Query de verificação de conflito com bloqueio
SELECT * FROM schedule_block 
WHERE professional_id = :professionalId 
  AND start_time < :bookingEndTime 
  AND end_time > :bookingStartTime
```

#### RN-SB02: Tipos de Sobreposição
```
Bloqueio: 2026-01-22 10:00 até 2026-01-22 14:00

Caso 1 - Booking sobrepõe início do bloqueio:
❌ Booking 09:00-11:00 → Inválido
   [===Booking===]
         [=======Bloqueio=======]

Caso 2 - Booking sobrepõe fim do bloqueio:
❌ Booking 13:00-15:00 → Inválido
                  [===Booking===]
   [=======Bloqueio=======]

Caso 3 - Booking completamente dentro do bloqueio:
❌ Booking 11:00-13:00 → Inválido
      [===Booking===]
   [=======Bloqueio=======]

Caso 4 - Booking adjacente (não sobrepõe):
✅ Booking 08:00-10:00 → Válido (termina quando bloqueio começa)
   [===Booking===]
                 [=======Bloqueio=======]

✅ Booking 14:00-15:00 → Válido (começa quando bloqueio termina)
                              [===Booking===]
   [=======Bloqueio=======]
```

#### RN-SB03: Bloqueios são Pontuais
- Diferente de `Availability` (semanal), bloqueios são para datas específicas
- Útil para: férias, folgas, consultas médicas, eventos pessoais

```
Exemplo de uso:
- Profissional vai ao médico em 22/01/2026 das 10:00 às 12:00
- Criar ScheduleBlock: startTime=2026-01-22T10:00, endTime=2026-01-22T12:00
- Nenhum agendamento poderá ser feito nesse período
```

---

## 6. 💇 Service (Serviço)

O **Service** representa um serviço oferecido pelo estabelecimento.

### 6.1 Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `name` | String(255) | Sim | Nome do serviço |
| `durationMinutes` | Integer | Sim | Duração em minutos |
| `price` | BigDecimal(10,2) | Sim | Preço do serviço |
| `active` | Boolean | Sim | Status ativo (default: true) |
| `tenant_id` | FK | Sim | Tenant ao qual pertence |

### 6.2 Validações de Entrada (CreateServiceRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `name` | `@NotBlank` | "Name is required" |
| `durationMinutes` | `@NotNull` | "Duration in minutes is required" |
| `durationMinutes` | `@Positive` | "Duration must be positive" |
| `price` | `@NotNull` | "Price is required" |
| `price` | `@Positive` | "Price must be positive" |

### 6.3 Validações de Entrada (UpdateServiceRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `name` | `@Size(max=255)` | "Name must have at most 255 characters" |
| `durationMinutes` | `@Positive` | "Duration must be positive" |
| `price` | `@Positive` | "Price must be positive" |

### 6.4 Regras de Negócio

#### RN-S01: Soft Delete
- Exclusão de serviço é lógica (`active = false`)
- Serviços inativos não podem ser agendados
- Serviços inativos não aparecem na lista de serviços ativos

#### RN-S02: Duração Define Horário de Término
- O `endTime` do agendamento é calculado automaticamente: `startTime + durationMinutes`

```
Exemplo:
Serviço: "Corte de Cabelo" (durationMinutes = 60)
Booking solicitado: startTime = 2026-01-22 10:00

endTime calculado = 10:00 + 60min = 11:00
Booking criado: 10:00 - 11:00
```

#### RN-S03: Método getDuration()
- Retorna a duração como objeto `Duration` para facilitar cálculos

```java
public Duration getDuration() {
    return Duration.ofMinutes(durationMinutes);
}
```

#### RN-S04: Lista de Profissionais
- `getProfessionals()` retorna profissionais ativos que realizam o serviço
- Considera apenas `ProfessionalService.active = true`

---

## 7. 🔗 ProfessionalService (Associação Profissional-Serviço)

A **ProfessionalService** associa profissionais aos serviços que eles realizam, permitindo preços e durações customizadas por profissional.

### 7.1 Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `professional_id` | FK | Sim | Profissional |
| `service_id` | FK | Sim | Serviço |
| `customPrice` | BigDecimal(10,2) | Não | Preço customizado (sobrescreve serviço) |
| `customDurationMinutes` | Integer | Não | Duração customizada (sobrescreve serviço) |
| `active` | Boolean | Sim | Status ativo (default: true) |

### 7.2 Validações de Entrada (AssignServiceRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `serviceId` | `@NotBlank` | "Service ID is required" |
| `customPrice` | `@Positive` | "Custom price must be positive" |
| `customDurationMinutes` | `@Positive` | "Custom duration must be positive" |

### 7.3 Validações de Entrada (UpdateProfessionalServiceRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `customPrice` | `@PositiveOrZero` | "Custom price must be positive or zero" |
| `customDurationMinutes` | `@Positive` | "Custom duration must be positive" |

### 7.4 Regras de Negócio

#### RN-PS01: Unicidade de Associação
- Constraint: `uk_professional_service (professional_id, service_id)`
- Um profissional não pode ter o mesmo serviço associado duas vezes

```
Exemplo:
Profissional "Maria" + Serviço "Corte" → Associação criada ✅
Profissional "Maria" + Serviço "Corte" → ❌ (já existe)
```

#### RN-PS02: Reativação de Associação
- Se a associação já existe mas está **inativa** (`active = false`), o sistema **reativa** ao invés de criar nova
- Os valores customizados são atualizados na reativação

```
Exemplo:
1. ProfessionalService existe: Maria + Corte (active=false, customPrice=null)
2. Requisição: Associar Maria ao Corte com customPrice=70.00
3. Sistema REATIVA a associação e define customPrice=70.00
```

#### RN-PS03: Preço Efetivo (Effective Price)
- Se `customPrice` está definido, usa o preço customizado
- Senão, usa o preço padrão do serviço

```java
public BigDecimal getEffectivePrice() {
    return customPrice != null ? customPrice : service.getPrice();
}

public boolean hasCustomPrice() {
    return customPrice != null;
}
```

#### RN-PS04: Duração Efetiva (Effective Duration)
- Se `customDurationMinutes` está definido, usa a duração customizada
- Senão, usa a duração padrão do serviço

```java
public Integer getEffectiveDurationMinutes() {
    return customDurationMinutes != null ? customDurationMinutes : service.getDurationMinutes();
}

public boolean hasCustomDuration() {
    return customDurationMinutes != null;
}
```

#### RN-PS05: Exemplo Completo de Preço/Duração Efetiva

```
Serviço "Corte de Cabelo":
  - price = R$ 50,00
  - durationMinutes = 60

┌─────────────────────────────────────────────────────────────────────────┐
│ Profissional A (sem customização):                                      │
│   customPrice = null                                                    │
│   customDurationMinutes = null                                          │
│   → effectivePrice = R$ 50,00 (usa preço do serviço)                   │
│   → effectiveDuration = 60min (usa duração do serviço)                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Profissional B (preço customizado):                                     │
│   customPrice = R$ 70,00                                                │
│   customDurationMinutes = null                                          │
│   → effectivePrice = R$ 70,00 (usa preço customizado)                  │
│   → effectiveDuration = 60min (usa duração do serviço)                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Profissional C (duração customizada):                                   │
│   customPrice = null                                                    │
│   customDurationMinutes = 45                                            │
│   → effectivePrice = R$ 50,00 (usa preço do serviço)                   │
│   → effectiveDuration = 45min (usa duração customizada)                │
├─────────────────────────────────────────────────────────────────────────┤
│ Profissional D (ambos customizados):                                    │
│   customPrice = R$ 80,00                                                │
│   customDurationMinutes = 90                                            │
│   → effectivePrice = R$ 80,00 (usa preço customizado)                  │
│   → effectiveDuration = 90min (usa duração customizada)                │
└─────────────────────────────────────────────────────────────────────────┘
```

#### RN-PS06: Validação de Tenant
- Professional e Service devem pertencer ao **mesmo tenant**
- Não é possível associar um profissional de um tenant a um serviço de outro tenant

```java
if (!professional.getTenant().getId().equals(service.getTenant().getId())) {
    throw new ValidationException("Professional and Service must belong to the same tenant");
}
```

#### RN-PS07: Soft Delete (Unassign)
- Remover serviço de profissional é lógico (`active = false`)
- A associação não é deletada fisicamente

---

## 8. 📆 Booking (Agendamento)

O **Booking** representa um agendamento de serviço feito por um cliente com um profissional.

### 8.1 Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `customer_id` | FK | Sim | Cliente que agendou |
| `professional_id` | FK | Sim | Profissional que atenderá |
| `service_id` | FK | Sim | Serviço agendado |
| `tenant_id` | FK | Sim | Tenant do agendamento |
| `startTime` | LocalDateTime | Sim | Data/hora de início |
| `endTime` | LocalDateTime | Sim (calc) | Data/hora de fim (calculado) |
| `status` | BookingStatus | Sim | Status do agendamento |
| `notes` | String | Não | Observações do cliente |
| `price` | BigDecimal(10,2) | Não | Preço cobrado |
| `createdAt` | LocalDateTime | Sim (auto) | Data de criação |
| `cancellationReason` | String(500) | Não | Motivo do cancelamento |

### 8.2 Validações de Entrada (CreateBookingRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `customerId` | `@NotBlank` | "Customer ID is required" |
| `serviceId` | `@NotBlank` | "Service ID is required" |
| `professionalId` | `@NotBlank` | "Professional ID is required" |
| `startTime` | `@NotNull` | "Start time is required" |

### 8.3 Validações de Entrada (RescheduleBookingRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `newStartTime` | `@NotNull` | "New start time is required" |

### 8.4 Validações de Entrada (CancelBookingRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `reason` | `@Size(max=500)` | "Reason must have at most 500 characters" |

### 8.5 Status do Agendamento (BookingStatus)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     CICLO DE VIDA DO BOOKING                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│    ┌─────────────┐                                                        │
│    │  REQUESTED  │ ← Status inicial ao criar agendamento                 │
│    │             │   (aguardando confirmação do estabelecimento)          │
│    └──────┬──────┘                                                        │
│           │                                                               │
│           ▼                                                               │
│    ┌─────────────┐                                                        │
│    │  CONFIRMED  │ ← Confirmado pelo estabelecimento                     │
│    │             │   (agendamento garantido)                              │
│    └──────┬──────┘                                                        │
│           │                                                               │
│           ▼                                                               │
│    ┌─────────────┐                                                        │
│    │ IN_PROGRESS │ ← Atendimento em andamento                            │
│    │             │   (cliente chegou e está sendo atendido)               │
│    └──────┬──────┘                                                        │
│           │                                                               │
│           ▼                                                               │
│    ┌─────────────┐                                                        │
│    │  COMPLETED  │ ← Serviço finalizado com sucesso                      │
│    │             │   (ESTADO TERMINAL)                                    │
│    └─────────────┘                                                        │
│                                                                           │
│    ═══════════════════════════════════════════════════════════════════   │
│    ESTADOS TERMINAIS ALTERNATIVOS:                                        │
│    ═══════════════════════════════════════════════════════════════════   │
│                                                                           │
│    ┌─────────────┐                                                        │
│    │  CANCELLED  │ ← Cancelado pelo cliente ou estabelecimento           │
│    └─────────────┘                                                        │
│                                                                           │
│    ┌─────────────┐                                                        │
│    │  REJECTED   │ ← Rejeitado (conflito, indisponibilidade)             │
│    └─────────────┘                                                        │
│                                                                           │
│    ┌─────────────┐                                                        │
│    │   NO_SHOW   │ ← Cliente não compareceu                              │
│    └─────────────┘                                                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 8.6 Status Ativos para Verificação de Conflitos

Os seguintes status são considerados **ativos** para verificação de conflitos:
- `REQUESTED`
- `CONFIRMED`
- `IN_PROGRESS`

```java
private static final List<BookingStatus> ACTIVE_STATUSES = List.of(
    BookingStatus.REQUESTED,
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS
);
```

### 8.7 Regras de Negócio - Criação de Agendamento

#### RN-B01: Validação de Existência de Entidades
- Customer, Service e Professional devem existir no banco de dados
- Lança `NotFoundException` se qualquer um não for encontrado

```java
Customer customer = customerRepository.findById(request.customerId())
    .orElseThrow(() -> new NotFoundException("Customer not found: " + request.customerId()));
```

#### RN-B02: Validação de Tenant (Multi-tenancy)
- Customer, Service e Professional devem pertencer ao **mesmo tenant**
- Garante isolamento de dados entre estabelecimentos

```
Exemplo:
Tenant A: Customer "João", Service "Corte", Professional "Maria"
Tenant B: Service "Pintura"

Booking: João + Corte + Maria ✅ (todos do Tenant A)
Booking: João + Pintura + Maria ❌ (Pintura é do Tenant B)
```

#### RN-B03: Validação de Status Ativo
- Service deve estar ativo (`active = true`)
- Professional deve estar ativo (`active = true`)

```java
if (!service.isActive()) {
    throw new ValidationException("Service is not active");
}
if (!professional.isActive()) {
    throw new ValidationException("Professional is not active");
}
```

#### RN-B04: Validação de Serviço do Profissional
- O profissional deve realizar o serviço solicitado
- Verificado via `ProfessionalService` com `active = true`

```
Exemplo:
Profissional "Maria" realiza: [Corte, Pintura, Escova]
Serviço solicitado: "Manicure"

❌ Booking inválido - Maria não realiza Manicure
→ ValidationException: "Professional does not perform this service"
```

#### RN-B05: Validação de Horário Comercial
- O início do agendamento deve ser **após ou igual** ao `openTime` do tenant
- O fim do agendamento deve ser **antes ou igual** ao `closeTime` do tenant

```java
private void validateBusinessHours(LocalDateTime startTime, LocalDateTime endTime, Tenant tenant) {
    if (startTime.toLocalTime().isBefore(tenant.getOpenTime())) {
        throw new ValidationException("Start time is before business hours");
    }
    if (endTime.toLocalTime().isAfter(tenant.getCloseTime())) {
        throw new ValidationException("End time is after business hours");
    }
}
```

```
Exemplo:
Tenant: openTime=08:00, closeTime=18:00
Serviço: 60 minutos

✅ Booking 08:00-09:00 → Válido
✅ Booking 17:00-18:00 → Válido (termina exatamente no fechamento)
❌ Booking 07:30-08:30 → Inválido (começa antes da abertura)
❌ Booking 17:30-18:30 → Inválido (termina após o fechamento)
```

#### RN-B06: Validação de Disponibilidade do Profissional
- Deve existir uma `Availability` **ativa** para o profissional no dia da semana do agendamento
- O período completo do agendamento deve estar **dentro** da janela de disponibilidade

```java
private void validateProfessionalAvailability(Professional professional, 
                                              LocalDateTime startTime, 
                                              LocalDateTime endTime) {
    DayOfWeek dayOfWeek = startTime.getDayOfWeek();
    LocalTime bookingStart = startTime.toLocalTime();
    LocalTime bookingEnd = endTime.toLocalTime();

    boolean hasAvailability = availabilityRepository
        .findByProfessionalIdAndDayOfWeekAndActiveTrue(professional.getId(), dayOfWeek)
        .stream()
        .anyMatch(availability -> 
            !bookingStart.isBefore(availability.getStartTime()) && 
            !bookingEnd.isAfter(availability.getEndTime())
        );

    if (!hasAvailability) {
        throw new ValidationException("Professional is not available at this time");
    }
}
```

```
Exemplo:
Profissional: Disponível Segunda 08:00-12:00 e 14:00-18:00
Agendamento: Segunda, serviço de 60 minutos

✅ Booking 09:00-10:00 → Válido (dentro de 08:00-12:00)
✅ Booking 11:00-12:00 → Válido (dentro de 08:00-12:00)
✅ Booking 14:00-15:00 → Válido (dentro de 14:00-18:00)
❌ Booking 11:30-12:30 → Inválido (ultrapassa 12:00)
❌ Booking 12:30-13:30 → Inválido (fora de qualquer disponibilidade)
❌ Booking 13:30-14:30 → Inválido (começa fora da disponibilidade)
```

#### RN-B07: Validação de Bloqueios de Agenda
- Não pode haver `ScheduleBlock` que sobreponha o período do agendamento

```java
private void validateNoScheduleBlocks(Professional professional, 
                                      LocalDateTime startTime, 
                                      LocalDateTime endTime) {
    boolean hasBlock = scheduleBlockRepository
        .existsByProfessionalIdAndStartTimeLessThanAndEndTimeGreaterThan(
            professional.getId(), endTime, startTime);
    
    if (hasBlock) {
        throw new ValidationException("Professional has a schedule block at this time");
    }
}
```

#### RN-B08: Validação de Conflitos com Outros Agendamentos
- Não pode haver outro `Booking` **ativo** que sobreponha o período
- Status ativos: `REQUESTED`, `CONFIRMED`, `IN_PROGRESS`

```java
private void validateNoConflicts(Professional professional, 
                                 LocalDateTime startTime, 
                                 LocalDateTime endTime) {
    boolean hasConflict = bookingRepository
        .existsByProfessionalIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            professional.getId(), ACTIVE_STATUSES, endTime, startTime);
    
    if (hasConflict) {
        throw new ValidationException("Time slot is already booked");
    }
}
```

```
Exemplo:
Booking existente: 10:00-11:00 (status=CONFIRMED)

❌ Novo booking 09:30-10:30 → Conflito (sobrepõe início)
❌ Novo booking 10:30-11:30 → Conflito (sobrepõe fim)
❌ Novo booking 10:15-10:45 → Conflito (dentro do existente)
✅ Novo booking 09:00-10:00 → OK (adjacente, não sobrepõe)
✅ Novo booking 11:00-12:00 → OK (adjacente, não sobrepõe)
```

#### RN-B09: Cálculo do Preço
- O preço do booking usa o **preço efetivo** da associação profissional-serviço
- Considera `customPrice` se existir, senão usa preço do serviço

#### RN-B10: Cálculo do Horário de Término
- `endTime = startTime + duração do serviço`
- A duração pode ser customizada por profissional

### 8.8 Regras de Negócio - Cancelamento

#### RN-B11: Restrições de Cancelamento
- ❌ Não pode cancelar booking com status `CANCELLED` (já cancelado)
- ❌ Não pode cancelar booking com status `COMPLETED` (já finalizado)

```java
if (booking.getStatus() == BookingStatus.CANCELLED) {
    throw new ValidationException("Booking is already cancelled");
}
if (booking.getStatus() == BookingStatus.COMPLETED) {
    throw new ValidationException("Cannot cancel a completed booking");
}
```

#### RN-B12: Processo de Cancelamento
1. Valida que o booking pode ser cancelado
2. Define `status = CANCELLED`
3. Define `cancellationReason` (se fornecido)
4. Retorna o booking atualizado

```
Exemplo:
POST /api/v1/bookings/{id}/cancel
Body: { "reason": "Cliente solicitou cancelamento" }

Resultado:
- booking.status = CANCELLED
- booking.cancellationReason = "Cliente solicitou cancelamento"
```

### 8.9 Regras de Negócio - Reagendamento

#### RN-B13: Restrições de Reagendamento
- ❌ Não pode reagendar booking com status `CANCELLED`
- ❌ Não pode reagendar booking com status `COMPLETED`

```java
if (booking.getStatus() == BookingStatus.CANCELLED) {
    throw new ValidationException("Cannot reschedule a cancelled booking");
}
if (booking.getStatus() == BookingStatus.COMPLETED) {
    throw new ValidationException("Cannot reschedule a completed booking");
}
```

#### RN-B14: Processo de Reagendamento
1. Valida que o booking pode ser reagendado
2. Calcula novo `endTime` baseado na duração do serviço
3. **Reaplica todas as validações** do novo horário:
   - Horário comercial
   - Disponibilidade do profissional
   - Bloqueios de agenda
   - Conflitos com outros bookings
4. Na verificação de conflitos, **exclui o próprio booking** sendo reagendado
5. Atualiza `startTime` e `endTime`
6. Retorna o booking atualizado

```
Exemplo:
POST /api/v1/bookings/{id}/reschedule
Body: { "newStartTime": "2026-01-23T14:00:00" }

Validações executadas:
✓ Horário comercial OK
✓ Profissional disponível na quarta às 14:00 OK
✓ Sem bloqueios OK
✓ Sem conflitos (excluindo o próprio booking) OK

Resultado:
- booking.startTime = 2026-01-23T14:00
- booking.endTime = 2026-01-23T15:00 (se serviço = 60min)
```

---

## 9. ⏰ SlotRules e Políticas de Slots

O sistema suporta diferentes modos de geração de horários disponíveis (slots) para agendamento.

### 9.1 SlotRule (Regra de Slot)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim (auto) | Identificador único |
| `tenant_id` | FK | Sim | Tenant |
| `mode` | SlotMode | Sim | Modo de geração de slots |
| `intervalMinutes` | Integer | Condicional | Intervalo em minutos (modo INTERVAL) |
| `bufferBetweenServicesMinutes` | Integer | Não | Buffer entre serviços |
| `fixedTimes` | List<FixedTime> | Condicional | Horários fixos (modo FIXED) |

### 9.2 SlotMode (Modos de Geração)

| Modo | Descrição | Uso Principal |
|------|-----------|---------------|
| `FIXED` | Horários fixos pré-definidos | Estabelecimentos com horários específicos |
| `INTERVAL` | Intervalos regulares | Consultórios, clínicas |
| `SERVICE_DURATION` | Baseado na duração do serviço | Salões de beleza, barbearias |

### 9.3 Validações de Entrada (CreateSlotRuleRequest)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `mode` | `@NotNull` | "Mode is required" |
| `intervalMinutes` | `@Positive` | "Interval must be positive" |
| `bufferBetweenServicesMinutes` | `@PositiveOrZero` | "Buffer must be positive or zero" |

### 9.4 FIXED Slot Policy

Gera slots em horários **fixos pré-definidos**.

#### Regras:
1. Usa a lista de `fixedTimes` configurada na SlotRule
2. Para cada horário fixo, valida se está dentro do horário comercial
3. A duração do slot é definida pelo serviço (se fornecido) ou pelo buffer configurado
4. Slots que ultrapassam `closeTime` são descartados

```
Exemplo:
Tenant: openTime=08:00, closeTime=18:00
FixedTimes: [08:00, 09:40, 11:20, 13:00, 14:40, 16:20]
Serviço: 60 minutos

Slots gerados:
┌─────────────────────────────────────────┐
│ 08:00 - 09:00 ✅ (dentro do horário)   │
│ 09:40 - 10:40 ✅                        │
│ 11:20 - 12:20 ✅                        │
│ 13:00 - 14:00 ✅                        │
│ 14:40 - 15:40 ✅                        │
│ 16:20 - 17:20 ✅                        │
│ (17:20 - 18:20 ❌) → Ultrapassaria 18:00│
└─────────────────────────────────────────┘
```

#### Implementação:
```java
@Override
public List<SlotDTO> generateSlots(LocalDate date, Tenant tenant, SlotRule rule, Service service) {
    List<SlotDTO> slots = new ArrayList<>();

    if (rule.getFixedTimes() == null || rule.getFixedTimes().isEmpty()) {
        return slots;
    }

    rule.getFixedTimes().forEach(fixedTime -> {
        var time = fixedTime.getTime();
        var start = LocalDateTime.of(date, time);

        // Verifica se está dentro do horário comercial
        if (!start.toLocalTime().isBefore(tenant.getOpenTime())
                && !start.toLocalTime().isAfter(tenant.getCloseTime())) {

            var duration = service != null
                    ? service.getDuration().toMinutes()
                    : (rule.getBufferBetweenServicesMinutes() != null
                        ? rule.getBufferBetweenServicesMinutes()
                        : 30);

            var end = start.plusMinutes(duration);

            // Verifica se não ultrapassa o fechamento
            if (!end.toLocalTime().isAfter(tenant.getCloseTime())) {
                slots.add(new SlotDTO(start, end, true));
            }
        }
    });

    return slots;
}
```

### 9.5 INTERVAL Slot Policy

Gera slots em **intervalos regulares** a partir do horário de abertura.

#### Regras:
1. Começa em `tenant.openTime`
2. Gera slots a cada `intervalMinutes`
3. A duração do slot é definida pelo serviço (se fornecido) ou pelo intervalo
4. Para quando atinge ou ultrapassa `closeTime`

```
Exemplo:
Tenant: openTime=08:00, closeTime=18:00
Interval: 60 minutos
Serviço: 45 minutos

Slots gerados:
┌─────────────────────────────────────────┐
│ 08:00 - 08:45 ✅                        │
│ 09:00 - 09:45 ✅ (próximo slot +60min) │
│ 10:00 - 10:45 ✅                        │
│ 11:00 - 11:45 ✅                        │
│ 12:00 - 12:45 ✅                        │
│ 13:00 - 13:45 ✅                        │
│ 14:00 - 14:45 ✅                        │
│ 15:00 - 15:45 ✅                        │
│ 16:00 - 16:45 ✅                        │
│ 17:00 - 17:45 ✅                        │
│ 18:00 ❌ (início no limite, descartado)│
└─────────────────────────────────────────┘
```

#### Implementação:
```java
@Override
public List<SlotDTO> generateSlots(LocalDate date, Tenant tenant, SlotRule rule, Service service) {
    List<SlotDTO> slots = new ArrayList<>();

    if (rule.getIntervalMinutes() == null || rule.getIntervalMinutes() <= 0) {
        return slots;
    }

    int interval = rule.getIntervalMinutes();
    LocalTime cursor = tenant.getOpenTime();

    while (!cursor.isAfter(tenant.getCloseTime())) {
        LocalDateTime start = LocalDateTime.of(date, cursor);

        int duration = service != null
                ? (int) service.getDuration().toMinutes()
                : interval;

        LocalDateTime end = start.plusMinutes(duration);

        if (!end.toLocalTime().isAfter(tenant.getCloseTime())) {
            slots.add(new SlotDTO(start, end, true));
        }

        cursor = cursor.plusMinutes(interval);
    }

    return slots;
}
```

### 9.6 SERVICE_DURATION Slot Policy

Gera slots baseados na **duração do serviço**, com buffer opcional entre serviços.

#### Regras:
1. **Requer serviço** - retorna lista vazia se serviço não for fornecido
2. Começa em `tenant.openTime`
3. Cada slot tem duração = duração do serviço
4. Próximo slot começa após o anterior + buffer
5. Para quando atinge ou ultrapassa `closeTime`

```
Exemplo:
Tenant: openTime=08:00, closeTime=18:00
Serviço: 90 minutos
Buffer: 15 minutos

Cálculo:
Slot 1: 08:00 - 09:30 (90min)
        +15min buffer
Slot 2: 09:45 - 11:15 (90min)
        +15min buffer
Slot 3: 11:30 - 13:00 (90min)
        +15min buffer
Slot 4: 13:15 - 14:45 (90min)
        +15min buffer
Slot 5: 15:00 - 16:30 (90min)
        +15min buffer
Slot 6: 16:45 - 18:15 ❌ (ultrapassaria 18:00)

Slots gerados:
┌─────────────────────────────────────────────────┐
│ 08:00 - 09:30 ✅                                │
│ 09:45 - 11:15 ✅ (+15min de buffer)            │
│ 11:30 - 13:00 ✅                                │
│ 13:15 - 14:45 ✅                                │
│ 15:00 - 16:30 ✅                                │
│ (16:45 - 18:15 ❌) → Ultrapassaria closeTime   │
└─────────────────────────────────────────────────┘
```

#### Implementação:
```java
@Override
public List<SlotDTO> generateSlots(LocalDate date, Tenant tenant, SlotRule rule, Service service) {
    List<SlotDTO> slots = new ArrayList<>();

    if (service == null) {
        log.warn("Service not provided for duration-based slot generation");
        return slots;
    }

    int buffer = rule.getBufferBetweenServicesMinutes() != null
            ? rule.getBufferBetweenServicesMinutes()
            : 0;

    LocalTime cursor = tenant.getOpenTime();

    while (!cursor.isAfter(tenant.getCloseTime())) {
        LocalDateTime start = LocalDateTime.of(date, cursor);
        LocalDateTime end = start.plusMinutes(service.getDuration().toMinutes());

        if (!end.toLocalTime().isAfter(tenant.getCloseTime())) {
            slots.add(new SlotDTO(start, end, true));
        }

        // Próximo slot = fim do atual + buffer
        cursor = end.toLocalTime().plusMinutes(buffer);

        if (cursor.isAfter(tenant.getCloseTime())) {
            break;
        }
    }

    return slots;
}
```

### 9.7 Comparação entre Políticas

| Característica | FIXED | INTERVAL | SERVICE_DURATION |
|----------------|-------|----------|------------------|
| Horários pré-definidos | ✅ | ❌ | ❌ |
| Intervalo regular | ❌ | ✅ | ❌ |
| Baseado no serviço | ❌ | ❌ | ✅ |
| Requer serviço | Não | Não | **Sim** |
| Buffer entre slots | Via duração | Fixo | Configurável |
| Ideal para | Agendas fixas | Consultas padrão | Serviços variáveis |

---

## 10. 🔍 Consulta de Disponibilidade

O endpoint de disponibilidade retorna os slots disponíveis para agendamento.

### 10.1 Endpoint

```
GET /api/v1/schedule/availability
  ?professionalId={id}
  &date={YYYY-MM-DD}
  &serviceId={id}  (opcional)
```

### 10.2 Processo de Verificação

Para cada slot gerado pela política, o sistema verifica:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SLOT ESTÁ DISPONÍVEL?                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 1. ✅ Está dentro do horário comercial?                                │
│    └─ slot.start >= tenant.openTime                                    │
│    └─ slot.end <= tenant.closeTime                                     │
│                                                                         │
│ 2. ✅ Está dentro da disponibilidade do profissional?                  │
│    └─ Existe Availability para o dia da semana                         │
│    └─ slot.start >= availability.startTime                             │
│    └─ slot.end <= availability.endTime                                 │
│                                                                         │
│ 3. ✅ NÃO há bloqueio de agenda?                                       │
│    └─ Não existe ScheduleBlock que sobreponha o slot                   │
│                                                                         │
│ 4. ✅ NÃO há conflito com bookings ativos?                             │
│    └─ Não existe Booking (REQUESTED/CONFIRMED/IN_PROGRESS)             │
│       que sobreponha o slot                                            │
│                                                                         │
│ 5. ✅ NÃO está no passado?                                             │
│    └─ slot.start >= agora                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Se TODAS as condições forem atendidas → slot.available = true
Se QUALQUER condição falhar → slot.available = false
```

### 10.3 Exemplo Completo

```
Dados:
- Tenant: openTime=08:00, closeTime=18:00
- Data: 2026-01-22 (Quinta-feira)
- Profissional: Maria
- Maria Availability: THURSDAY 08:00-12:00, 14:00-18:00
- Maria ScheduleBlock: 2026-01-22 10:00-11:00 (consulta médica)
- Booking existente: 2026-01-22 15:00-16:00 (CONFIRMED)
- SlotRule: INTERVAL 60min
- Serviço: Corte (60min)

Slots gerados (INTERVAL 60min):
08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00

Verificação de cada slot:
┌───────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   Slot    │ Horário Com. │ Disponib.    │ Bloqueio     │ Conflito     │
├───────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ 08:00-09:00 ✅         │ ✅ (08-12)   │ ✅           │ ✅           │ → DISPONÍVEL
│ 09:00-10:00 ✅         │ ✅ (08-12)   │ ✅           │ ✅           │ → DISPONÍVEL
│ 10:00-11:00 ✅         │ ✅ (08-12)   │ ❌ (bloqueio)│ -            │ → INDISPONÍVEL
│ 11:00-12:00 ✅         │ ✅ (08-12)   │ ✅           │ ✅           │ → DISPONÍVEL
│ 12:00-13:00 ✅         │ ❌ (almoço)  │ -            │ -            │ → INDISPONÍVEL
│ 13:00-14:00 ✅         │ ❌ (almoço)  │ -            │ -            │ → INDISPONÍVEL
│ 14:00-15:00 ✅         │ ✅ (14-18)   │ ✅           │ ✅           │ → DISPONÍVEL
│ 15:00-16:00 ✅         │ ✅ (14-18)   │ ✅           │ ❌ (booking) │ → INDISPONÍVEL
│ 16:00-17:00 ✅         │ ✅ (14-18)   │ ✅           │ ✅           │ → DISPONÍVEL
│ 17:00-18:00 ✅         │ ✅ (14-18)   │ ✅           │ ✅           │ → DISPONÍVEL
└───────────┴──────────────┴──────────────┴──────────────┴──────────────┘

Resposta da API:
[
  { "startTime": "08:00", "endTime": "09:00", "available": true },
  { "startTime": "09:00", "endTime": "10:00", "available": true },
  { "startTime": "10:00", "endTime": "11:00", "available": false },
  { "startTime": "11:00", "endTime": "12:00", "available": true },
  { "startTime": "12:00", "endTime": "13:00", "available": false },
  { "startTime": "13:00", "endTime": "14:00", "available": false },
  { "startTime": "14:00", "endTime": "15:00", "available": true },
  { "startTime": "15:00", "endTime": "16:00", "available": false },
  { "startTime": "16:00", "endTime": "17:00", "available": true },
  { "startTime": "17:00", "endTime": "18:00", "available": true }
]
```

---

## 11. 📊 Exceções do Sistema

### 11.1 Tipos de Exceção

| Exceção | HTTP Status | Descrição |
|---------|-------------|-----------|
| `NotFoundException` | 404 | Entidade não encontrada |
| `ValidationException` | 400 | Regras de negócio violadas |
| `IllegalArgumentException` | 400 | Dados inválidos (ex: duplicados) |
| `MethodArgumentNotValidException` | 400 | Validação de campos (Bean Validation) |

### 11.2 Mensagens Comuns

#### NotFoundException
```
"Customer not found: {id}"
"Professional not found: {id}"
"Service not found: {id}"
"Tenant not found: {id}"
"Booking not found: {id}"
```

#### ValidationException
```
"Start time is before business hours"
"End time is after business hours"
"Professional is not available at this time"
"Professional has a schedule block at this time"
"Time slot is already booked"
"Professional does not perform this service"
"Service is not active"
"Professional is not active"
"Booking is already cancelled"
"Cannot cancel a completed booking"
"Cannot reschedule a cancelled booking"
"Cannot reschedule a completed booking"
"Customer with CPF {cpf} already exists"
"Customer with phone {phone} already exists"
"Birth date cannot be in the future"
"Professional and Service must belong to the same tenant"
```

---

## 12. 📐 Diagrama de Relacionamentos

```
                                  ┌──────────────────┐
                                  │      TENANT      │
                                  │                  │
                                  │ - id             │
                                  │ - slug (unique)  │
                                  │ - name           │
                                  │ - taxId (unique) │
                                  │ - openTime       │
                                  │ - closeTime      │
                                  │ - timezone       │
                                  │ - active         │
                                  └────────┬─────────┘
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           │                               │                               │
           │                               │                               │
           ▼                               ▼                               ▼
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│   PROFESSIONAL   │            │    CUSTOMER      │            │     SERVICE      │
│                  │            │                  │            │                  │
│ - id             │            │ - id             │            │ - id             │
│ - name           │            │ - cpf            │            │ - name           │
│ - active         │            │ - phone          │            │ - durationMin    │
│ - tenant_id (FK) │            │ - name           │            │ - price          │
└────────┬─────────┘            │ - nickname       │            │ - active         │
         │                      │ - birthDate      │            │ - tenant_id (FK) │
         │                      │ - active         │            └────────┬─────────┘
         │                      │ - tenant_id (FK) │                     │
         │                      └────────┬─────────┘                     │
         │                               │                               │
    ┌────┴────┬─────────────────────────┐│                               │
    │         │                         ││                               │
    ▼         ▼                         ││          ┌────────────────────┘
┌────────┐ ┌──────────────┐             ││          │
│ AVAIL- │ │ SCHEDULE-    │             ││          │
│ ABILITY│ │ BLOCK        │             ││          │
│        │ │              │             ││          ▼
│- id    │ │ - id         │             ││   ┌──────────────────────────────┐
│- dayOf │ │ - startTime  │             ││   │   PROFESSIONAL_SERVICE       │
│  Week  │ │ - endTime    │             ││   │                              │
│- start │ │ - reason     │             ││   │ - id                         │
│- end   │ │ - prof_id    │             ││   │ - professional_id (FK)       │◄──┐
│- active│ │              │             ││   │ - service_id (FK)            │   │
│- prof  │ └──────────────┘             ││   │ - customPrice                │   │
│  _id   │                              ││   │ - customDurationMinutes      │   │
└────────┘                              ││   │ - active                     │   │
                                        ││   └──────────────────────────────┘   │
                                        ││                                      │
                                        ▼▼                                      │
                               ┌──────────────────┐                             │
                               │     BOOKING      │                             │
                               │                  │                             │
                               │ - id             │                             │
                               │ - startTime      │                             │
                               │ - endTime        │                             │
                               │ - status         │                             │
                               │ - notes          │                             │
                               │ - price          │                             │
                               │ - createdAt      │                             │
                               │ - cancellation-  │                             │
                               │   Reason         │                             │
                               │ - customer_id    │◄────────────────────────────┤
                               │ - professional_  │◄────────────────────────────┤
                               │   id             │                             │
                               │ - service_id     │◄────────────────────────────┘
                               │ - tenant_id      │
                               └──────────────────┘


                               ┌──────────────────┐
                               │    SLOT_RULE     │
                               │                  │
                               │ - id             │
                               │ - mode           │
                               │ - intervalMin    │
                               │ - bufferMin      │
                               │ - tenant_id (FK) │
                               └────────┬─────────┘
                                        │
                                        │ 1:N
                                        ▼
                               ┌──────────────────┐
                               │   FIXED_TIME     │
                               │                  │
                               │ - id             │
                               │ - time           │
                               │ - slotRule_id    │
                               └──────────────────┘
```

---

## 13. 📋 Resumo das Regras por Entidade

### Tenant
| Código | Regra |
|--------|-------|
| RN-T01 | Slug único entre tenants ativos (reativa inativo) |
| RN-T02 | TaxId único entre tenants ativos |
| RN-T03 | Horário comercial define janela de agendamento |

### Customer
| Código | Regra |
|--------|-------|
| RN-C01 | CPF único por tenant |
| RN-C02 | Telefone único por tenant |
| RN-C03 | Data de nascimento não pode ser futura |
| RN-C04 | Soft delete (active=false) |
| RN-C05 | Upsert por telefone |
| RN-C06 | Validação de duplicidade em atualização |

### Professional
| Código | Regra |
|--------|-------|
| RN-P01 | Soft delete (active=false) |
| RN-P02 | Verificação de serviço via performsService() |
| RN-P03 | Lista de serviços ativos |

### Availability
| Código | Regra |
|--------|-------|
| RN-A01 | Múltiplas disponibilidades por dia |
| RN-A02 | Validação em agendamentos |
| RN-A03 | Disponibilidade vs horário comercial |

### ScheduleBlock
| Código | Regra |
|--------|-------|
| RN-SB01 | Bloqueio impede agendamentos |
| RN-SB02 | Verificação de sobreposição |
| RN-SB03 | Bloqueios são pontuais (data específica) |

### Service
| Código | Regra |
|--------|-------|
| RN-S01 | Soft delete (active=false) |
| RN-S02 | Duração define horário de término |
| RN-S03 | Método getDuration() |
| RN-S04 | Lista de profissionais ativos |

### ProfessionalService
| Código | Regra |
|--------|-------|
| RN-PS01 | Unicidade de associação |
| RN-PS02 | Reativação de associação inativa |
| RN-PS03 | Preço efetivo (custom ou padrão) |
| RN-PS04 | Duração efetiva (custom ou padrão) |
| RN-PS05 | Exemplo de preço/duração |
| RN-PS06 | Validação de tenant |
| RN-PS07 | Soft delete (unassign) |

### Booking
| Código | Regra |
|--------|-------|
| RN-B01 | Validação de existência de entidades |
| RN-B02 | Validação de tenant (multi-tenancy) |
| RN-B03 | Validação de status ativo |
| RN-B04 | Validação de serviço do profissional |
| RN-B05 | Validação de horário comercial |
| RN-B06 | Validação de disponibilidade do profissional |
| RN-B07 | Validação de bloqueios de agenda |
| RN-B08 | Validação de conflitos com outros bookings |
| RN-B09 | Cálculo do preço |
| RN-B10 | Cálculo do horário de término |
| RN-B11 | Restrições de cancelamento |
| RN-B12 | Processo de cancelamento |
| RN-B13 | Restrições de reagendamento |
| RN-B14 | Processo de reagendamento |

---

**Documento gerado em:** Janeiro de 2026  
**Sistema:** MAVI - Sistema de Agendamento Multi-tenant  
**Versão:** 1.0
