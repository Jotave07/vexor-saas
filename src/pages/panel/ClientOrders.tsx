import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-primary/10 text-primary" },
  confirmed: { label: "Confirmado", className: "bg-accent/10 text-accent" },
  processing: { label: "Processando", className: "bg-primary/10 text-primary" },
  shipped: { label: "Enviado", className: "bg-accent/10 text-accent" },
  delivered: { label: "Entregue", className: "bg-accent/10 text-accent" },
  cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
  refunded: { label: "Reembolsado", className: "bg-muted text-muted-foreground" },
};

const ClientOrders = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.company_id) return;
    const init = async () => {
      const { data: stores } = await supabase.from("stores").select("id").eq("company_id", profile.company_id!).limit(1);
      const sid = stores?.[0]?.id;
      if (sid) { setStoreId(sid); fetchOrders(sid); }
      else setLoading(false);
    };
    init();
  }, [profile?.company_id]);

  const fetchOrders = async (sid: string) => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*, customers(name, email)").eq("store_id", sid).order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus as any }).eq("id", orderId);
    toast({ title: "Status atualizado!" });
    if (storeId) fetchOrders(storeId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie os pedidos da sua loja</p>
      </div>
      <Card className="glass-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum pedido</TableCell></TableRow>
              ) : orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">#{o.order_number}</TableCell>
                  <TableCell className="text-muted-foreground">{o.customers?.name || "—"}</TableCell>
                  <TableCell>R$ {Number(o.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Select defaultValue={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientOrders;
