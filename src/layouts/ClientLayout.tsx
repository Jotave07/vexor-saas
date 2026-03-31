import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Users,
  Tag, Image, Settings, LogOut, ShoppingBag, Menu, X, ChevronLeft, ChevronRight
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

  const SidebarContent = ({ isMobile = false }) => (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300",
        isMobile ? "w-64 fixed inset-y-0 left-0 z-50" : collapsed ? "w-16" : "w-64",
        !isMobile && "hidden lg:flex"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {(!collapsed || isMobile) && (
          <Link to="/panel" className="flex items-center gap-2 font-heading font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <ShoppingBag className="h-4 w-4 text-primary-foreground" />
            </div>
            Painel
          </Link>
        )}
        {!isMobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarContent />
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-background/80 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <SidebarContent isMobile />
        </>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:px-6">
          <button className="lg:hidden text-foreground" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{profile?.full_name}</span>
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
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
