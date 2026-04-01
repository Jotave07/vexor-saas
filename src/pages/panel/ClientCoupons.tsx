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

const emptyForm = { code: "", description: "", discount_type: "percentage", discount_value: "", is_active: true };

const ClientCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCoupons = async () => {
    const response = await api.get<{ items: any[] }>("/api/client/coupons");
    setCoupons(response.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const payload = {
      code: form.code,
      description: form.description,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      is_active: form.is_active ? 1 : 0,
      uses_count: editing?.uses_count || 0,
    };

    try {
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Cupons</h1>
          <p className="text-muted-foreground">Gerencie cupons de desconto.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" />Novo Cupom</Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Novo"} Cupom</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Codigo</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
              <div className="space-y-2"><Label>Descricao</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tipo</Label><Input value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} /></div>
              <div className="space-y-2"><Label>Valor</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full bg-gradient-primary text-primary-foreground">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Codigo</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Uso</TableHead><TableHead className="text-right">Acoes</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : coupons.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum cupom cadastrado.</TableCell></TableRow>
              ) : coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>{coupon.discount_type}</TableCell>
                  <TableCell>{coupon.discount_value}</TableCell>
                  <TableCell>{coupon.uses_count || 0}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditing(coupon); setForm({ code: coupon.code, description: coupon.description || "", discount_type: coupon.discount_type, discount_value: String(coupon.discount_value), is_active: Boolean(coupon.is_active) }); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button></TableCell>
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
