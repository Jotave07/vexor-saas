import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const response = await api.get<{ logs: any[] }>(`/api/admin/logs${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setLogs(response.logs || []);
      setLoading(false);
    };

    fetchLogs().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Logs de Atividade</h1>
        <p className="text-muted-foreground">Historico de acoes na plataforma.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Acao</TableHead>
                <TableHead>Entidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{log.user_name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{log.company_name || "-"}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.entity_type ? `${log.entity_type}/${String(log.entity_id || "").slice(0, 8)}` : "-"}
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

export default AdminLogs;
