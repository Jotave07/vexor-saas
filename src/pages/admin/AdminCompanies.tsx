import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Ban, CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-accent/10 text-accent" },
  trial: { label: "Teste", className: "bg-primary/10 text-primary" },
  suspended: { label: "Suspenso", className: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
  defaulting: { label: "Inadimplente", className: "bg-destructive/10 text-destructive" },
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  document: "",
  address: "",
  status: "trial",
  notes: "",
};

const AdminCompanies = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [newStore, setNewStore] = useState({ name: "", slug: "", domain: "" });
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "" });
  const [selectedPlan, setSelectedPlan] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterStatus !== "all") query.set("status", filterStatus);
    if (search) query.set("search", search);
    const response = await api.get<{ companies: any[] }>(`/api/admin/companies?${query.toString()}`);
    setCompanies(response.companies || []);
    setLoading(false);
  };

  const fetchPlans = async () => {
    const response = await api.get<{ plans: any[] }>("/api/admin/plans");
    setPlans(response.plans || []);
  };

  useEffect(() => {
    fetchCompanies().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, [filterStatus, search]);

  useEffect(() => {
    fetchPlans().catch(console.error);
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setNewStore({ name: "", slug: "", domain: "" });
    setNewUser({ email: "", password: "", fullName: "" });
    setSelectedPlan("");
    setEditingCompany(null);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);

    try {
      if (editingCompany) {
        await api.put(`/api/admin/companies/${editingCompany.id}`, form);
        toast({ title: "Empresa atualizada!" });
      } else {
        await api.post("/api/admin/companies", {
          company: form,
          store: newStore.name ? newStore : undefined,
          planId: selectedPlan || null,
          adminUser: newUser.email && newUser.password ? newUser : undefined,
        });
        toast({ title: "Empresa criada com sucesso!" });
      }
      setDialogOpen(false);
      resetForm();
      await fetchCompanies();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (company: any, newStatus: string) => {
    try {
      await api.patch(`/api/admin/companies/${company.id}/status`, { status: newStatus });
      toast({ title: `Empresa ${newStatus === "active" ? "ativada" : "atualizada"}!` });
      await fetchCompanies();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground">Gerencie os clientes da plataforma.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" />Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editingCompany ? "Editar Empresa" : "Nova Empresa"}</DialogTitle></DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Documento</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Endereco</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
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
                <div className="space-y-2 sm:col-span-2"><Label>Observacoes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>

              {!editingCompany && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="mb-3 text-sm font-medium text-foreground">Loja inicial</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2"><Label>Nome da Loja</Label><Input value={newStore.name} onChange={(e) => setNewStore({ ...newStore, name: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Slug</Label><Input value={newStore.slug} onChange={(e) => setNewStore({ ...newStore, slug: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Dominio</Label><Input value={newStore.domain} onChange={(e) => setNewStore({ ...newStore, domain: e.target.value })} /></div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="mb-3 text-sm font-medium text-foreground">Plano</h3>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - R$ {Number(plan.price).toFixed(2)}/mes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="mb-3 text-sm font-medium text-foreground">Usuario administrador</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2"><Label>Nome</Label><Input value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Email</Label><Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Senha</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></div>
                    </div>
                  </div>
                </>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCompany ? "Salvar Alteracoes" : "Criar Empresa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar empresa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="trial">Teste</SelectItem>
            <SelectItem value="suspended">Suspenso</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="defaulting">Inadimplente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : companies.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma empresa encontrada.</TableCell></TableRow>
              ) : companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-muted-foreground">{company.email || "-"}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-1 text-xs ${statusLabels[company.status]?.className}`}>{statusLabels[company.status]?.label}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(company.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCompany(company);
                          setForm({
                            name: company.name,
                            email: company.email || "",
                            phone: company.phone || "",
                            document: company.document || "",
                            address: company.address || "",
                            status: company.status,
                            notes: company.notes || "",
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {company.status === "active" || company.status === "trial" ? (
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(company, "suspended")}><Ban className="h-4 w-4 text-destructive" /></Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(company, "active")}><CheckCircle className="h-4 w-4 text-accent" /></Button>
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
