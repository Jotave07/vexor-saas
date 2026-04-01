import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { buildStorePath, resolveStoreSlug } from "@/lib/runtime-host";

const StoreAccount = () => {
  const params = useParams();
  const slug = resolveStoreSlug(params.slug);
  const navigate = useNavigate();
  const { customer, addresses, loading, refresh, logout } = useStoreCustomer(slug);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState({ fullName: "", phone: "", document: "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [addressForm, setAddressForm] = useState({
    label: "Endereco",
    recipient_name: "",
    phone: "",
    document: "",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    reference_note: "",
  });

  useEffect(() => {
    if (!loading && !customer && slug) {
      navigate(buildStorePath(slug, "/auth"));
    }
  }, [customer, loading, navigate, slug]);

  useEffect(() => {
    if (!customer || !slug) return;
    setProfile({
      fullName: customer.fullName || "",
      phone: customer.phone || "",
      document: customer.document || "",
    });
    api.get<{ orders: any[] }>(`/api/public/stores/${slug}/account/orders`)
      .then((response) => setOrders(response.orders || []))
      .catch(console.error);
  }, [customer, slug]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!slug) return;
    try {
      await api.put(`/api/public/stores/${slug}/account/profile`, profile);
      await refresh();
      toast({ title: "Perfil atualizado" });
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!slug) return;
    try {
      await api.put(`/api/public/stores/${slug}/account/password`, password);
      setPassword({ currentPassword: "", newPassword: "" });
      toast({ title: "Senha atualizada" });
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    if (!slug) return;
    try {
      await api.post(`/api/public/stores/${slug}/account/addresses`, {
        ...addressForm,
        is_default: addresses.length === 0,
      });
      setAddressForm({
        label: "Endereco",
        recipient_name: "",
        phone: "",
        document: "",
        zip_code: "",
        street: "",
        number: "",
        complement: "",
        district: "",
        city: "",
        state: "",
        reference_note: "",
      });
      await refresh();
      toast({ title: "Endereco salvo" });
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(buildStorePath(slug));
  };

  if (!customer) {
    return <div className="p-8 text-center text-muted-foreground">Carregando sua conta...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={buildStorePath(slug)} className="text-sm text-muted-foreground">Voltar para a loja</Link>
          <h1 className="font-heading text-3xl font-bold">Minha conta</h1>
        </div>
        <Button variant="outline" className="border-slate-200 bg-white text-slate-950 hover:bg-slate-100" onClick={handleLogout}>Sair</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-xl font-semibold">Meus pedidos</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
          ) : orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">Pedido #{order.order_number}</span>
                <span>{order.status}</span>
              </div>
              <p className="mt-2 text-muted-foreground">Pagamento: {order.payment_status} | Entrega: {order.delivery_status || "pendente"}</p>
              <p className="mt-1 font-semibold">R$ {Number(order.total).toFixed(2)}</p>
            </div>
          ))}
        </CardContent></Card>

        <Card><CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-xl font-semibold">Meus dados</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="space-y-2"><Label>Nome</Label><Input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Documento</Label><Input value={profile.document} onChange={(e) => setProfile({ ...profile, document: e.target.value })} /></div>
            <Button type="submit">Salvar perfil</Button>
          </form>
        </CardContent></Card>

        <Card><CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-xl font-semibold">Enderecos</h2>
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-xl border border-border p-4 text-sm">
                <p className="font-medium">{address.recipient_name}</p>
                <p className="text-muted-foreground">{address.street}, {address.number} - {address.district}</p>
                <p className="text-muted-foreground">{address.city}/{address.state} - {address.zip_code}</p>
              </div>
            ))}
          </div>
          <form onSubmit={saveAddress} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2"><Label>Label</Label><Input value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} /></div>
            <div className="space-y-2"><Label>Destinatario</Label><Input value={addressForm.recipient_name} onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Documento</Label><Input value={addressForm.document} onChange={(e) => setAddressForm({ ...addressForm, document: e.target.value })} /></div>
            <div className="space-y-2"><Label>CEP</Label><Input value={addressForm.zip_code} onChange={(e) => setAddressForm({ ...addressForm, zip_code: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Rua</Label><Input value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Numero</Label><Input value={addressForm.number} onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Complemento</Label><Input value={addressForm.complement} onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })} /></div>
            <div className="space-y-2"><Label>Bairro</Label><Input value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Cidade</Label><Input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Estado</Label><Input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Referencia</Label><Input value={addressForm.reference_note} onChange={(e) => setAddressForm({ ...addressForm, reference_note: e.target.value })} /></div>
            <div className="md:col-span-2"><Button type="submit">Adicionar endereco</Button></div>
          </form>
        </CardContent></Card>

        <Card><CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-xl font-semibold">Alterar senha</h2>
          <form onSubmit={savePassword} className="space-y-3">
            <div className="space-y-2"><Label>Senha atual</Label><Input type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Nova senha</Label><Input type="password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} required /></div>
            <Button type="submit">Atualizar senha</Button>
          </form>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default StoreAccount;
