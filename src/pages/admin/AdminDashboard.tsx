import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, Users, TrendingUp, AlertTriangle, Clock, Loader2 } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get<{ stats: typeof stats; recentCompanies: any[] }>("/api/admin/dashboard");
      setStats(response.stats);
      setRecentCompanies(response.recentCompanies || []);
      setLoading(false);
    };

    fetchData().catch(() => setLoading(false));
  }, []);

  const cards = [
    { icon: Building2, label: "Empresas", value: stats.totalCompanies, color: "text-primary", bg: "bg-primary/10" },
    { icon: Store, label: "Lojas Ativas", value: stats.activeStores, color: "text-accent", bg: "bg-accent/10" },
    { icon: Store, label: "Lojas Inativas", value: stats.inactiveStores, color: "text-muted-foreground", bg: "bg-muted" },
    { icon: AlertTriangle, label: "Inadimplentes", value: stats.defaultingCompanies, color: "text-destructive", bg: "bg-destructive/10" },
    { icon: Users, label: "Usuários", value: stats.totalUsers, color: "text-primary", bg: "bg-primary/10" },
    { icon: TrendingUp, label: "MRR", value: `R$ ${Number(stats.recurringRevenue).toFixed(2)}`, color: "text-accent", bg: "bg-accent/10" },
  ];

  const statusLabels: Record<string, { label: string; className: string }> = {
    active: { label: "Ativo", className: "bg-accent/10 text-accent" },
    trial: { label: "Teste", className: "bg-primary/10 text-primary" },
    suspended: { label: "Suspenso", className: "bg-destructive/10 text-destructive" },
    cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
    defaulting: { label: "Inadimplente", className: "bg-destructive/10 text-destructive" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Dashboard Master</h1>
        <p>Visão geral da plataforma SaaS.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label} className="stat-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`rounded-lg p-1.5 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-heading">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Empresas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentCompanies.length === 0 ? (
            <div className="empty-state py-10">
              <Building2 className="empty-state-icon" />
              <p className="empty-state-title">Nenhuma empresa cadastrada</p>
              <p className="empty-state-description">Cadastre a primeira empresa no menu "Empresas" para começar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {company.name?.[0]?.toUpperCase() || "E"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.email || "Sem email"}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusLabels[company.status]?.className || ""}`}>
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
