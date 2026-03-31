import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart, Users, FolderOpen } from "lucide-react";

const ClientDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, categories: 0 });
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    if (!profile?.company_id) return;
    const fetch = async () => {
      const { data: stores } = await supabase.from("stores").select("id, name").eq("company_id", profile.company_id!).limit(1);
      const storeId = stores?.[0]?.id;
      setStoreName(stores?.[0]?.name || "");
      if (!storeId) return;
      const [p, o, c, cat] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeId),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeId),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("store_id", storeId),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      ]);
      setStats({ products: p.count || 0, orders: o.count || 0, customers: c.count || 0, categories: cat.count || 0 });
    };
    fetch();
  }, [profile?.company_id]);

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
        <p className="text-muted-foreground">Visão geral da sua loja</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientDashboard;
