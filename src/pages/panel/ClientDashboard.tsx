import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Users, FolderOpen, Loader2, ArrowRight, Store } from "lucide-react";
import { api } from "@/lib/api";

const ClientDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, categories: 0 });
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const response = await api.get<{ store: { name: string; slug?: string } | null; stats: typeof stats }>("/api/client/dashboard");
      setStoreName(response.store?.name || "");
      setStoreSlug(response.store?.slug || "");
      setStats(response.stats);
      setLoading(false);
    };

    fetchDashboard().catch(() => setLoading(false));
  }, []);

  const cards = [
    { icon: Package, label: "Produtos", value: stats.products, color: "text-primary", bg: "bg-primary/10", link: "/panel/products" },
    { icon: ShoppingCart, label: "Pedidos", value: stats.orders, color: "text-accent", bg: "bg-accent/10", link: "/panel/orders" },
    { icon: Users, label: "Clientes", value: stats.customers, color: "text-primary", bg: "bg-primary/10", link: "/panel/customers" },
    { icon: FolderOpen, label: "Categorias", value: stats.categories, color: "text-accent", bg: "bg-accent/10", link: "/panel/categories" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header">
          <h1>{storeName || "Dashboard"}</h1>
          <p>Visão geral da sua loja.</p>
        </div>
        {storeSlug && (
          <Link to={`/shop/${storeSlug}`} target="_blank">
            <Button variant="outline" className="gap-2">
              <Store className="h-4 w-4" />
              Ver loja pública
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.link}>
            <Card className="stat-card group cursor-pointer">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`rounded-lg p-1.5 ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {stats.products === 0 && stats.orders === 0 && (
        <Card className="border-border/50 glass-card">
          <CardContent className="p-8">
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <p className="empty-state-title">Comece a configurar sua loja</p>
              <p className="empty-state-description">Cadastre seus primeiros produtos e categorias para começar a vender.</p>
              <div className="mt-6 flex gap-3">
                <Link to="/panel/products"><Button className="bg-gradient-primary text-primary-foreground">Cadastrar produto</Button></Link>
                <Link to="/panel/settings"><Button variant="outline">Configurações</Button></Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientDashboard;
