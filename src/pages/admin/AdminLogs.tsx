import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Activity } from "lucide-react";
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
    fetchLogs().catch(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Logs de Atividade</h1>
        <p>Histórico de ações na plataforma.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por ação, usuário ou empresa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead className="hidden md:table-cell">Entidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="empty-state py-12">
                      <Activity className="empty-state-icon" />
                      <p className="empty-state-title">{search ? "Nenhum resultado" : "Nenhum log"}</p>
                      <p className="empty-state-description">{search ? "Tente alterar os termos da busca." : "As ações realizadas no sistema serão registradas aqui."}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm font-medium">{log.user_name || "-"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{log.company_name || "-"}</TableCell>
                  <TableCell>
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">{log.action}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
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
