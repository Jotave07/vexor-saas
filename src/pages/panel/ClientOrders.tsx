import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
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
    fetchOrders().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await api.patch(`/api/client/orders/${orderId}/status`, { status });
    toast({ title: "Status atualizado!" });
    await fetchOrders();
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
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie os pedidos da sua loja.</p>
      </div>
      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum pedido.</TableCell></TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.order_number}</TableCell>
                  <TableCell className="text-muted-foreground">{order.customer_name || "-"}</TableCell>
                  <TableCell>R$ {Number(order.total).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{order.payment_status}</TableCell>
                  <TableCell className="text-muted-foreground">{order.delivery_status || "-"}</TableCell>
                  <TableCell>
                    <Select defaultValue={order.status} onValueChange={(value) => updateStatus(order.id, value)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openDetails(order.id)}>Detalhes</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do pedido</DialogTitle>
          </DialogHeader>
          {!selectedOrder ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardContent className="space-y-3 p-4">
                <p><strong>Pedido:</strong> #{selectedOrder.order.order_number}</p>
                <p><strong>Cliente:</strong> {selectedOrder.order.customer_name || "-"}</p>
                <p><strong>Email:</strong> {selectedOrder.order.customer_email || "-"}</p>
                <p><strong>Pagamento:</strong> {selectedOrder.order.payment_status}</p>
                <p><strong>Entrega:</strong> {selectedOrder.order.delivery_status || "-"}</p>
                <p><strong>Rastreio:</strong> {selectedOrder.order.tracking_code || "-"}</p>
                <p><strong>Total:</strong> R$ {Number(selectedOrder.order.total).toFixed(2)}</p>
              </CardContent></Card>
              <Card><CardContent className="space-y-3 p-4">
                <h3 className="font-semibold">Itens</h3>
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span>R$ {Number(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </CardContent></Card>
              <Card><CardContent className="space-y-3 p-4">
                <h3 className="font-semibold">Historico</h3>
                {selectedOrder.history.map((entry: any) => (
                  <div key={entry.id} className="text-sm">
                    <p>{entry.note || `${entry.from_status || "-"} -> ${entry.to_status || "-"}`}</p>
                    <p className="text-muted-foreground">{new Date(entry.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </CardContent></Card>
              <Card><CardContent className="space-y-3 p-4">
                <h3 className="font-semibold">Transacoes</h3>
                {selectedOrder.payments.map((entry: any) => (
                  <div key={entry.id} className="text-sm">
                    <p>{entry.provider} | {entry.transaction_type} | {entry.status}</p>
                    <p className="text-muted-foreground">{new Date(entry.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientOrders;
