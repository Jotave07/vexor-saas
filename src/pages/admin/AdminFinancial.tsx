import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

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
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchFinancial = async () => {
      setLoading(true);
      const query = new URLSearchParams();
      if (filter !== "all") query.set("filter", filter);
      if (search) query.set("search", search);
      const response = await api.get<{ subscriptions: any[]; payments: any[]; summary: any }>(`/api/admin/financial?${query.toString()}`);
      setSubscriptions(response.subscriptions || []);
      setPayments(response.payments || []);
      setSummary(response.summary || {});
      setLoading(false);
    };

    fetchFinancial().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, [filter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground">Controle de assinaturas e pagamentos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Receita recorrente</p><p className="text-2xl font-heading font-bold">R$ {Number(summary.recurring_revenue || 0).toFixed(2)}</p></CardContent></Card>
        <Card className="border-border/50 glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pagamentos em atraso</p><p className="text-2xl font-heading font-bold text-destructive">{summary.overdue_payments || 0}</p></CardContent></Card>
        <Card className="border-border/50 glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pagamentos confirmados</p><p className="text-2xl font-heading font-bold text-accent">{summary.paid_payments || 0}</p></CardContent></Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar empresa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="trial">Em teste</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="suspended">Suspensas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50 glass-card">
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
                <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma assinatura.</TableCell></TableRow>
              ) : subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">{subscription.company_name}</TableCell>
                  <TableCell>{subscription.plan_name}</TableCell>
                  <TableCell>R$ {Number(subscription.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{subscription.due_date ? new Date(subscription.due_date).toLocaleDateString("pt-BR") : "-"}</TableCell>
                  <TableCell>{subscription.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/50 glass-card">
        <CardHeader><CardTitle className="text-lg font-heading">Historico de Pagamentos</CardTitle></CardHeader>
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
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum pagamento registrado.</TableCell></TableRow>
              ) : payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.company_name}</TableCell>
                  <TableCell>R$ {Number(payment.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(payment.due_date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString("pt-BR") : "-"}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${paymentStatusLabels[payment.status]?.className || ""}`}>
                      {paymentStatusLabels[payment.status]?.label || payment.status}
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
