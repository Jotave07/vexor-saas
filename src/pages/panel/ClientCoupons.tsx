import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Loader2, Tag } from "lucide-react";
import { api } from "@/lib/api";

const emptyForm = { code: "", description: "", discount_type: "percentage", discount_value: "", is_active: true };

const ClientCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCoupons = async () => {
    const response = await api.get<{ items: any[] }>("/api/client/coupons");
    setCoupons(response.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons().catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.code) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value) || 0,
        is_active: form.is_active ? 1 : 0,
        uses_count: editing?.uses_count || 0,
      };
      if (editing) {
        await api.put(`/api/client/coupons/${editing.id}`, payload);
      } else {
        await api.post("/api/client/coupons", payload);
      }
      toast({ title: editing ? "Cupom atualizado!" : "Cupom criado!" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await fetchCoupons();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header">
          <h1>Cupons</h1>
          <p>Gerencie cupons de desconto ({coupons.length} cupons).</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" />Novo Cupom</Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Novo"} Cupom</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Código *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EX: DESCONTO10" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do cupom" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de desconto</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Valor</Label><Input type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === "percentage" ? "10" : "25.00"} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                Cupom ativo
              </label>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Salvar Alterações" : "Criar Cupom"}
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
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="empty-state py-12">
                      <Tag className="empty-state-icon" />
                      <p className="empty-state-title">Nenhum cupom</p>
                      <p className="empty-state-description">Crie cupons de desconto para atrair mais vendas.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-mono font-bold text-primary">{coupon.code}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{coupon.discount_type === "percentage" ? "Percentual" : "Fixo"}</TableCell>
                  <TableCell className="text-sm font-medium">{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `R$ ${Number(coupon.discount_value).toFixed(2)}`}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{coupon.uses_count || 0}×</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${coupon.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {coupon.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setEditing(coupon);
                      setForm({ code: coupon.code, description: coupon.description || "", discount_type: coupon.discount_type, discount_value: String(coupon.discount_value), is_active: Boolean(coupon.is_active) });
                      setDialogOpen(true);
                    }}>
                      <Edit className="h-3.5 w-3.5" />
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

export default ClientCoupons;
