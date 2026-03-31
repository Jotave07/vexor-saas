import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Loader2 } from "lucide-react";

const AdminPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", max_products: "100", max_stores: "1", max_users: "3" });
  const { log } = useActivityLog();

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("*").order("price");
    setPlans(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      name: form.name, description: form.description, price: parseFloat(form.price) || 0,
      max_products: parseInt(form.max_products) || 100, max_stores: parseInt(form.max_stores) || 1,
      max_users: parseInt(form.max_users) || 3,
    };
    if (editingPlan) {
      await supabase.from("plans").update(payload).eq("id", editingPlan.id);
      log("update_plan", "plan", editingPlan.id);
    } else {
      const { data } = await supabase.from("plans").insert(payload).select().single();
      if (data) log("create_plan", "plan", data.id);
    }
    toast({ title: editingPlan ? "Plano atualizado!" : "Plano criado!" });
    setSaving(false);
    setDialogOpen(false);
    setEditingPlan(null);
    setForm({ name: "", description: "", price: "", max_products: "100", max_stores: "1", max_users: "3" });
    fetchPlans();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingPlan(null); setForm({ name: "", description: "", price: "", max_products: "100", max_stores: "1", max_users: "3" }); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" />Novo Plano</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-heading">{editingPlan ? "Editar" : "Novo"} Plano</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Máx. Produtos</Label><Input type="number" value={form.max_products} onChange={(e) => setForm({ ...form, max_products: e.target.value })} /></div>
                <div className="space-y-2"><Label>Máx. Lojas</Label><Input type="number" value={form.max_stores} onChange={(e) => setForm({ ...form, max_stores: e.target.value })} /></div>
                <div className="space-y-2"><Label>Máx. Usuários</Label><Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} /></div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="glass-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Lojas</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>R$ {Number(p.price).toFixed(2)}</TableCell>
                  <TableCell>{p.max_products}</TableCell>
                  <TableCell>{p.max_stores}</TableCell>
                  <TableCell>{p.max_users}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(p); setForm({ name: p.name, description: p.description || "", price: String(p.price), max_products: String(p.max_products), max_stores: String(p.max_stores), max_users: String(p.max_users) }); setDialogOpen(true); }}>
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
