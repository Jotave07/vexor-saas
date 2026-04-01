import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStoreCart } from "@/hooks/useStoreCart";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/storefront";
import { buildStorePath, resolveStoreSlug } from "@/lib/runtime-host";
import { StorefrontLayout } from "@/components/store/StorefrontLayout";
import { Minus, Plus, ShieldCheck, Truck } from "lucide-react";

const StoreCart = () => {
  const params = useParams();
  const slug = resolveStoreSlug(params.slug);
  const { customer } = useStoreCustomer(slug);
  const { sessionToken, lineItems, subtotal, updateQuantity, removeItem } = useStoreCart(slug);
  const [cep, setCep] = useState("");
  const [shippingQuotes, setShippingQuotes] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const fetchShipping = async () => {
    if (!slug || !cep) return;
    setLoadingShipping(true);
    try {
      const response = await api.post<any>(`/api/public/stores/${slug}/shipping/quote`, {
        cep,
        sessionToken,
      });
      setShippingQuotes(response.methods || []);
    } catch (error) {
      toast({ title: "Erro no frete", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingShipping(false);
    }
  };

  return (
    <StorefrontLayout
      slug={slug || ""}
      store={{ name: "Carrinho" }}
      settings={{}}
      categories={[]}
      customer={customer}
      cartCount={lineItems.reduce((sum, item) => sum + item.quantity, 0)}
    >
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Resumo da compra</p>
              <h1 className="mt-2 font-heading text-4xl font-bold text-slate-950">Carrinho</h1>
            </div>
            <Link to={buildStorePath(slug)}><Button variant="outline" className="rounded-2xl border-slate-200 bg-white text-slate-950 hover:bg-slate-100">Continuar comprando</Button></Link>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {lineItems.length === 0 ? (
              <div className="rounded-[28px] bg-white p-12 text-center text-slate-500 shadow-sm">Seu carrinho esta vazio.</div>
            ) : lineItems.map((item) => (
              <Card key={item.product_id} className="rounded-[28px] border-slate-200 bg-white shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Item do pedido</p>
                    <p className="font-heading text-xl font-semibold text-slate-950">{item.name || "Produto"}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(item.unit_price)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <button onClick={async () => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}><Minus className="h-4 w-4 text-slate-600" /></button>
                      <Input type="number" min={1} value={item.quantity} onChange={async (event) => updateQuantity(item.product_id, Number(event.target.value))} className="h-9 w-16 border-none bg-transparent px-0 text-center shadow-none" />
                      <button onClick={async () => updateQuantity(item.product_id, item.quantity + 1)}><Plus className="h-4 w-4 text-slate-600" /></button>
                    </div>
                    <div className="w-28 text-right">
                      <p className="text-xs text-slate-400">Subtotal</p>
                      <p className="font-semibold text-slate-950">{formatCurrency(Number(item.unit_price || 0) * item.quantity)}</p>
                    </div>
                    <Button variant="ghost" className="rounded-2xl text-slate-500 hover:text-red-600" onClick={async () => removeItem(item.product_id)}>Remover</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2 text-slate-950"><Truck className="h-5 w-5 text-sky-600" /><h2 className="font-heading text-xl font-bold">Calcular frete</h2></div>
                <div className="flex gap-3">
                  <Input value={cep} onChange={(event) => setCep(event.target.value)} placeholder="Digite seu CEP" className="rounded-2xl border-slate-200 bg-slate-50" />
                  <Button onClick={fetchShipping} disabled={loadingShipping || !cep} className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">Calcular</Button>
                </div>
                <div className="space-y-3">
                  {shippingQuotes.map((quote) => (
                    <div key={quote.code} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-950">{quote.name}</p>
                        <p className="text-slate-500">{quote.deliveryDays} dia(s)</p>
                      </div>
                      <p className="font-semibold text-slate-950">{formatCurrency(quote.amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-slate-200 bg-slate-950 text-white shadow-sm">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-400" /><h2 className="font-heading text-xl font-bold">Fechamento seguro</h2></div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Frete</span><span>Calculado no checkout</span></div>
                  <div className="border-t border-white/10 pt-3 text-lg font-bold"><div className="flex justify-between"><span>Total parcial</span><span>{formatCurrency(subtotal)}</span></div></div>
                </div>
                <Link to={buildStorePath(slug, "/checkout")}><Button className="w-full rounded-2xl bg-sky-600 text-white hover:bg-sky-700" disabled={lineItems.length === 0}>Ir para checkout</Button></Link>
                <p className="text-xs leading-6 text-slate-400">Os valores finais de frete, pagamento e cupons sao confirmados no checkout com validacao em tempo real.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </StorefrontLayout>
  );
};

export default StoreCart;
