# MAVI Services - Estrutura do Projeto

Sistema de Cadastro de Usuários e Agendamento de Atendimentos desenvolvido com React, TypeScript e Tailwind CSS.

## 📁 Estrutura de Diretórios

```
src/
├── components/                 # Componentes React reutilizáveis
│   ├── layout/                 # Componentes de layout da aplicação
│   │   ├── AppSidebar.tsx      # Sidebar principal com navegação
│   │   └── MainLayout.tsx      # Layout base com sidebar e outlet
│   ├── ui/                     # Componentes UI (shadcn/ui)
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── hover-card.tsx
│   │   ├── input-otp.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── resizable.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── toggle-group.tsx
│   │   ├── toggle.tsx
│   │   ├── tooltip.tsx
│   │   └── use-toast.ts
│   ├── NavLink.tsx             # Componente de link de navegação
│   └── TenantSelector.tsx      # Seletor de tenant (estabelecimento)
│
├── contexts/                   # Contextos React para estado global
│   └── TenantContext.tsx       # Contexto de multi-tenancy
│
├── hooks/                      # Hooks customizados
│   ├── use-mobile.tsx          # Hook para detecção de dispositivo móvel
│   └── use-toast.ts            # Hook para notificações toast
│
├── lib/                        # Bibliotecas e utilitários
│   ├── api.ts                  # Cliente API com todos os endpoints
│   └── utils.ts                # Funções utilitárias (cn, etc.)
│
├── pages/                      # Páginas da aplicação
│   ├── BookingsPage.tsx        # Gestão de agendamentos
│   ├── CustomersPage.tsx       # Cadastro de clientes
│   ├── Dashboard.tsx           # Painel principal com estatísticas
│   ├── NotFound.tsx            # Página 404
│   ├── ProfessionalsPage.tsx   # Gestão de profissionais
│   ├── ServicesPage.tsx        # Cadastro de serviços
│   ├── SettingsPage.tsx        # Configurações do sistema
│   └── TenantsPage.tsx         # Gestão de estabelecimentos
│
├── test/                       # Testes automatizados
│   ├── example.test.ts         # Exemplo de teste
│   └── setup.ts                # Configuração do Vitest
│
├── types/                      # Definições de tipos TypeScript
│   └── api.ts                  # Tipos da API (interfaces e enums)
│
├── App.css                     # Estilos específicos do App
├── App.tsx                     # Componente raiz com rotas
├── index.css                   # Estilos globais e design tokens
├── main.tsx                    # Ponto de entrada da aplicação
└── vite-env.d.ts               # Tipos do Vite
```

## 🏗️ Arquitetura

### Camadas

1. **Apresentação** (`pages/`, `components/`)
   - Componentes de UI e páginas
   - Usa shadcn/ui como biblioteca de componentes

2. **Estado** (`contexts/`, `hooks/`)
   - Gerenciamento de estado global (TenantContext)
   - React Query para cache e sincronização de dados

3. **Dados** (`lib/api.ts`, `types/`)
   - Cliente HTTP centralizado
   - Tipos TypeScript para toda a API

### Multi-Tenancy

O sistema suporta múltiplos estabelecimentos (tenants) através do `TenantContext`. Cada requisição inclui o header `X-Tenant-Id` para identificar o tenant ativo.

### Rotas

| Rota             | Página                | Descrição                      |
|------------------|----------------------|--------------------------------|
| `/`              | Dashboard            | Painel com estatísticas        |
| `/tenants`       | TenantsPage          | Gestão de estabelecimentos     |
| `/professionals` | ProfessionalsPage    | Gestão de profissionais        |
| `/services`      | ServicesPage         | Cadastro de serviços           |
| `/customers`     | CustomersPage        | Cadastro de clientes           |
| `/bookings`      | BookingsPage         | Gestão de agendamentos         |
| `/settings`      | SettingsPage         | Configurações do sistema       |

## 🎨 Design System

O projeto utiliza tokens de design definidos em `index.css` e `tailwind.config.ts`:

- **Cores**: Paleta HSL com suporte a tema claro/escuro
- **Tipografia**: Inter como fonte principal
- **Espaçamento**: Sistema baseado em rem
- **Componentes**: shadcn/ui customizados

## 📦 Principais Dependências

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes de UI
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado do servidor
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones
- **Zod** - Validação de schemas
- **React Hook Form** - Formulários

## 🚀 Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run test     # Executar testes
npm run lint     # Verificar código
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:8080/api  # URL base da API
```

### Conexão com Backend

Para conectar ao backend Spring Boot, atualize `VITE_API_URL` e remova os dados mock em `lib/api.ts`.
