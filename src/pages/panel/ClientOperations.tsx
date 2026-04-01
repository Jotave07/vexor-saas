import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Truck, Activity, Webhook } from "lucide-react";
import { api } from "@/lib/api";

const deliveryStatuses = ["pending", "ready_to_ship", "shipped", "in_transit", "delivered", "failed", "returned", "cancelled"];

const deliveryStatusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-primary/10 text-primary" },
  ready_to_ship: { label: "Pronto", className: "bg-primary/10 text-primary" },
  shipped: { label: "Enviado", className: "bg-accent/10 text-accent" },
  in_transit: { label: "Em trânsito", className: "bg-accent/10 text-accent" },
  delivered: { label: "Entregue", className: "bg-accent/10 text-accent" },
  failed: { label: "Falhou", className: "bg-destructive/10 text-destructive" },
  returned: { label: "Devolvido", className: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

const ClientOperations = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<Record<string, { tracking_code: string; tracking_url: string; status: string }>>({});

  const refresh = async () => {
    const [deliveriesResponse, integrationsResponse] = await Promise.all([
      api.get<{ deliveries: any[] }>("/api/client/deliveries"),
      api.get<{ logs: any[]; webhooks: any[] }>("/api/client/integrations/logs"),
    ]);
    setDeliveries(deliveriesResponse.deliveries || []);
    setLogs(integrationsResponse.logs || []);
    setWebhooks(integrationsResponse.webhooks || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, []);

  const updateDelivery = async (deliveryId: string) => {
    try {
      await api.patch(`/api/client/deliveries/${deliveryId}`, tracking[deliveryId] || {});
      toast({ title: "Entrega atualizada!" });
      await refresh();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
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
        <h1>Operação e Integrações</h1>
        <p>Entregas, rastreios, logs de integração e webhooks.</p>
      </div>

      {/* Entregas */}
      <Card className="border-border/50 glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-heading">
            <Truck className="h-4 w-4 text-muted-foreground" />
            Entregas ({deliveries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="empty-state py-10">
              <Truck className="empty-state-icon" />
              <p className="empty-state-title">Nenhuma entrega</p>
              <p className="empty-state-description">As entregas dos pedidos aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="font-medium text-sm text-foreground">Pedido #{delivery.order_number}</p>
                      <p className="text-xs text-muted-foreground">{delivery.customer_name || "Cliente"} · {delivery.provider}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${deliveryStatusLabels[delivery.status]?.className || "bg-muted text-muted-foreground"}`}>
                      {deliveryStatusLabels[delivery.status]?.label || delivery.status}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Código de rastreio</Label>
                      <Input className="h-9" value={tracking[delivery.id]?.tracking_code ?? delivery.tracking_code ?? ""} onChange={(e) => setTracking((c) => ({ ...c, [delivery.id]: { ...c[delivery.id], tracking_code: e.target.value, tracking_url: c[delivery.id]?.tracking_url ?? delivery.tracking_url ?? "", status: c[delivery.id]?.status ?? delivery.status } }))} placeholder="Código" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">URL de rastreio</Label>
                      <Input className="h-9" value={tracking[delivery.id]?.tracking_url ?? delivery.tracking_url ?? ""} onChange={(e) => setTracking((c) => ({ ...c, [delivery.id]: { ...c[delivery.id], tracking_url: e.target.value, tracking_code: c[delivery.id]?.tracking_code ?? delivery.tracking_code ?? "", status: c[delivery.id]?.status ?? delivery.status } }))} placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select value={tracking[delivery.id]?.status ?? delivery.status} onValueChange={(v) => setTracking((c) => ({ ...c, [delivery.id]: { ...c[delivery.id], status: v, tracking_code: c[delivery.id]?.tracking_code ?? delivery.tracking_code ?? "", tracking_url: c[delivery.id]?.tracking_url ?? delivery.tracking_url ?? "" } }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {deliveryStatuses.map((s) => (
                            <SelectItem key={s} value={s}>{deliveryStatusLabels[s]?.label || s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button className="h-9 w-full" onClick={() => updateDelivery(delivery.id)}>Salvar</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs e Webhooks */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Logs de integração
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Direção</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Resumo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="empty-state py-8">
                        <Activity className="empty-state-icon h-8 w-8" />
                        <p className="empty-state-description text-xs">Sem logs de integração.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm font-medium">{log.provider}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.direction}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${log.status === "success" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[200px]">{log.summary || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <Webhook className="h-4 w-4 text-muted-foreground" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="empty-state py-8">
                        <Webhook className="empty-state-icon h-8 w-8" />
                        <p className="empty-state-description text-xs">Sem webhooks processados.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : webhooks.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-sm font-medium">{w.provider}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{w.event_type}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${w.status === "processed" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                        {w.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientOperations;
