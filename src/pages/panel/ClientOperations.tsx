import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const ClientOperations = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [tracking, setTracking] = useState<Record<string, { tracking_code: string; tracking_url: string; status: string }>>({});

  const refresh = async () => {
    const [deliveriesResponse, integrationsResponse] = await Promise.all([
      api.get<{ deliveries: any[] }>("/api/client/deliveries"),
      api.get<{ logs: any[]; webhooks: any[] }>("/api/client/integrations/logs"),
    ]);

    setDeliveries(deliveriesResponse.deliveries || []);
    setLogs(integrationsResponse.logs || []);
    setWebhooks(integrationsResponse.webhooks || []);
  };

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  const updateDelivery = async (deliveryId: string) => {
    try {
      await api.patch(`/api/client/deliveries/${deliveryId}`, tracking[deliveryId] || {});
      toast({ title: "Entrega atualizada" });
      await refresh();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Operacao e integracoes</h1>
        <p className="text-muted-foreground">Acompanhe entregas, rastreios, logs de integracao e webhooks processados.</p>
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-lg font-semibold">Entregas</h2>
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma entrega registrada.</p>
            ) : deliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Pedido #{delivery.order_number}</p>
                    <p className="text-sm text-muted-foreground">{delivery.customer_name || "Cliente"} | {delivery.provider}</p>
                  </div>
                  <span className="text-sm">{delivery.status}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="space-y-2"><Label>Codigo de rastreio</Label><Input value={tracking[delivery.id]?.tracking_code ?? delivery.tracking_code ?? ""} onChange={(e) => setTracking((current) => ({ ...current, [delivery.id]: { ...current[delivery.id], tracking_code: e.target.value, tracking_url: current[delivery.id]?.tracking_url ?? delivery.tracking_url ?? "", status: current[delivery.id]?.status ?? delivery.status } }))} /></div>
                  <div className="space-y-2"><Label>URL de rastreio</Label><Input value={tracking[delivery.id]?.tracking_url ?? delivery.tracking_url ?? ""} onChange={(e) => setTracking((current) => ({ ...current, [delivery.id]: { ...current[delivery.id], tracking_url: e.target.value, tracking_code: current[delivery.id]?.tracking_code ?? delivery.tracking_code ?? "", status: current[delivery.id]?.status ?? delivery.status } }))} /></div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={tracking[delivery.id]?.status ?? delivery.status} onChange={(e) => setTracking((current) => ({ ...current, [delivery.id]: { ...current[delivery.id], status: e.target.value, tracking_code: current[delivery.id]?.tracking_code ?? delivery.tracking_code ?? "", tracking_url: current[delivery.id]?.tracking_url ?? delivery.tracking_url ?? "" } }))}>
                      {["pending", "ready_to_ship", "shipped", "in_transit", "delivered", "failed", "returned", "cancelled"].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={() => updateDelivery(delivery.id)}>Salvar entrega</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 glass-card">
          <CardContent className="p-0">
            <div className="p-6 pb-0">
              <h2 className="font-heading text-lg font-semibold">Logs de integracao</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Direcao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resumo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Sem logs.</TableCell></TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.provider}</TableCell>
                    <TableCell>{log.direction}</TableCell>
                    <TableCell>{log.status}</TableCell>
                    <TableCell className="text-muted-foreground">{log.summary || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass-card">
          <CardContent className="p-0">
            <div className="p-6 pb-0">
              <h2 className="font-heading text-lg font-semibold">Webhooks</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Sem webhooks.</TableCell></TableRow>
                ) : webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>{webhook.provider}</TableCell>
                    <TableCell>{webhook.event_type}</TableCell>
                    <TableCell>{webhook.status}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(webhook.created_at).toLocaleString("pt-BR")}</TableCell>
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
