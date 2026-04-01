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

const emptyForm = { title: "", image_url: "", link_url: "", position: "home", sort_order: "0", is_active: true };

const ClientBanners = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchBanners = async () => {
    const response = await api.get<{ items: any[] }>("/api/client/banners");
    setBanners(response.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const payload = {
      title: form.title,
      image_url: form.image_url,
      link_url: form.link_url || null,
      position: form.position,
      sort_order: parseInt(form.sort_order, 10) || 0,
      is_active: form.is_active ? 1 : 0,
    };

    try {
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Banners</h1>
          <p className="text-muted-foreground">Gerencie os banners da sua loja.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" />Novo Banner</Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar" : "Novo"} Banner</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Titulo</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>URL da imagem</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Link</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full bg-gradient-primary text-primary-foreground">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-border/50 glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Titulo</TableHead><TableHead>Posicao</TableHead><TableHead>Imagem</TableHead><TableHead className="text-right">Acoes</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : banners.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum banner cadastrado.</TableCell></TableRow>
              ) : banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="font-medium">{banner.title || "-"}</TableCell>
                  <TableCell>{banner.position}</TableCell>
                  <TableCell className="text-muted-foreground">{banner.image_url}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditing(banner); setForm({ title: banner.title || "", image_url: banner.image_url, link_url: banner.link_url || "", position: banner.position || "home", sort_order: String(banner.sort_order || 0), is_active: Boolean(banner.is_active) }); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button></TableCell>
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
