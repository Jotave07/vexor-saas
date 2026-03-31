import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*, user_roles(role), companies(name)");
      setUsers(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const roleLabels: Record<string, string> = {
    master_admin: "Admin Master",
    company_admin: "Admin Empresa",
    company_staff: "Equipe",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Usuários</h1>
        <p className="text-muted-foreground">Todos os usuários da plataforma</p>
      </div>
      <Card className="glass-card border-border/50">
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
                <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.companies?.name || "—"}</TableCell>
                  <TableCell>
                    {u.user_roles?.map((r: any) => (
                      <span key={r.role} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mr-1">
                        {roleLabels[r.role] || r.role}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
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
