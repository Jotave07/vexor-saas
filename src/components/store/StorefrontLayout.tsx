import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Headset, MapPin, MessageCircle, Search, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { whatsappLink } from "@/lib/storefront";

interface StorefrontLayoutProps {
  slug: string;
  store: any;
  settings?: any;
  categories?: any[];
  customer?: any;
  cartCount?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  children: React.ReactNode;
}

export function StorefrontLayout({
  slug,
  store,
  settings,
  categories = [],
  customer,
  cartCount = 0,
  search = "",
  onSearchChange,
  children,
}: StorefrontLayoutProps) {
  const social = settings?.social_links || {};
  const policies = settings?.policies || {};
  const institutional = settings?.institutional_texts || {};
  const visual = settings?.visual_settings || {};
  const footer = settings?.footer_settings || {};
  const trustBadges = Array.isArray(settings?.trust_badges) ? settings.trust_badges : [];
  const whatsapp = whatsappLink(social.whatsapp);
  const primaryColor = store?.theme_colors?.primary || "#0284c7";

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-4 text-slate-200">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" style={{ color: primaryColor }} />{visual.topBarMessage || "Operacao segura e checkout protegido"}</span>
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-sky-400" />Entrega para todo o Brasil</span>
            <span className="inline-flex items-center gap-2"><Headset className="h-4 w-4 text-sky-400" />{visual.supportLabel || "Atendimento comercial especializado"}</span>
          </div>
          <div className="flex items-center gap-3">
            {social.phone && <span>{social.phone}</span>}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-medium text-emerald-300 hover:text-emerald-200">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store?.name || "Loja"} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
                  {(store?.name || "L")[0]}
                </div>
              )}
              <div>
                <Link to={`/shop/${slug}`} className="font-heading text-2xl font-bold text-slate-950">{store?.name || "Loja"}</Link>
                <p className="mt-1 text-sm text-slate-500">{institutional.tagline || "Catalogo profissional com atendimento comercial e compra segura."}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 lg:max-w-3xl">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => onSearchChange?.(event.target.value)}
                    placeholder="Busque por produto, categoria ou codigo"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Link to={customer ? `/shop/${slug}/account` : `/shop/${slug}/auth`}><Button variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white px-5 text-slate-950 hover:bg-slate-100">{customer ? "Minha conta" : "Entrar"}</Button></Link>
                  <Link to={`/shop/${slug}/cart`}><Button className="h-12 rounded-2xl px-5 text-white" style={{ backgroundColor: primaryColor }}><ShoppingCart className="mr-2 h-4 w-4" />Carrinho ({cartCount})</Button></Link>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{visual.categoryNavLabel || "Departamentos"}</span>
                {categories.slice(0, 8).map((category) => (
                  <Link key={category.id} to={`/shop/${slug}/category/${category.id}`}>
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">{category.name}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-600" />Distribuicao e operacao com cobertura nacional</span>
            {policies.shipping && <span>{policies.shipping}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {policies.exchange && <span>{policies.exchange}</span>}
            {policies.payment && <span>{policies.payment}</span>}
          </div>
        </div>
      </header>

      {children}

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-bold text-slate-950">{footer.aboutTitle || store?.name || "Loja"}</h3>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              {footer.aboutText || institutional.about || "Operacao estruturada para vender com agilidade, atendimento comercial e condicoes claras para empresas e consumidores finais."}
            </p>
            <div className="flex flex-wrap gap-3">
              {(trustBadges.length ? trustBadges : [
                { title: "Compra segura" },
                { title: "Atendimento comercial" },
                { title: "Envio nacional" },
              ]).slice(0, 3).map((item: any, index: number) => (
                <Badge key={`${item.title}-${index}`} className="rounded-full px-4 py-2 text-white" style={{ backgroundColor: index === 0 ? "#0f172a" : index === 1 ? primaryColor : "#059669" }}>
                  {item.title}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-950">Departamentos</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {categories.slice(0, 6).map((category) => (
                <Link key={category.id} to={`/shop/${slug}/category/${category.id}`} className="block hover:text-slate-950">{category.name}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-950">Institucional</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>{policies.payment || "Politica de pagamento conforme configuracao da loja."}</p>
              <p>{policies.shipping || "Fretes e prazos calculados no checkout."}</p>
              <p>{policies.exchange || "Politica de troca conforme operacao vigente."}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-950">{footer.supportTitle || "Atendimento"}</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {footer.supportBody && <p>{footer.supportBody}</p>}
              {social.email && <p>{social.email}</p>}
              {social.phone && <p>{social.phone}</p>}
              {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"><MessageCircle className="h-4 w-4" />Falar no WhatsApp</a>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
