import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Loader2, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  paid: { label: "Pago", className: "bg-accent/10 text-accent" },
  pending: { label: "Pendente", className: "bg-primary/10 text-primary" },
  overdue: { label: "Vencido", className: "bg-destructive/10 text-destructive" },
  failed: { label: "Falhou", className: "bg-destructive/10 text-destructive" },
  refunded: { label: "Reembolsado", className: "bg-muted text-muted-foreground" },
};

const subStatusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "bg-accent/10 text-accent" },
  trial: { label: "Teste", className: "bg-primary/10 text-primary" },
  expired: { label: "Expirada", className: "bg-destructive/10 text-destructive" },
  suspended: { label: "Suspensa", className: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
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
    fetchFinancial().catch(() => setLoading(false));
  }, [filter, search]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Financeiro</h1>
        <p>Controle de assinaturas e pagamentos da plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-accent/10 p-1.5"><DollarSign className="h-4 w-4 text-accent" /></div>
            </div>
            <p className="text-2xl font-heading font-bold">R$ {Number(summary.recurring_revenue || 0).toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Receita recorrente (MRR)</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-destructive/10 p-1.5"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
            </div>
            <p className="text-2xl font-heading font-bold text-destructive">{summary.overdue_payments || 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pagamentos em atraso</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-accent/10 p-1.5"><CheckCircle className="h-4 w-4 text-accent" /></div>
            </div>
            <p className="text-2xl font-heading font-bold text-accent">{summary.paid_payments || 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pagamentos confirmados</p>
          </CardContent>
        </Card>
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
        <CardHeader className="pb-3"><CardTitle className="text-base font-heading">Assinaturas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nenhuma assinatura encontrada.</TableCell></TableRow>
              ) : subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium text-sm">{sub.company_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{sub.plan_name}</TableCell>
                  <TableCell className="text-sm font-medium">R$ {Number(sub.amount).toFixed(2)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{sub.due_date ? new Date(sub.due_date).toLocaleDateString("pt-BR") : "-"}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${subStatusLabels[sub.status]?.className || ""}`}>
                      {subStatusLabels[sub.status]?.label || sub.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/50 glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-base font-heading">Histórico de Pagamentos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento registrado.</TableCell></TableRow>
              ) : payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.company_name}</TableCell>
                  <TableCell className="text-sm font-medium">R$ {Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{new Date(p.due_date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{p.paid_date ? new Date(p.paid_date).toLocaleDateString("pt-BR") : "-"}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${paymentStatusLabels[p.status]?.className || ""}`}>
                      {paymentStatusLabels[p.status]?.label || p.status}
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
