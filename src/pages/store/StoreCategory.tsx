import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StorefrontLayout } from "@/components/store/StorefrontLayout";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { useStoreCart } from "@/hooks/useStoreCart";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { buildStorePath, resolveStoreSlug } from "@/lib/runtime-host";

const StoreCategory = () => {
  const params = useParams();
  const slug = resolveStoreSlug(params.slug);
  const categoryId = params.categoryId;
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<any>({ store: null, settings: {}, categories: [], products: [], banners: [] });
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const { items, addItem } = useStoreCart(slug);
  const { customer } = useStoreCustomer(slug);

  useEffect(() => {
    if (!slug) return;
    api.get(`/api/public/stores/${slug}/catalog`).then(setCatalog).catch(console.error);
  }, [slug]);

  const category = useMemo(() => (catalog.categories || []).find((item: any) => item.id === categoryId), [catalog.categories, categoryId]);
  const relatedCategories = useMemo(() => (catalog.categories || []).filter((item: any) => item.id !== categoryId).slice(0, 6), [catalog.categories, categoryId]);
  const sort = searchParams.get("sort") || "relevance";

  const products = useMemo(() => {
    const filtered = (catalog.products || []).filter((product: any) => {
      if (product.category_id !== categoryId) return false;
      if (search && !`${product.name} ${product.description || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    if (sort === "price_asc") return [...filtered].sort((a, b) => Number(a.sale_price ?? a.price) - Number(b.sale_price ?? b.price));
    if (sort === "price_desc") return [...filtered].sort((a, b) => Number(b.sale_price ?? b.price) - Number(a.sale_price ?? a.price));
    return filtered;
  }, [catalog.products, categoryId, search, sort]);

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
      onSearchChange={(value) => {
        setSearch(value);
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          if (value) next.set("q", value); else next.delete("q");
          return next;
        });
      }}
    >
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to={buildStorePath(slug)}>Home</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{category?.name || "Categoria"}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Departamento</p>
              <h1 className="font-heading text-4xl font-bold text-slate-950">{category?.name || "Categoria"}</h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-500">{category?.description || "Explore uma linha de produtos com filtros rapidos, navegação rica e contexto comercial."}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nesta categoria" className="rounded-2xl border-slate-200 bg-slate-50" />
              <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm" value={sort} onChange={(event) => setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.set("sort", event.target.value);
                return next;
              })}>
                <option value="relevance">Mais relevantes</option>
                <option value="price_asc">Menor preco</option>
                <option value="price_desc">Maior preco</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-slate-950">Subnavegacao</h2>
              <div className="mt-4 space-y-3 text-sm">
                {relatedCategories.map((item: any) => (
                  <Link key={item.id} to={buildStorePath(slug, `/categoria/${item.id}`)} className="block rounded-2xl border border-slate-200 px-4 py-3 text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-slate-950">{item.name}</Link>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-sm">
              <h3 className="font-heading text-2xl font-bold">Atendimento especializado</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">Consulte disponibilidade, frete, prazo e condicoes comerciais antes de fechar o pedido.</p>
              <div className="mt-6"><Link to={buildStorePath(slug, "/carrinho")}><Button className="rounded-2xl bg-white text-slate-950 hover:bg-slate-100">Ver carrinho</Button></Link></div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-[28px] bg-white px-6 py-4 shadow-sm">
              <p className="text-sm text-slate-500"><strong className="text-slate-950">{products.length}</strong> resultados encontrados</p>
              <Link to={buildStorePath(slug)} className="text-sm font-medium text-sky-700">Voltar para todas as linhas</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product: any) => (
                <StoreProductCard key={product.id} slug={slug || ""} product={product} categoryName={category?.name} onAddToCart={handleAddToCart} />
              ))}
            </div>
            {products.length === 0 && (
              <div className="rounded-[28px] bg-white p-10 text-center text-slate-500 shadow-sm">
                Nenhum produto encontrado para esta categoria.
              </div>
            )}
          </div>
        </section>
      </main>
    </StorefrontLayout>
  );
};

export default StoreCategory;
