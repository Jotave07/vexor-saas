import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Loader2, FolderOpen } from "lucide-react";
import { api } from "@/lib/api";

const ClientCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", is_active: true, sort_order: 0 });

  const fetchCategories = async () => {
    const response = await api.get<{ items: any[] }>("/api/client/categories");
    setCategories(response.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories().catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        description: form.description,
        is_active: form.is_active ? 1 : 0,
        sort_order: form.sort_order,
      };
      if (editing) {
        await api.put(`/api/client/categories/${editing.id}`, payload);
      } else {
        await api.post("/api/client/categories", payload);
      }
      toast({ title: editing ? "Categoria atualizada!" : "Categoria criada!" });
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: "", slug: "", description: "", is_active: true, sort_order: 0 });
      await fetchCategories();
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
          <h1>Categorias</h1>
          <p>Organize os produtos da sua loja ({categories.length} categorias).</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm({ name: "", slug: "", description: "", is_active: true, sort_order: 0 }); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" />Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da categoria" /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição opcional" /></div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                  Ativa
                </label>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Ordem:</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-20 h-8" />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Salvar Alterações" : "Criar Categoria"}
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
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="empty-state py-12">
                      <FolderOpen className="empty-state-icon" />
                      <p className="empty-state-title">Nenhuma categoria</p>
                      <p className="empty-state-description">Crie categorias para organizar seus produtos.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                        <FolderOpen className="h-4 w-4 text-accent" />
                      </div>
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${category.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {category.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setEditing(category);
                      setForm({ name: category.name, slug: category.slug, description: category.description || "", is_active: Boolean(category.is_active), sort_order: category.sort_order || 0 });
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

export default ClientCategories;
