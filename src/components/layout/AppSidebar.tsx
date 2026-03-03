import {
  Building2,
  Calendar,
  Users,
  Scissors,
  LayoutDashboard,
  Settings,
  UserCircle,
  LogOut,
  BarChart3,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TenantSelector } from "@/components/TenantSelector";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/types/api";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[];
  group: "main" | "admin";
}

// Configuração central dos itens de menu com roles permitidos
const MENU_ITEMS: MenuItem[] = [
  { title: "Dashboard",        url: "/dashboard",     icon: LayoutDashboard, roles: ["ADMIN", "OWNER"],                       group: "main" },
  { title: "Agendamentos",     url: "/bookings",      icon: Calendar,        roles: ["ADMIN", "OWNER", "EMPLOYEE"],            group: "main" },
  { title: "Meus Agendamentos",url: "/my-bookings",   icon: Calendar,        roles: ["CLIENT"],                               group: "main" },
  { title: "Clientes",         url: "/customers",     icon: Users,           roles: ["ADMIN", "OWNER"],                       group: "main" },
  { title: "Profissionais",    url: "/professionals", icon: UserCircle,      roles: ["ADMIN", "OWNER"],                       group: "main" },
  { title: "Serviços",         url: "/services",      icon: Scissors,        roles: ["ADMIN", "OWNER"],                       group: "main" },
  { title: "Relatórios",       url: "/reports",       icon: BarChart3,       roles: ["ADMIN", "OWNER"],                       group: "main" },
  { title: "Estabelecimentos", url: "/tenants",       icon: Building2,       roles: ["ADMIN"],                                group: "admin" },
  { title: "Configurações",    url: "/settings",      icon: Settings,        roles: ["ADMIN"],                                group: "admin" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const auth = useAuth();
  const userRole = auth.user?.role;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const visibleItems = (group: "main" | "admin") =>
    MENU_ITEMS.filter(
      (item) => item.group === group && userRole && item.roles.includes(userRole)
    );

  const mainItems = visibleItems("main");
  const adminItems = visibleItems("admin");

  // Exibir seletor de tenant apenas para ADMIN e para OWNER com múltiplos tenants
  const showTenantSelector =
    !collapsed &&
    (userRole === "ADMIN" ||
      (userRole === "OWNER" && (auth.user?.tenantIds.length ?? 0) > 1));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">MAVI</h1>
              <p className="text-xs text-sidebar-foreground/60">Sistema de Agendamentos</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {showTenantSelector && (
          <div className="p-4">
            <TenantSelector />
          </div>
        )}

        {mainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={auth.logout}
            title="Sair"
            className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {auth.user?.name ?? "—"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {auth.user?.email ?? ""}
                </p>
              </div>
              {userRole && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {ROLE_LABELS[userRole]}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={auth.logout}
              className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
