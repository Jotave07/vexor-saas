import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  paid: { label: "Pago", className: "bg-accent/10 text-accent" },
  pending: { label: "Pendente", className: "bg-primary/10 text-primary" },
  overdue: { label: "Vencido", className: "bg-destructive/10 text-destructive" },
  failed: { label: "Falhou", className: "bg-destructive/10 text-destructive" },
  refunded: { label: "Reembolsado", className: "bg-muted text-muted-foreground" },
};

const AdminFinancial = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [subsRes, payRes] = await Promise.all([
        supabase.from("subscriptions").select("*, companies(name, email, status), plans(name, price)").order("created_at", { ascending: false }),
        supabase.from("payment_history").select("*, companies(name)").order("due_date", { ascending: false }).limit(50),
      ]);
      setSubscriptions(subsRes.data || []);
      setPayments(payRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filteredSubs = subscriptions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search && !s.companies?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground">Controle de assinaturas e pagamentos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar empresa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="trial">Em Teste</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="suspended">Suspensas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader><CardTitle className="text-lg font-heading">Assinaturas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filteredSubs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma assinatura</TableCell></TableRow>
              ) : filteredSubs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.companies?.name}</TableCell>
                  <TableCell>{s.plans?.name}</TableCell>
                  <TableCell>R$ {Number(s.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{s.due_date ? new Date(s.due_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      s.status === "active" ? "bg-accent/10 text-accent" :
                      s.status === "trial" ? "bg-primary/10 text-primary" :
                      "bg-destructive/10 text-destructive"
                    }`}>{s.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader><CardTitle className="text-lg font-heading">Histórico de Pagamentos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum pagamento registrado</TableCell></TableRow>
              ) : payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.companies?.name}</TableCell>
                  <TableCell>R$ {Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(p.due_date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-muted-foreground">{p.paid_date ? new Date(p.paid_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${paymentStatusLabels[p.status]?.className}`}>
                      {paymentStatusLabels[p.status]?.label}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinancial;
