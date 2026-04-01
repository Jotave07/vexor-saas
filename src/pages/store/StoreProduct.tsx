import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useStoreCart } from "@/hooks/useStoreCart";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatCurrency, productDisplayPrice } from "@/lib/storefront";
import { StorefrontLayout } from "@/components/store/StorefrontLayout";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { CreditCard, ShieldCheck, ShoppingCart, Truck } from "lucide-react";

const StoreProduct = () => {
  const { slug, productId } = useParams();
  const [catalog, setCatalog] = useState<any>({ store: null, settings: {}, categories: [], products: [], banners: [] });
  const [selectedImage, setSelectedImage] = useState(0);
  const [shippingZip, setShippingZip] = useState("");
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const { items, sessionToken, addItem } = useStoreCart(slug);
  const { customer } = useStoreCustomer(slug);

  useEffect(() => {
    if (!slug) return;
    api.get(`/api/public/stores/${slug}/catalog`).then(setCatalog).catch(console.error);
  }, [slug]);

  const product = useMemo(() => (catalog.products || []).find((item: any) => item.id === productId), [catalog.products, productId]);
  const category = useMemo(() => (catalog.categories || []).find((item: any) => item.id === product?.category_id), [catalog.categories, product?.category_id]);
  const relatedProducts = useMemo(() => (catalog.products || []).filter((item: any) => item.id !== productId && item.category_id === product?.category_id).slice(0, 4), [catalog.products, productId, product?.category_id]);
  const gallery = Array.isArray(product?.images) && product.images.length ? product.images : [null];

  const handleAdd = async () => {
    if (!product) return;
    try {
      await addItem(product.id);
      toast({ title: "Produto adicionado", description: `${product.name} foi para o carrinho.` });
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleShippingQuote = async () => {
    if (!slug || !product || !shippingZip) return;
    setLoadingShipping(true);
    try {
      await addItem(product.id, 1);
      const response = await api.post<any>(`/api/public/stores/${slug}/shipping/quote`, {
        cep: shippingZip,
        sessionToken,
      });
      setShippingOptions(response.methods || []);
    } catch (error) {
      toast({ title: "Erro no frete", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingShipping(false);
    }
  };

  if (!product) {
    return <div className="p-8 text-center text-muted-foreground">Produto nao encontrado.</div>;
  }

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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/shop/${slug}`}>Home</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            {category && <><BreadcrumbItem><BreadcrumbLink asChild><Link to={`/shop/${slug}/category/${category.id}`}>{category.name}</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /></>}
            <BreadcrumbItem><BreadcrumbPage>{product.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[32px] border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="overflow-hidden rounded-[28px] bg-slate-100">
                {gallery[selectedImage] ? (
                  <img src={gallery[selectedImage]} alt={product.name} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="aspect-square w-full bg-gradient-to-br from-slate-200 to-slate-100" />
                )}
              </div>
              {gallery.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {gallery.map((image, index) => (
                    <button key={`${image}-${index}`} onClick={() => setSelectedImage(index)} className={`overflow-hidden rounded-2xl border ${index === selectedImage ? "border-sky-500" : "border-slate-200"}`}>
                      {image ? <img src={image} alt={`${product.name}-${index}`} className="aspect-square w-full object-cover" /> : <div className="aspect-square w-full bg-slate-100" />}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[32px] border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-6 p-8">
                <div className="space-y-3">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">{category?.name || "Departamento"}</p>
                  <h1 className="font-heading text-4xl font-bold text-slate-950">{product.name}</h1>
                  <p className="text-sm leading-7 text-slate-500">{product.description || "Produto com disponibilidade operacional e apoio comercial para compra segura."}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] bg-slate-50 p-5">
                    {product.sale_price && <p className="text-sm text-slate-400 line-through">{formatCurrency(product.price)}</p>}
                    <p className="mt-1 text-4xl font-bold text-slate-950">{formatCurrency(productDisplayPrice(product))}</p>
                    <p className="mt-2 text-sm text-emerald-600">PIX em destaque conforme estrategia da loja</p>
                  </div>
                  <div className="rounded-[24px] bg-slate-950 p-5 text-white">
                    <p className="text-sm text-slate-300">Estoque disponivel</p>
                    <p className="mt-2 text-3xl font-bold">{product.stock}</p>
                    <p className="mt-2 text-sm text-slate-300">SKU: {product.sku || "Nao informado"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-2xl bg-sky-600 px-6 text-white hover:bg-sky-700" onClick={handleAdd}><ShoppingCart className="mr-2 h-4 w-4" />Adicionar ao carrinho</Button>
                  <Link to={`/shop/${slug}/cart`}><Button variant="outline" className="rounded-2xl border-slate-200 bg-white px-6 text-slate-950 hover:bg-slate-100">Ver carrinho</Button></Link>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] bg-slate-50 p-4">
                    <Truck className="h-5 w-5 text-sky-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-950">Frete por CEP</p>
                    <p className="mt-1 text-sm text-slate-500">Calcule no momento da compra com opcoes reais.</p>
                  </div>
                  <div className="rounded-[22px] bg-slate-50 p-4">
                    <CreditCard className="h-5 w-5 text-sky-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-950">Pagamento configurado</p>
                    <p className="mt-1 text-sm text-slate-500">Metodos definidos pela operacao atual.</p>
                  </div>
                  <div className="rounded-[22px] bg-slate-50 p-4">
                    <ShieldCheck className="h-5 w-5 text-sky-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-950">Pedido persistido</p>
                    <p className="mt-1 text-sm text-slate-500">Status financeiro e logistico com rastreabilidade.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-4 p-8">
                <h2 className="font-heading text-2xl font-bold text-slate-950">Calcule prazo e frete</h2>
                <div className="flex gap-3">
                  <Input value={shippingZip} onChange={(event) => setShippingZip(event.target.value)} placeholder="Digite seu CEP" className="rounded-2xl border-slate-200 bg-slate-50" />
                  <Button type="button" className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={handleShippingQuote} disabled={loadingShipping || !shippingZip}>Calcular</Button>
                </div>
                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <div key={option.code} className="flex items-center justify-between rounded-[22px] border border-slate-200 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-950">{option.name}</p>
                        <p className="text-slate-500">{option.deliveryDays} dia(s)</p>
                      </div>
                      <p className="font-semibold text-slate-950">{formatCurrency(option.amount)}</p>
                    </div>
                  ))}
                  {shippingOptions.length === 0 && <p className="text-sm text-slate-500">Informe um CEP para consultar opcoes disponiveis.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-slate-200 bg-white shadow-sm">
              <CardContent className="grid gap-4 p-8 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Ficha tecnica</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p><strong className="text-slate-950">Departamento:</strong> {category?.name || "Nao informado"}</p>
                    <p><strong className="text-slate-950">SKU:</strong> {product.sku || "Nao informado"}</p>
                    <p><strong className="text-slate-950">Estoque:</strong> {product.stock}</p>
                    <p><strong className="text-slate-950">Codigo interno:</strong> {product.id}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Descricao comercial</p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{product.description || "Item com disponibilidade imediata para venda na operacao."}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="space-y-5">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Produtos relacionados</p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-slate-950">Continue comprando nesta mesma linha</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((item: any) => (
                <StoreProductCard key={item.id} slug={slug || ""} product={item} categoryName={category?.name} onAddToCart={async (id, name) => {
                  try {
                    await addItem(id);
                    toast({ title: "Produto adicionado", description: `${name} foi para o carrinho.` });
                  } catch (error) {
                    toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
                  }
                }} />
              ))}
            </div>
          </section>
        )}
      </main>
    </StorefrontLayout>
  );
};

export default StoreProduct;
