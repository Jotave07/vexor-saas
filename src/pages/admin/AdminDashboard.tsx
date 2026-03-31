import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, CreditCard, Users, TrendingUp, AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeStores: 0,
    inactiveStores: 0,
    defaultingCompanies: 0,
    totalUsers: 0,
    trialCompanies: 0,
  });
  const [recentCompanies, setRecentCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [companiesRes, storesRes, activeStoresRes, usersRes, defaultingRes, trialRes, recentRes] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "defaulting"),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "trial"),
        supabase.from("companies").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        totalCompanies: companiesRes.count || 0,
        activeStores: activeStoresRes.count || 0,
        inactiveStores: storesRes.count || 0,
        defaultingCompanies: defaultingRes.count || 0,
        totalUsers: usersRes.count || 0,
        trialCompanies: trialRes.count || 0,
      });
      setRecentCompanies(recentRes.data || []);
    };
    fetchData();
  }, []);

  const cards = [
    { icon: Building2, label: "Empresas", value: stats.totalCompanies, color: "text-primary" },
    { icon: Store, label: "Lojas Ativas", value: stats.activeStores, color: "text-accent" },
    { icon: Store, label: "Lojas Inativas", value: stats.inactiveStores, color: "text-muted-foreground" },
    { icon: AlertTriangle, label: "Inadimplentes", value: stats.defaultingCompanies, color: "text-destructive" },
    { icon: Users, label: "Usuários", value: stats.totalUsers, color: "text-primary" },
    { icon: TrendingUp, label: "Em Teste", value: stats.trialCompanies, color: "text-accent" },
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
        <p className="text-muted-foreground">Visão geral da plataforma</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Empresas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentCompanies.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[c.status]?.className || ""}`}>
                    {statusLabels[c.status]?.label || c.status}
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
