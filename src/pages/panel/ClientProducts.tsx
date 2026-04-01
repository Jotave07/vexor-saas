import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  category_id: "",
  image_url: "",
  price: "",
  sale_price: "",
  sku: "",
  stock: "0",
  is_featured: false,
  is_active: true,
};

const ClientProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const fetchProducts = async () => {
    const [productsResponse, categoriesResponse] = await Promise.all([
      api.get<{ items: any[] }>("/api/client/products"),
      api.get<{ items: any[] }>("/api/client/categories"),
    ]);
    setProducts(productsResponse.items || []);
    setCategories(categoriesResponse.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        description: form.description,
        category_id: form.category_id || null,
        images: form.image_url ? JSON.stringify([form.image_url]) : JSON.stringify([]),
        price: parseFloat(form.price) || 0,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        sku: form.sku || null,
        stock: parseInt(form.stock, 10) || 0,
        is_featured: form.is_featured ? 1 : 0,
        is_active: form.is_active ? 1 : 0,
      };

      if (editing) {
        await api.put(`/api/client/products/${editing.id}`, payload);
      } else {
        await api.post("/api/client/products", payload);
      }

      toast({ title: editing ? "Produto atualizado!" : "Produto criado!" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await fetchProducts();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/client/products/${id}`);
    toast({ title: "Produto desativado!" });
    await fetchProducts();
  };

  const filtered = products.filter((product) => !search || product.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catalogo da sua loja.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado" /></div>
              <div className="space-y-2"><Label>Descricao</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Sem departamento</option>
                  {categories.filter((category) => category.is_active).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2"><Label>Imagem principal (URL)</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Preco (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Preco Promocional</Label><Input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></div>
                <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                <div className="space-y-2"><Label>Estoque</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Preco</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum produto.</TableCell></TableRow>
              ) : filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {JSON.parse(product.images || "[]")[0] ? (
                        <img src={JSON.parse(product.images || "[]")[0]} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted" />
                      )}
                      <span>{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{categories.find((category) => category.id === product.category_id)?.name || "-"}</TableCell>
                  <TableCell>{product.sale_price ? <span><span className="mr-2 line-through text-muted-foreground">R$ {Number(product.price).toFixed(2)}</span>R$ {Number(product.sale_price).toFixed(2)}</span> : `R$ ${Number(product.price).toFixed(2)}`}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-1 text-xs ${product.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{product.is_active ? "Ativo" : "Inativo"}</span></TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(product);
                        setForm({
                          name: product.name,
                          slug: product.slug,
                          description: product.description || "",
                          category_id: product.category_id || "",
                          image_url: JSON.parse(product.images || "[]")[0] || "",
                          price: String(product.price),
                          sale_price: product.sale_price ? String(product.sale_price) : "",
                          sku: product.sku || "",
                          stock: String(product.stock),
                          is_featured: Boolean(product.is_featured),
                          is_active: Boolean(product.is_active),
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
