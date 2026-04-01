import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const defaultForm = {
  name: "",
  description: "",
  price: "",
  max_products: "100",
  max_stores: "1",
  max_users: "3",
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchPlans = async () => {
    const response = await api.get<{ plans: any[] }>("/api/admin/plans");
    setPlans(response.plans || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  const payload = {
    name: form.name,
    description: form.description,
    price: parseFloat(form.price) || 0,
    max_products: parseInt(form.max_products, 10) || 100,
    max_stores: parseInt(form.max_stores, 10) || 1,
    max_users: parseInt(form.max_users, 10) || 3,
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);

    try {
      if (editingPlan) {
        await api.put(`/api/admin/plans/${editingPlan.id}`, payload);
      } else {
        await api.post("/api/admin/plans", payload);
      }
      toast({ title: editingPlan ? "Plano atualizado!" : "Plano criado!" });
      setDialogOpen(false);
      setEditingPlan(null);
      setForm(defaultForm);
      await fetchPlans();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos da plataforma.</p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingPlan(null);
              setForm(defaultForm);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle className="font-heading">{editingPlan ? "Editar" : "Novo"} Plano</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descricao</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Preco (R$)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Max. Produtos</Label><Input type="number" value={form.max_products} onChange={(e) => setForm({ ...form, max_products: e.target.value })} /></div>
                <div className="space-y-2"><Label>Max. Lojas</Label><Input type="number" value={form.max_stores} onChange={(e) => setForm({ ...form, max_stores: e.target.value })} /></div>
                <div className="space-y-2"><Label>Max. Usuarios</Label><Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} /></div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preco</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Lojas</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>R$ {Number(plan.price).toFixed(2)}</TableCell>
                  <TableCell>{plan.max_products}</TableCell>
                  <TableCell>{plan.max_stores}</TableCell>
                  <TableCell>{plan.max_users}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPlan(plan);
                        setForm({
                          name: plan.name,
                          description: plan.description || "",
                          price: String(plan.price),
                          max_products: String(plan.max_products),
                          max_stores: String(plan.max_stores),
                          max_users: String(plan.max_users),
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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

export default AdminPlans;
