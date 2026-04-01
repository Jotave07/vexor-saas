import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";
import { api } from "@/lib/api";

const roleLabels: Record<string, { label: string; className: string }> = {
  master_admin: { label: "Admin Master", className: "bg-primary/10 text-primary" },
  company_admin: { label: "Admin Empresa", className: "bg-accent/10 text-accent" },
  company_staff: { label: "Equipe", className: "bg-secondary text-secondary-foreground" },
};

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await api.get<{ users: any[] }>("/api/admin/users");
      setUsers(response.users || []);
      setLoading(false);
    };
    fetchUsers().catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Usuários</h1>
        <p>Todos os usuários da plataforma ({users.length} usuários).</p>
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="hidden md:table-cell">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="empty-state py-12">
                      <Users className="empty-state-icon" />
                      <p className="empty-state-title">Nenhum usuário</p>
                      <p className="empty-state-description">Usuários são criados ao cadastrar empresas.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {user.full_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="font-medium text-sm">{user.full_name || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{user.company_name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role: string) => (
                        <span key={role} className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleLabels[role]?.className || "bg-muted text-muted-foreground"}`}>
                          {roleLabels[role]?.label || role}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
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

export default AdminUsers;
