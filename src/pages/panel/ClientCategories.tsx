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
    fetchCategories().catch((error) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground">Organize os produtos da sua loja.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm({ name: "", slug: "", description: "", is_active: true, sort_order: 0 }); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" />Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descricao</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : categories.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Nenhuma categoria.</TableCell></TableRow>
              ) : categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-1 text-xs ${category.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{category.is_active ? "Ativa" : "Inativa"}</span></TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(category);
                        setForm({
                          name: category.name,
                          slug: category.slug,
                          description: category.description || "",
                          is_active: Boolean(category.is_active),
                          sort_order: category.sort_order || 0,
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

export default ClientCategories;
