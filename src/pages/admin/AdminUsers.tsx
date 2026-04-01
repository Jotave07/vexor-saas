import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await api.get<{ users: any[] }>("/api/admin/users");
      setUsers(response.users || []);
      setLoading(false);
    };

    fetchUsers().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  const roleLabels: Record<string, string> = {
    master_admin: "Admin Master",
    company_admin: "Admin Empresa",
    company_staff: "Equipe",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Usuarios</h1>
        <p className="text-muted-foreground">Todos os usuarios da plataforma.</p>
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{user.company_name || "-"}</TableCell>
                  <TableCell>
                    {user.roles?.map((role: string) => (
                      <span key={role} className="mr-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                        {roleLabels[role] || role}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
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
