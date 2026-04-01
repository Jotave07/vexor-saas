import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Users,
  Tag, Image, Settings, LogOut, ShoppingBag, Menu, X, ChevronLeft, ChevronRight, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/panel" },
  { icon: Package, label: "Produtos", path: "/panel/products" },
  { icon: FolderOpen, label: "Categorias", path: "/panel/categories" },
  { icon: ShoppingCart, label: "Pedidos", path: "/panel/orders" },
  { icon: Users, label: "Clientes", path: "/panel/customers" },
  { icon: Tag, label: "Cupons", path: "/panel/coupons" },
  { icon: Image, label: "Banners", path: "/panel/banners" },
  { icon: Truck, label: "Operação", path: "/panel/operations" },
  { icon: Settings, label: "Configurações", path: "/panel/settings" },
];

const ClientLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const SidebarInner = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300",
        isMobile ? "w-64 fixed inset-y-0 left-0 z-50 shadow-elevated" : collapsed ? "w-[68px]" : "w-64",
        !isMobile && "hidden lg:flex"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {(!collapsed || isMobile) && (
          <Link to="/panel" className="flex items-center gap-2.5 font-heading font-bold text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
              <ShoppingBag className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base">Minha Loja</span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
            <ShoppingBag className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        {!isMobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/panel" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {(!collapsed || isMobile) && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarInner />
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <SidebarInner isMobile />
        </>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden rounded-lg p-2 text-foreground hover:bg-muted" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <span className="rounded-lg bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Painel da Empresa
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">{profile?.full_name}</span>
            <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-primary/20">
              {profile?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
