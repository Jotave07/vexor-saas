import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Ban, CheckCircle, Loader2 } from "lucide-react";

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-accent/10 text-accent" },
  trial: { label: "Teste", className: "bg-primary/10 text-primary" },
  suspended: { label: "Suspenso", className: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
  defaulting: { label: "Inadimplente", className: "bg-destructive/10 text-destructive" },
};

const AdminCompanies = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", document: "", address: "", status: "trial" as string, notes: "" });
  const [plans, setPlans] = useState<any[]>([]);
  const [newStore, setNewStore] = useState({ name: "", slug: "" });
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "" });
  const [selectedPlan, setSelectedPlan] = useState("");
  const { log } = useActivityLog();

  const fetchCompanies = async () => {
    setLoading(true);
    let query = supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data } = await query;
    setCompanies(data || []);
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("*").eq("is_active", true);
    setPlans(data || []);
  };

  useEffect(() => { fetchCompanies(); fetchPlans(); }, [filterStatus, search]);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);

    if (editingCompany) {
      const { error } = await supabase.from("companies").update({
        name: form.name, email: form.email, phone: form.phone,
        document: form.document, address: form.address, status: form.status as any, notes: form.notes,
      }).eq("id", editingCompany.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
      else {
        toast({ title: "Empresa atualizada!" });
        log("update_company", "company", editingCompany.id, { name: form.name });
      }
    } else {
      // Create company
      const { data: company, error } = await supabase.from("companies").insert({
        name: form.name, email: form.email, phone: form.phone,
        document: form.document, address: form.address, status: form.status as any, notes: form.notes,
      }).select().single();

      if (error || !company) {
        toast({ title: "Erro ao criar empresa", description: error?.message, variant: "destructive" });
        setSaving(false);
        return;
      }

      // Create store if provided
      if (newStore.name) {
        const slug = newStore.slug || newStore.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        await supabase.from("stores").insert({ company_id: company.id, name: newStore.name, slug });
        await supabase.from("store_settings").insert({
          store_id: (await supabase.from("stores").select("id").eq("company_id", company.id).single()).data?.id,
        });
      }

      // Create subscription if plan selected
      if (selectedPlan) {
        const plan = plans.find((p) => p.id === selectedPlan);
        if (plan) {
          await supabase.from("subscriptions").insert({
            company_id: company.id, plan_id: selectedPlan, amount: plan.price,
            due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          });
        }
      }

      // Create admin user if provided
      if (newUser.email && newUser.password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
          options: { data: { full_name: newUser.fullName || newUser.email } },
        });
        if (authError) {
          toast({ title: "Erro ao criar usuário", description: authError.message, variant: "destructive" });
        } else if (authData.user) {
          await supabase.from("user_roles").insert({ user_id: authData.user.id, role: "company_admin" as any });
          await supabase.from("profiles").update({ company_id: company.id }).eq("user_id", authData.user.id);
        }
      }

      log("create_company", "company", company.id, { name: form.name });
      toast({ title: "Empresa criada com sucesso!" });
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchCompanies();
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", document: "", address: "", status: "trial", notes: "" });
    setNewStore({ name: "", slug: "" });
    setNewUser({ email: "", password: "", fullName: "" });
    setSelectedPlan("");
    setEditingCompany(null);
  };

  const openEdit = (company: any) => {
    setEditingCompany(company);
    setForm({
      name: company.name, email: company.email || "", phone: company.phone || "",
      document: company.document || "", address: company.address || "", status: company.status, notes: company.notes || "",
    });
    setDialogOpen(true);
  };

  const toggleStatus = async (company: any, newStatus: string) => {
    await supabase.from("companies").update({ status: newStatus as any }).eq("id", company.id);
    log("change_status", "company", company.id, { from: company.status, to: newStatus });
    toast({ title: `Empresa ${newStatus === "active" ? "ativada" : "suspensa"}!` });
    fetchCompanies();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground">Gerencie os clientes da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" />Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">{editingCompany ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Documento (CNPJ/CPF)</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="trial">Teste</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="defaulting">Inadimplente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>

              {!editingCompany && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Loja (opcional)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nome da Loja</Label><Input value={newStore.name} onChange={(e) => setNewStore({ ...newStore, name: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Slug</Label><Input value={newStore.slug} onChange={(e) => setNewStore({ ...newStore, slug: e.target.value })} placeholder="minha-loja" /></div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Plano</h3>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                      <SelectContent>
                        {plans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} - R$ {p.price}/mês</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Usuário Admin (opcional)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Nome</Label><Input value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Email</Label><Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Senha</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></div>
                    </div>
                  </div>
                </>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCompany ? "Salvar Alterações" : "Criar Empresa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar empresa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="trial">Teste</SelectItem>
            <SelectItem value="suspended">Suspenso</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="defaulting">Inadimplente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : companies.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma empresa encontrada</TableCell></TableRow>
              ) : companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[c.status]?.className}`}>
                      {statusLabels[c.status]?.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                      {c.status === "active" || c.status === "trial" ? (
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(c, "suspended")}><Ban className="h-4 w-4 text-destructive" /></Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(c, "active")}><CheckCircle className="h-4 w-4 text-accent" /></Button>
                      )}
                    </div>
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

export default AdminCompanies;
