# mavi-front

Painel web administrativo do sistema **MAVI** — agendamento de atendimentos com suporte a multi-tenancy. Desenvolvido com React 18, TypeScript e Vite.

## 📁 Estrutura de Diretórios

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx          # Proteção de rotas por role
│   ├── bookings/
│   │   └── RescheduleDialog.tsx        # Dialog de reagendamento
│   ├── common/                         # Componentes reutilizáveis
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── PageHeader.tsx
│   │   ├── SearchInput.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── AppSidebar.tsx              # Sidebar principal com navegação
│   │   └── MainLayout.tsx              # Layout base com sidebar e outlet
│   ├── professionals/
│   │   ├── ManageAvailabilityDialog.tsx
│   │   ├── ManageScheduleBlocksDialog.tsx
│   │   └── ManageServicesDialog.tsx
│   ├── ui/                             # Componentes shadcn/ui (Radix UI)
│   ├── NavLink.tsx
│   └── TenantSelector.tsx              # Seletor de tenant ativo
│
├── contexts/
│   ├── AuthContext.tsx                 # Autenticação e role do usuário
│   └── TenantContext.tsx               # Tenant selecionado (multi-tenancy)
│
├── hooks/
│   ├── api/                            # Hooks de acesso à API (React Query)
│   │   ├── useAuth.ts
│   │   ├── useAvailabilities.ts
│   │   ├── useAvailableSlots.ts
│   │   ├── useBookings.ts
│   │   ├── useCustomers.ts
│   │   ├── useProfessionalServices.ts
│   │   ├── useProfessionals.ts
│   │   ├── useScheduleBlocks.ts
│   │   ├── useServices.ts
│   │   ├── useSlotRules.ts
│   │   ├── useTenants.ts
│   │   └── index.ts
│   ├── index.ts                        # Re-exportações centralizadas
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── lib/
│   ├── api.ts                          # Singleton ApiClient (todos os endpoints)
│   ├── booking-utils.tsx               # Utilitários de agendamento
│   ├── formatters.ts                   # Formatadores de data, moeda, etc.
│   ├── permissions.ts                  # Mapeamento de roles → home e permissões
│   ├── schemas.ts                      # Schemas Zod dos formulários
│   └── utils.ts                        # Utilitários gerais (cn, etc.)
│
├── pages/
│   ├── BookingsPage.tsx                # Gestão de agendamentos (ADMIN/OWNER/EMPLOYEE)
│   ├── CustomersPage.tsx               # Cadastro de clientes (ADMIN/OWNER)
│   ├── Dashboard.tsx                   # Painel com estatísticas (ADMIN/OWNER)
│   ├── ForbiddenPage.tsx               # Página 403
│   ├── LoginPage.tsx                   # Autenticação
│   ├── MyBookingsPage.tsx              # Meus agendamentos (CLIENT)
│   ├── NotFound.tsx                    # Página 404
│   ├── ProfessionalsPage.tsx           # Gestão de profissionais (ADMIN/OWNER)
│   ├── ServicesPage.tsx                # Cadastro de serviços (ADMIN/OWNER)
│   ├── SettingsPage.tsx                # Configurações do sistema (ADMIN)
│   └── TenantsPage.tsx                 # Gestão de estabelecimentos (ADMIN/OWNER)
│
├── test/                               # Testes (Vitest)
│   ├── components/
│   ├── hooks/
│   ├── example.test.ts
│   └── setup.ts
│
├── types/
│   └── api.ts                          # Tipos TypeScript espelho dos DTOs do backend
│
├── App.tsx                             # Raiz: providers + roteamento
├── index.css                           # Design tokens e estilos globais
├── main.tsx                            # Ponto de entrada
└── vite-env.d.ts
```

## 🏗️ Arquitetura

### Camadas

1. **Apresentação** (`pages/`, `components/`)
   - Componentes de UI e páginas carregadas via `React.lazy`
   - shadcn/ui (Radix UI) como base de componentes

2. **Estado** (`contexts/`, `hooks/api/`)
   - `AuthContext` — usuário autenticado e role
   - `TenantContext` — tenant selecionado
   - Hooks React Query para cache e sincronização com o backend

3. **Dados** (`lib/api.ts`, `types/api.ts`)
   - Singleton `ApiClient` centraliza todos os chamadas HTTP
   - Envia automaticamente os headers `X-API-Key` e `X-Tenant-Id`
   - Tipos TypeScript sincronizados com os DTOs do backend

### Multi-Tenancy

Toda requisição inclui `X-Tenant-Id` via header. O tenant ativo é gerenciado pelo `TenantContext` e pode ser trocado com o `TenantSelector` na sidebar.

### Autenticação e Roles

Autenticação via `X-API-Key`. O `ProtectedRoute` controla o acesso por role:

| Role       | Acesso                                                      |
|------------|-------------------------------------------------------------|
| `ADMIN`    | Acesso total (todos os módulos + configurações)             |
| `OWNER`    | Dashboard, profissionais, serviços, clientes, agendamentos  |
| `EMPLOYEE` | Apenas agendamentos                                         |
| `CLIENT`   | Apenas seus próprios agendamentos (`/my-bookings`)          |

### Rotas

| Rota             | Página            | Roles permitidos         |
|------------------|-------------------|--------------------------|
| `/login`         | LoginPage         | Pública                  |
| `/`              | HomeRedirect      | Qualquer autenticado     |
| `/dashboard`     | Dashboard         | ADMIN, OWNER             |
| `/tenants`       | TenantsPage       | ADMIN, OWNER             |
| `/professionals` | ProfessionalsPage | ADMIN, OWNER             |
| `/services`      | ServicesPage      | ADMIN, OWNER             |
| `/customers`     | CustomersPage     | ADMIN, OWNER             |
| `/bookings`      | BookingsPage      | ADMIN, OWNER, EMPLOYEE   |
| `/my-bookings`   | MyBookingsPage    | ADMIN, CLIENT            |
| `/settings`      | SettingsPage      | ADMIN                    |
| `/forbidden`     | ForbiddenPage     | Pública                  |

## 🎨 Design System

Tokens de design definidos em `index.css` e `tailwind.config.ts`:

- **Cores**: Paleta HSL com suporte a tema claro/escuro
- **Tipografia**: Inter como fonte principal
- **Componentes**: shadcn/ui customizados

## 📦 Principais Dependências

| Pacote                  | Versão    | Finalidade                  |
|-------------------------|-----------|-----------------------------|
| react                   | ^18.3.1   | Biblioteca de UI            |
| react-router-dom        | ^6.30.1   | Roteamento                  |
| @tanstack/react-query   | ^5.83.0   | Cache e estado do servidor  |
| react-hook-form         | ^7.61.1   | Formulários                 |
| zod                     | —         | Validação de schemas        |
| shadcn/ui + Radix UI    | —         | Componentes de UI           |
| tailwindcss             | —         | Estilização utilitária      |
| date-fns                | ^3.6.0    | Manipulação de datas        |
| lucide-react            | ^0.462.0  | Ícones                      |
| recharts                | ^2.15.4   | Gráficos no Dashboard       |

## 🚀 Scripts

```bash
npm run dev          # Servidor de desenvolvimento (proxy para localhost:8080)
npm run build        # Build de produção
npm run build:dev    # Build em modo development
npm run preview      # Preview do build
npm run test         # Executar testes (Vitest)
npm run test:watch   # Testes em modo watch
npm run lint         # Verificar código com ESLint
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
VITE_API_URL=              # Base da API (vazio = relativo; proxy Vite em dev, Nginx em prod)
VITE_API_KEY=mavi-dev-key-123  # Chave de API (default para dev)
```

Em desenvolvimento o Vite faz proxy de `/api` para `http://localhost:8080`, então `VITE_API_URL` pode ser deixado em branco.

### Convenções Obrigatórias

- Todo acesso à API passa pelo `ApiClient` em `src/lib/api.ts` — nunca use `fetch` diretamente nas páginas.
- Hooks de dados ficam em `src/hooks/api/` e são exportados via `src/hooks/index.ts`.
- Schemas de validação de formulários ficam em `src/lib/schemas.ts`.
- Tipos espelho dos DTOs do backend ficam em `src/types/api.ts` — mantenha sincronizado com o backend.
