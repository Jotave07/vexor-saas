import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useStoreCart } from "@/hooks/useStoreCart";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { api } from "@/lib/api";
import { formatCurrency, productDisplayPrice } from "@/lib/storefront";
import { buildStorePath, resolveStoreSlug } from "@/lib/runtime-host";
import { StorefrontLayout } from "@/components/store/StorefrontLayout";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { ArrowRight, BadgePercent, MessageCircle, ShieldCheck, Truck } from "lucide-react";

const StoreHome = () => {
  const params = useParams();
  const slug = resolveStoreSlug(params.slug);
  const [catalog, setCatalog] = useState<any>({ store: null, settings: {}, categories: [], products: [], banners: [] });
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [search, setSearch] = useState("");
  const { items, addItem } = useStoreCart(slug);
  const { customer } = useStoreCustomer(slug);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setCatalogError("");
    api.get<any>(`/api/public/stores/${slug}/catalog`)
      .then((data: any) => setCatalog(data))
      .catch((error: any) => {
        console.error(error);
        setCatalogError("Nao foi possivel carregar a loja agora. Verifique se a API esta em execucao.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const categoryMap = useMemo(() => new Map((catalog.categories || []).map((item: any) => [item.id, item.name])), [catalog.categories]);
  const filteredProducts = useMemo(() => {
    return (catalog.products || []).filter((product: any) => {
      if (!search) return true;
      const categoryName = categoryMap.get(product.category_id) || "";
      return `${product.name} ${product.description || ""} ${categoryName}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [catalog.products, search, categoryMap]);

  const featuredProducts = useMemo(() => filteredProducts.filter((product: any) => product.is_featured).slice(0, 8), [filteredProducts]);
  const offerProducts = useMemo(() => filteredProducts.filter((product: any) => product.sale_price).slice(0, 8), [filteredProducts]);
  const catalogProducts = useMemo(() => filteredProducts.slice(0, 24), [filteredProducts]);
  const departmentSections = useMemo(() => {
    return (catalog.categories || []).slice(0, 4).map((category: any) => ({
      category,
      products: filteredProducts.filter((product: any) => product.category_id === category.id).slice(0, 4),
    })).filter((section: any) => section.products.length > 0);
  }, [catalog.categories, filteredProducts]);

  const heroProduct = featuredProducts[0] || offerProducts[0] || filteredProducts[0];
  const secondaryBanners = (catalog.banners || []).slice(1, 3);
  const social = catalog.settings?.social_links || {};
  const policies = catalog.settings?.policies || {};
  const institutional = catalog.settings?.institutional_texts || {};
  const home = catalog.settings?.home_settings || {};
  const campaigns = catalog.settings?.campaign_settings || {};
  const featuredBrands = Array.isArray(catalog.settings?.featured_brands) ? catalog.settings.featured_brands : [];
  const trustBadges = Array.isArray(catalog.settings?.trust_badges) ? catalog.settings.trust_badges : [];

  const handleAddToCart = async (productId: string, productName: string) => {
    try {
      await addItem(productId);
      toast({ title: "Produto adicionado", description: `${productName} foi para o carrinho.` });
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
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
      search={search}
      onSearchChange={setSearch}
    >
      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8">
        {catalogError && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col gap-4 p-5 text-amber-900 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">Falha ao carregar a loja</p>
                <p className="text-sm">{catalogError}</p>
              </div>
              <div className="text-sm">
                Rode <span className="font-semibold">npm run dev</span> para subir frontend e backend juntos.
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 text-sm text-slate-600">
              Carregando catalogo da loja...
            </CardContent>
          </Card>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-2xl">
            <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div className="space-y-6">
                <Badge className="rounded-full bg-sky-500 px-4 py-2 text-white">{campaigns.heroBadge || "Operacao comercial estruturada"}</Badge>
                <div className="space-y-4">
                  <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight md:text-5xl">
                    {home.heroTitle || "Catalogo robusto, compra segura e atendimento comercial em cada etapa."}
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-slate-300">
                    {home.heroSubtitle || institutional.home_hero || "Explore departamentos, ofertas e linhas de produto com uma navegacao completa, informacoes claras e checkout pensado para operacao real."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to={catalog.categories?.[0] ? buildStorePath(slug, `/categoria/${catalog.categories[0].id}`) : buildStorePath(slug)}>
                    <Button className="rounded-2xl bg-white px-6 text-slate-950 hover:bg-slate-100">Explorar departamentos</Button>
                  </Link>
                  <Link to={buildStorePath(slug, "/checkout")}>
                    <Button variant="outline" className="rounded-2xl border-white/30 bg-transparent px-6 text-white hover:bg-white/10">Ir para checkout</Button>
                  </Link>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Departamentos</p>
                    <p className="mt-2 text-2xl font-bold">{catalog.categories?.length || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Produtos ativos</p>
                    <p className="mt-2 text-2xl font-bold">{catalog.products?.length || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Atendimento</p>
                    <p className="mt-2 text-lg font-bold">{social.phone || "Comercial online"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-5 text-slate-950">
                {heroProduct ? (
                  <div className="space-y-4">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Destaque da operacao</p>
                    {heroProduct.images?.[0] ? (
                      <img src={heroProduct.images[0]} alt={heroProduct.name} className="aspect-square w-full rounded-[22px] object-cover" />
                    ) : (
                      <div className="aspect-square rounded-[22px] bg-slate-100" />
                    )}
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{String(categoryMap.get(heroProduct.category_id) || "Departamento")}</p>
                      <h2 className="font-heading text-2xl font-bold">{heroProduct.name}</h2>
                      <p className="line-clamp-3 text-sm leading-6 text-slate-500">{heroProduct.description || "Produto estrategico com disponibilidade para operacao comercial."}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        {heroProduct.sale_price && <p className="text-sm text-slate-400 line-through">{formatCurrency(heroProduct.price)}</p>}
                        <p className="text-3xl font-bold">{formatCurrency(productDisplayPrice(heroProduct))}</p>
                        <p className="text-xs text-emerald-600">Condicoes de pagamento configuradas por loja</p>
                      </div>
                      <Button className="rounded-2xl bg-sky-600 text-white hover:bg-sky-700" onClick={() => handleAddToCart(heroProduct.id, heroProduct.name)}>Comprar agora</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[420px] items-center justify-center rounded-[24px] bg-slate-100 text-slate-500">Cadastre produtos em destaque para reforcar a vitrine.</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {(secondaryBanners.length ? secondaryBanners : [null, null]).map((banner: any, index) => (
              <Card key={banner?.id || index} className="overflow-hidden rounded-[28px] border-slate-200 bg-white shadow-sm">
                <CardContent className="p-0">
                  {banner?.image_url ? (
                    <img src={banner.image_url} alt={banner.title || "Banner"} className="h-52 w-full object-cover" />
                  ) : (
                    <div className="h-52 bg-gradient-to-br from-slate-100 to-slate-200" />
                  )}
                  <div className="space-y-3 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{index === 0 ? (campaigns.promoLabel || "Campanha") : (campaigns.supportLabel || "Destaque")}</p>
                    <h3 className="font-heading text-xl font-bold text-slate-950">{banner?.title || (index === 0 ? "Condicoes comerciais para sua compra" : "Suporte e operacao em movimento")}</h3>
                    <p className="text-sm leading-6 text-slate-500">{banner?.link_url || (index === 0 ? "Promocoes, linhas prioritarias e departamentos com giro acelerado." : "Atendimento, logistica e checkout com cara de operacao consolidada.")}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Truck, title: "Frete calculado", description: "Prazo e custo por CEP no carrinho e no checkout." },
            { icon: ShieldCheck, title: "Pagamento seguro", description: "Checkout integrado e status persistido por pedido." },
            { icon: MessageCircle, title: "Atendimento comercial", description: social.phone || "Suporte para pedidos e cotacoes." },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <item.icon className="h-5 w-5 text-sky-600" />
              <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[32px] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">{home.categorySectionEyebrow || "Compre por departamento"}</p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-slate-950">{home.categorySectionTitle || "Navegue pelas linhas da operacao"}</h2>
            </div>
            <Link to={buildStorePath(slug)} className="text-sm font-medium text-sky-700">Ver catalogo completo</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {(catalog.categories || []).slice(0, 6).map((category: any, index: number) => (
              <Link key={category.id} to={buildStorePath(slug, `/categoria/${category.id}`)} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-200 hover:bg-sky-50">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Depto {index + 1}</p>
                <h3 className="mt-4 font-heading text-lg font-semibold text-slate-950">{category.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{filteredProducts.filter((product: any) => product.category_id === category.id).length} produtos disponiveis</p>
              </Link>
            ))}
          </div>
        </section>

        {offerProducts.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-rose-600">{home.offersEyebrow || "Ofertas em evidencia"}</p>
                <h2 className="mt-2 font-heading text-3xl font-bold text-slate-950">{home.offersTitle || "Condicoes especiais para acelerar a conversao"}</h2>
              </div>
              <Badge className="rounded-full bg-rose-600 px-4 py-2 text-white"><BadgePercent className="mr-2 h-4 w-4" />Ofertas ativas</Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {offerProducts.map((product: any) => (
                <StoreProductCard key={product.id} slug={slug || ""} product={product} categoryName={String(categoryMap.get(product.category_id) || "")} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">{home.featuredEyebrow || "Mais vendidos e destaques"}</p>
                <h2 className="mt-2 font-heading text-3xl font-bold text-slate-950">{home.featuredTitle || "Produtos com mais presenca comercial"}</h2>
              </div>
              <Link to={buildStorePath(slug)}><Button variant="outline" className="rounded-2xl border-slate-200 bg-white text-slate-950 hover:bg-slate-100">Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featuredProducts.map((product: any) => (
                <StoreProductCard key={product.id} slug={slug || ""} product={product} categoryName={String(categoryMap.get(product.category_id) || "")} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </section>
        )}

        {departmentSections.map((section: any) => (
          <section key={section.category.id} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Linha em destaque</p>
                <h2 className="mt-2 font-heading text-3xl font-bold text-slate-950">{section.category.name}</h2>
              </div>
              <Link to={buildStorePath(slug, `/categoria/${section.category.id}`)} className="text-sm font-medium text-sky-700">Explorar departamento</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {section.products.map((product: any) => (
                <StoreProductCard key={product.id} slug={slug || ""} product={product} categoryName={section.category.name} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Compra com suporte real</p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-slate-950">{home.supportTitle || "Precisa de ajuda para fechar seu pedido?"}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                {home.supportBody || "Use o atendimento comercial para tirar duvidas sobre produtos, condicoes de pagamento, entrega e disponibilidade de estoque."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={customer ? buildStorePath(slug, "/conta") : buildStorePath(slug, "/auth")}><Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">Minha conta</Button></Link>
              <Link to={buildStorePath(slug, "/carrinho")}><Button variant="outline" className="rounded-2xl border-slate-200 bg-white text-slate-950 hover:bg-slate-100">Ver carrinho</Button></Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { title: "Politica comercial", text: policies.payment || "Formas de pagamento definidas pela propria operacao." },
              { title: "Logistica", text: policies.shipping || "Prazo e frete calculados conforme a regra vigente da loja." },
              { title: "Suporte", text: social.phone || "Canal direto para atendimento comercial e suporte." },
              { title: "Trocas e garantia", text: policies.exchange || "Consulte condicoes de troca na finalizacao do pedido." },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] bg-slate-50 p-5">
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {catalogProducts.length > 0 && (
          <section className="space-y-5">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Catalogo completo</p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-slate-950">Todos os produtos disponiveis na loja</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {catalogProducts.map((product: any) => (
                <StoreProductCard key={product.id} slug={slug || ""} product={product} categoryName={String(categoryMap.get(product.category_id) || "")} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </section>
        )}

        {!loading && !catalogError && catalogProducts.length === 0 && (
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-8 text-center">
              <h2 className="font-heading text-2xl font-bold text-slate-950">Nenhum produto encontrado</h2>
              <p className="mt-3 text-sm text-slate-500">Ajuste a busca, revise os filtros ou cadastre produtos ativos no painel da empresa.</p>
            </CardContent>
          </Card>
        )}

        {(featuredBrands.length > 0 || trustBadges.length > 0) && (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="rounded-[32px] border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Marcas e campanhas</p>
                <h2 className="mt-2 font-heading text-2xl font-bold text-slate-950">{campaigns.seasonalHeadline || "Campanhas e marcas configuradas por loja"}</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {featuredBrands.map((brand: any, index: number) => (
                    <Badge key={`${brand.name || brand.label || "brand"}-${index}`} variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-4 py-2 text-slate-700">
                      {brand.name || brand.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Selos e beneficios</p>
                <div className="mt-4 space-y-3">
                  {trustBadges.slice(0, 3).map((badge: any, index: number) => (
                    <div key={`${badge.title || "badge"}-${index}`} className="rounded-[20px] bg-slate-50 p-4">
                      <h3 className="font-semibold text-slate-950">{badge.title}</h3>
                      {badge.text && <p className="mt-2 text-sm leading-6 text-slate-500">{badge.text}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </StorefrontLayout>
  );
};

export default StoreHome;
