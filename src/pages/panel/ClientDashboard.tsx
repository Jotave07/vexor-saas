import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart, Users, FolderOpen } from "lucide-react";
import { api } from "@/lib/api";

const ClientDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, categories: 0 });
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      const response = await api.get<{ store: { name: string } | null; stats: typeof stats }>("/api/client/dashboard");
      setStoreName(response.store?.name || "");
      setStats(response.stats);
    };

    fetchDashboard().catch(console.error);
  }, []);

  const cards = [
    { icon: Package, label: "Produtos", value: stats.products },
    { icon: ShoppingCart, label: "Pedidos", value: stats.orders },
    { icon: Users, label: "Clientes", value: stats.customers },
    { icon: FolderOpen, label: "Categorias", value: stats.categories },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">{storeName || "Dashboard"}</h1>
        <p className="text-muted-foreground">Visao geral da sua loja.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="border-border/50 glass-card">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <card.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientDashboard;
