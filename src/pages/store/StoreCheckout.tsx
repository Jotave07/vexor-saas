import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStoreCart } from "@/hooks/useStoreCart";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/storefront";
import { StorefrontLayout } from "@/components/store/StorefrontLayout";
import { CreditCard, MapPin, ShieldCheck, Truck } from "lucide-react";

const StoreCheckout = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<any>({ store: null, settings: { payment_methods: [] }, categories: [], products: [] });
  const { customer, addresses } = useStoreCustomer(slug);
  const { sessionToken, lineItems, subtotal, clearCart, items } = useStoreCart(slug);
  const [shippingQuotes, setShippingQuotes] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentPreview, setPaymentPreview] = useState<any>(null);
  const fieldClassName = "h-12 rounded-2xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:ring-sky-500";
  const labelClassName = "text-sm font-semibold text-slate-700";
  const selectClassName = "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500";
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    reference_note: "",
    paymentMethod: "pix",
    shippingMethodCode: "",
    couponCode: "",
  });

  useEffect(() => {
    if (!slug) return;
    api.get(`/api/public/stores/${slug}/catalog`).then((response) => {
      setCatalog(response);
      const defaultMethod = response.settings?.payment_methods?.find((method: any) => method.enabled !== false)?.code;
      if (defaultMethod) setForm((current) => ({ ...current, paymentMethod: defaultMethod }));
    }).catch(console.error);
  }, [slug]);

  useEffect(() => {
    if (!customer) return;
    setForm((current) => ({
      ...current,
      name: customer.fullName || current.name,
      email: customer.email || current.email,
      phone: customer.phone || current.phone,
      document: customer.document || current.document,
    }));
  }, [customer]);

  useEffect(() => {
    const defaultAddress = addresses.find((item) => item.is_default) || addresses[0];
    if (!defaultAddress) return;
    setForm((current) => ({
      ...current,
      cep: defaultAddress.zip_code || current.cep,
      street: defaultAddress.street || current.street,
      number: defaultAddress.number || current.number,
      complement: defaultAddress.complement || current.complement,
      district: defaultAddress.district || current.district,
      city: defaultAddress.city || current.city,
      state: defaultAddress.state || current.state,
      reference_note: defaultAddress.reference_note || current.reference_note,
    }));
  }, [addresses]);

  const statusMessage = searchParams.get("status");
  const selectedShipping = shippingQuotes.find((method) => method.code === form.shippingMethodCode);
  const total = useMemo(() => subtotal + Number(selectedShipping?.amount || 0), [selectedShipping?.amount, subtotal]);

  const fetchShipping = async () => {
    if (!slug || !form.cep) return;
    setLoadingShipping(true);
    try {
      const response = await api.post<any>(`/api/public/stores/${slug}/shipping/quote`, {
        cep: form.cep,
        sessionToken,
      });
      setShippingQuotes(response.methods || []);
      setForm((current) => ({
        ...current,
        shippingMethodCode: current.shippingMethodCode || response.methods?.[0]?.code || "",
        street: current.street || response.destination?.street || "",
        district: current.district || response.destination?.district || "",
        city: current.city || response.destination?.city || "",
        state: current.state || response.destination?.state || "",
      }));
    } catch (error) {
      toast({ title: "Erro no frete", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slug) return;
    setSubmitting(true);

    try {
      const response = await api.post<any>(`/api/public/stores/${slug}/checkout`, {
        sessionToken,
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          document: form.document,
        },
        shipping_address: {
          cep: form.cep,
          street: form.street,
          number: form.number,
          complement: form.complement,
          district: form.district,
          city: form.city,
          state: form.state,
          reference_note: form.reference_note,
        },
        shipping_method_code: form.shippingMethodCode,
        payment_method: form.paymentMethod,
        coupon_code: form.couponCode,
      });

      setPaymentPreview(response.paymentCostPreview || null);
      if (response.paymentRedirectUrl) {
        window.location.href = response.paymentRedirectUrl;
        return;
      }

      await clearCart();
      toast({ title: "Pedido criado", description: `Pedido #${response.orderNumber} registrado.` });
    } catch (error) {
      toast({ title: "Erro no checkout", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StorefrontLayout
      slug={slug || ""}
      store={catalog.store}
      settings={catalog.settings}
      categories={catalog.categories}
      customer={customer}
      cartCount={items.reduce((sum, item) => sum + item.quantity, 0)}
    >
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Finalizacao da compra</p>
              <h1 className="mt-2 font-heading text-4xl font-bold text-slate-950">Checkout</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-slate-950 px-4 py-2 text-white"><ShieldCheck className="mr-2 h-4 w-4" />Pedido persistido</Badge>
              <Badge className="rounded-full bg-sky-600 px-4 py-2 text-white"><CreditCard className="mr-2 h-4 w-4" />Pagamento configurado</Badge>
            </div>
          </div>
          {statusMessage && <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Retorno do pagamento: {statusMessage}</p>}
        </section>

        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="rounded-[28px] border-slate-200 bg-white shadow-sm">
              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center gap-2"><MapPin className="h-5 w-5 text-sky-600" /><h2 className="font-heading text-2xl font-bold text-slate-950">Dados e entrega</h2></div>
                <div className="space-y-2"><Label className={labelClassName}>Nome</Label><Input className={fieldClassName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label className={labelClassName}>Email</Label><Input className={fieldClassName} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                <div className="space-y-2"><Label className={labelClassName}>Telefone</Label><Input className={fieldClassName} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label className={labelClassName}>Documento</Label><Input className={fieldClassName} value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
                <div className="space-y-2"><Label className={labelClassName}>CEP</Label><Input className={fieldClassName} value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} required /></div>
                <div className="flex items-end"><Button type="button" variant="outline" onClick={fetchShipping} disabled={loadingShipping || !form.cep} className="rounded-2xl border-slate-300 bg-white text-slate-950 hover:bg-slate-100">Calcular frete</Button></div>
                <div className="space-y-2 md:col-span-2"><Label className={labelClassName}>Rua</Label><Input className={fieldClassName} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required /></div>
                <div className="space-y-2"><Label className={labelClassName}>Numero</Label><Input className={fieldClassName} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></div>
                <div className="space-y-2"><Label className={labelClassName}>Complemento</Label><Input className={fieldClassName} value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} /></div>
                <div className="space-y-2"><Label className={labelClassName}>Bairro</Label><Input className={fieldClassName} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required /></div>
                <div className="space-y-2"><Label className={labelClassName}>Cidade</Label><Input className={fieldClassName} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
                <div className="space-y-2"><Label className={labelClassName}>Estado</Label><Input className={fieldClassName} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required /></div>
                <div className="space-y-2 md:col-span-2"><Label className={labelClassName}>Referencia</Label><Input className={fieldClassName} value={form.reference_note} onChange={(e) => setForm({ ...form, reference_note: e.target.value })} /></div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-slate-200 bg-white shadow-sm">
              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center gap-2"><Truck className="h-5 w-5 text-sky-600" /><h2 className="font-heading text-2xl font-bold text-slate-950">Frete e pagamento</h2></div>
                <div className="space-y-2 md:col-span-2">
                  <Label className={labelClassName}>Metodo de frete</Label>
                  <select className={selectClassName} value={form.shippingMethodCode} onChange={(e) => setForm({ ...form, shippingMethodCode: e.target.value })} required>
                    <option value="">Selecione um frete</option>
                    {shippingQuotes.map((method) => (
                      <option key={method.code} value={method.code}>
                        {method.name} - {formatCurrency(method.amount)} - {method.deliveryDays} dia(s)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClassName}>Pagamento</Label>
                  <select className={selectClassName} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                    {(catalog.settings?.payment_methods || []).map((method: any) => (
                      <option key={method.code} value={method.code}>{method.label || method.code}</option>
                    ))}
                    {(!catalog.settings?.payment_methods || catalog.settings.payment_methods.length === 0) && (
                      <>
                        <option value="pix">PIX</option>
                        <option value="card">Cartao</option>
                        <option value="boleto">Boleto</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2"><Label className={labelClassName}>Cupom</Label><Input className={fieldClassName} value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} /></div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={submitting || lineItems.length === 0 || !form.shippingMethodCode} className="rounded-2xl bg-sky-600 px-8 text-white hover:bg-sky-700">
              Finalizar e seguir para pagamento
            </Button>
          </form>

          <div className="space-y-6">
            <Card className="sticky top-6 rounded-[28px] border-slate-200 bg-slate-900 text-white shadow-sm">
              <CardContent className="space-y-5 p-6">
                <h2 className="font-heading text-2xl font-bold">Resumo final</h2>
                <div className="space-y-3 text-sm">
                  {lineItems.map((line) => (
                    <div key={line.product_id} className="flex justify-between gap-3 text-slate-300">
                      <span>{line.name} x {line.quantity}</span>
                      <span>{formatCurrency(Number(line.unit_price) * line.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Frete</span><span>{selectedShipping ? formatCurrency(selectedShipping.amount) : "A calcular"}</span></div>
                  <div className="flex justify-between text-xl font-bold text-white"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
                {paymentPreview && (
                  <div className="rounded-[22px] bg-slate-800 p-4 text-xs text-slate-200">
                    <p className="font-semibold text-white">Preview operacional</p>
                    <p className="mt-2">Gateway: {formatCurrency(paymentPreview.gatewayFee)}</p>
                    <p>Plataforma: {formatCurrency(paymentPreview.platformFee)}</p>
                    <p>Antecipacao: {formatCurrency(paymentPreview.anticipationFee)}</p>
                    <p>Liquido estimado: {formatCurrency(paymentPreview.estimatedNetAmount)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </StorefrontLayout>
  );
};

export default StoreCheckout;
