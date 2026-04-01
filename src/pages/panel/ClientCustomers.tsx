import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const ClientCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      const response = await api.get<{ customers: any[] }>("/api/client/customers");
      setCustomers(response.customers || []);
      setLoading(false);
    };
    fetchCustomers().catch(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => !search || `${c.name} ${c.email || ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Clientes</h1>
        <p>Clientes compradores da sua loja ({customers.length} clientes).</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="empty-state py-12">
                      <Users className="empty-state-icon" />
                      <p className="empty-state-title">{search ? "Nenhum resultado" : "Nenhum cliente"}</p>
                      <p className="empty-state-description">{search ? "Tente alterar os termos da busca." : "Os clientes que realizarem compras na loja aparecerão aqui."}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {customer.name?.[0]?.toUpperCase() || "C"}
                      </div>
                      <span className="font-medium text-sm">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{customer.email || "-"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{customer.phone || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(customer.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientCustomers;
