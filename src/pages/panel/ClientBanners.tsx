import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Loader2, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";

const emptyForm = { title: "", image_url: "", link_url: "", position: "home", sort_order: "0", is_active: true };

const ClientBanners = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchBanners = async () => {
    const response = await api.get<{ items: any[] }>("/api/client/banners");
    setBanners(response.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners().catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.image_url) {
      toast({ title: "URL da imagem é obrigatória", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        image_url: form.image_url,
        link_url: form.link_url || null,
        position: form.position,
        sort_order: parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active ? 1 : 0,
      };
      if (editing) {
        await api.put(`/api/client/banners/${editing.id}`, payload);
      } else {
        await api.post("/api/client/banners", payload);
      }
      toast({ title: editing ? "Banner atualizado!" : "Banner criado!" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await fetchBanners();
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
          <h1>Banners</h1>
          <p>Gerencie os banners da sua loja ({banners.length} banners).</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" />Novo Banner</Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Novo"} Banner</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do banner" /></div>
              <div className="space-y-2"><Label>URL da imagem *</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              {form.image_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              <div className="space-y-2"><Label>Link (opcional)</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Posição</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="home" /></div>
                <div className="space-y-2"><Label>Ordem</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                Banner ativo
              </label>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Salvar Alterações" : "Criar Banner"}
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
                <TableHead>Preview</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden sm:table-cell">Posição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="empty-state py-12">
                      <ImageIcon className="empty-state-icon" />
                      <p className="empty-state-title">Nenhum banner</p>
                      <p className="empty-state-description">Adicione banners para destacar promoções e conteúdo na loja.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.title || "Banner"} className="h-10 w-16 rounded-md object-cover ring-1 ring-border" />
                    ) : (
                      <div className="h-10 w-16 rounded-md bg-secondary flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{banner.title || "Sem título"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{banner.position}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${banner.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {banner.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setEditing(banner);
                      setForm({ title: banner.title || "", image_url: banner.image_url, link_url: banner.link_url || "", position: banner.position || "home", sort_order: String(banner.sort_order || 0), is_active: Boolean(banner.is_active) });
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

export default ClientBanners;
