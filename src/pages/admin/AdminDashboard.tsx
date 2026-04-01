import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeStores: 0,
    inactiveStores: 0,
    defaultingCompanies: 0,
    totalUsers: 0,
    trialCompanies: 0,
    recurringRevenue: 0,
  });
  const [recentCompanies, setRecentCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get<{ stats: typeof stats; recentCompanies: any[] }>("/api/admin/dashboard");
      setStats(response.stats);
      setRecentCompanies(response.recentCompanies || []);
    };

    fetchData().catch(console.error);
  }, []);

  const cards = [
    { icon: Building2, label: "Empresas", value: stats.totalCompanies, color: "text-primary" },
    { icon: Store, label: "Lojas Ativas", value: stats.activeStores, color: "text-accent" },
    { icon: Store, label: "Lojas Inativas", value: stats.inactiveStores, color: "text-muted-foreground" },
    { icon: AlertTriangle, label: "Inadimplentes", value: stats.defaultingCompanies, color: "text-destructive" },
    { icon: Users, label: "Usuarios", value: stats.totalUsers, color: "text-primary" },
    { icon: TrendingUp, label: "MRR", value: `R$ ${Number(stats.recurringRevenue).toFixed(2)}`, color: "text-accent" },
  ];

  const statusLabels: Record<string, { label: string; className: string }> = {
    active: { label: "Ativo", className: "bg-accent/10 text-accent" },
    trial: { label: "Teste", className: "bg-primary/10 text-primary" },
    suspended: { label: "Suspenso", className: "bg-destructive/10 text-destructive" },
    cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
    defaulting: { label: "Inadimplente", className: "bg-destructive/10 text-destructive" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard Master</h1>
        <p className="text-muted-foreground">Visao geral da plataforma SaaS.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label} className="border-border/50 glass-card">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Empresas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.email}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${statusLabels[company.status]?.className || ""}`}>
                    {statusLabels[company.status]?.label || company.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
