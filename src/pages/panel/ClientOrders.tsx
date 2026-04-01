import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-primary/10 text-primary" },
  confirmed: { label: "Confirmado", className: "bg-accent/10 text-accent" },
  processing: { label: "Processando", className: "bg-primary/10 text-primary" },
  shipped: { label: "Enviado", className: "bg-accent/10 text-accent" },
  delivered: { label: "Entregue", className: "bg-accent/10 text-accent" },
  cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
  refunded: { label: "Reembolsado", className: "bg-muted text-muted-foreground" },
};

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-primary/10 text-primary" },
  paid: { label: "Pago", className: "bg-accent/10 text-accent" },
  failed: { label: "Falhou", className: "bg-destructive/10 text-destructive" },
  refunded: { label: "Reembolsado", className: "bg-muted text-muted-foreground" },
};

const ClientOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchOrders = async () => {
    const response = await api.get<{ orders: any[] }>("/api/client/orders");
    setOrders(response.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders().catch(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/api/client/orders/${orderId}/status`, { status });
      toast({ title: "Status atualizado!" });
      await fetchOrders();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openDetails = async (orderId: string) => {
    try {
      const response = await api.get<any>(`/api/client/orders/${orderId}`);
      setSelectedOrder(response);
      setDetailsOpen(true);
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Pedidos</h1>
        <p>Gerencie os pedidos da sua loja ({orders.length} pedidos).</p>
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="hidden lg:table-cell">Entrega</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="empty-state py-12">
                      <ShoppingCart className="empty-state-icon" />
                      <p className="empty-state-title">Nenhum pedido</p>
                      <p className="empty-state-description">Os pedidos realizados na loja pública aparecerão aqui.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-sm">#{order.order_number}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{order.customer_name || "-"}</TableCell>
                  <TableCell className="text-sm font-medium">R$ {Number(order.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${paymentStatusLabels[order.payment_status]?.className || "bg-muted text-muted-foreground"}`}>
                      {paymentStatusLabels[order.payment_status]?.label || order.payment_status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{order.delivery_status || "-"}</TableCell>
                  <TableCell>
                    <Select defaultValue={order.status} onValueChange={(value) => updateStatus(order.id, value)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetails(order.id)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-heading">Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {!selectedOrder ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/50">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Informações do Pedido</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Número</span><span className="font-medium">#{selectedOrder.order.order_number}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span>{selectedOrder.order.customer_name || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedOrder.order.customer_email || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pagamento</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusLabels[selectedOrder.order.payment_status]?.className || ""}`}>{paymentStatusLabels[selectedOrder.order.payment_status]?.label || selectedOrder.order.payment_status}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">R$ {Number(selectedOrder.order.total).toFixed(2)}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Itens ({selectedOrder.items.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                        <span className="font-medium">R$ {Number(item.total_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Histórico</h3>
                  {selectedOrder.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum registro.</p>
                  ) : selectedOrder.history.map((entry: any) => (
                    <div key={entry.id} className="text-sm border-l-2 border-border pl-3">
                      <p className="text-foreground">{entry.note || `${entry.from_status || "-"} → ${entry.to_status || "-"}`}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Transações</h3>
                  {selectedOrder.payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma transação.</p>
                  ) : selectedOrder.payments.map((entry: any) => (
                    <div key={entry.id} className="text-sm border-l-2 border-border pl-3">
                      <p className="text-foreground">{entry.provider} · {entry.transaction_type} · <span className="font-medium">{entry.status}</span></p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientOrders;
