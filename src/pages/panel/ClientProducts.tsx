import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const ClientProducts = () => {
  const { profile } = useAuth();
  const { log } = useActivityLog();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "", sale_price: "", sku: "", stock: "0", is_featured: false, is_active: true,
  });

  useEffect(() => {
    if (!profile?.company_id) return;
    const init = async () => {
      const { data: stores } = await supabase.from("stores").select("id").eq("company_id", profile.company_id!).limit(1);
      const sid = stores?.[0]?.id;
      if (sid) { setStoreId(sid); fetchProducts(sid); }
      else setLoading(false);
    };
    init();
  }, [profile?.company_id]);

  const fetchProducts = async (sid: string) => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("store_id", sid).order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name || !storeId) return;
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = {
      store_id: storeId, name: form.name, slug, description: form.description,
      price: parseFloat(form.price) || 0, sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      sku: form.sku || null, stock: parseInt(form.stock) || 0,
      is_featured: form.is_featured, is_active: form.is_active,
    };

    if (editing) {
      await supabase.from("products").update(payload).eq("id", editing.id);
      log("update_product", "product", editing.id);
      toast({ title: "Produto atualizado!" });
    } else {
      const { data } = await supabase.from("products").insert(payload).select().single();
      if (data) log("create_product", "product", data.id);
      toast({ title: "Produto criado!" });
    }
    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchProducts(storeId);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("products").update({ is_active: false }).eq("id", id);
    log("deactivate_product", "product", id);
    toast({ title: "Produto desativado!" });
    if (storeId) fetchProducts(storeId);
  };

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", price: "", sale_price: "", sku: "", stock: "0", is_featured: false, is_active: true });
    setEditing(null);
  };

  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo da sua loja</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Preço Promocional</Label><Input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></div>
                <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                <div className="space-y-2"><Label>Estoque</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum produto</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    {p.sale_price ? (
                      <span><span className="line-through text-muted-foreground mr-2">R$ {Number(p.price).toFixed(2)}</span>R$ {Number(p.sale_price).toFixed(2)}</span>
                    ) : `R$ ${Number(p.price).toFixed(2)}`}
                  </TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditing(p);
                      setForm({ name: p.name, slug: p.slug, description: p.description || "", price: String(p.price), sale_price: p.sale_price ? String(p.sale_price) : "", sku: p.sku || "", stock: String(p.stock), is_featured: p.is_featured, is_active: p.is_active });
                      setDialogOpen(true);
                    }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default ClientProducts;
