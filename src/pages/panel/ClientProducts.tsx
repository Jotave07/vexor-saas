import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, Search, Package } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const emptyForm = {
  name: "", slug: "", description: "", category_id: "", image_url: "",
  price: "", sale_price: "", sku: "", stock: "0", is_featured: false, is_active: true,
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
    fetchProducts().catch(() => setLoading(false));
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
    try {
      await api.delete(`/api/client/products/${id}`);
      toast({ title: "Produto desativado!" });
      await fetchProducts();
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header">
          <h1>Produtos</h1>
          <p>Gerencie o catálogo da sua loja ({products.length} produtos).</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado a partir do nome" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Descreva o produto..." /></div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Sem departamento</option>
                  {categories.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2"><Label>Imagem (URL)</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></div>
                <div className="space-y-2"><Label>Preço Promocional</Label><Input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="Opcional" /></div>
                <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Código interno" /></div>
                <div className="space-y-2"><Label>Estoque</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
                  Destaque
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                  Ativo
                </label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Salvar Alterações" : "Criar Produto"}
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
                <TableHead className="hidden md:table-cell">Departamento</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="hidden sm:table-cell">Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="empty-state py-12">
                      <Package className="empty-state-icon" />
                      <p className="empty-state-title">{search ? "Nenhum resultado" : "Nenhum produto"}</p>
                      <p className="empty-state-description">{search ? "Tente alterar os termos da busca." : "Cadastre seu primeiro produto para começar a vender."}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((product) => {
                const images = (() => { try { return JSON.parse(product.images || "[]"); } catch { return []; } })();
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {images[0] ? (
                          <img src={images[0]} alt={product.name} className="h-10 w-10 rounded-lg object-cover ring-1 ring-border" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                        <div>
                          <p className="font-medium text-foreground text-sm">{product.name}</p>
                          {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{categories.find((c) => c.id === product.category_id)?.name || "-"}</TableCell>
                    <TableCell>
                      {product.sale_price ? (
                        <div>
                          <span className="text-xs text-muted-foreground line-through">R$ {Number(product.price).toFixed(2)}</span>
                          <br />
                          <span className="text-sm font-medium text-accent">R$ {Number(product.sale_price).toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium">R$ {Number(product.price).toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`text-sm font-medium ${product.stock <= 0 ? "text-destructive" : product.stock <= 5 ? "text-yellow-500" : "text-foreground"}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${product.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                        {product.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setEditing(product);
                          setForm({
                            name: product.name, slug: product.slug, description: product.description || "",
                            category_id: product.category_id || "", image_url: images[0] || "",
                            price: String(product.price), sale_price: product.sale_price ? String(product.sale_price) : "",
                            sku: product.sku || "", stock: String(product.stock),
                            is_featured: Boolean(product.is_featured), is_active: Boolean(product.is_active),
                          });
                          setDialogOpen(true);
                        }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientProducts;
