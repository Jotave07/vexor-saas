import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productDisplayPrice, productImage, formatCurrency } from "@/lib/storefront";

interface StoreProductCardProps {
  slug: string;
  product: any;
  categoryName?: string;
  onAddToCart?: (productId: string, productName: string) => void | Promise<void>;
}

export function StoreProductCard({ slug, product, categoryName, onAddToCart }: StoreProductCardProps) {
  const currentPrice = productDisplayPrice(product);
  const image = productImage(product);
  const discount = product.sale_price ? Math.max(0, Math.round((1 - currentPrice / Number(product.price)) * 100)) : 0;

  return (
    <div className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="relative p-4">
        {discount > 0 && <Badge className="absolute left-6 top-6 z-10 rounded-full bg-rose-600 px-3 py-1 text-white">-{discount}%</Badge>}
        <Link to={`/shop/${slug}/product/${product.id}`} className="block overflow-hidden rounded-[22px] bg-slate-100">
          {image ? (
            <img src={image} alt={product.name} className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105" />
          ) : (
            <div className="aspect-square w-full bg-gradient-to-br from-slate-200 to-slate-100" />
          )}
        </Link>
      </div>
      <div className="space-y-4 px-5 pb-5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{categoryName || "Departamento"}</p>
          <Link to={`/shop/${slug}/product/${product.id}`} className="line-clamp-2 min-h-[3.5rem] font-heading text-lg font-semibold text-slate-950 hover:text-sky-700">
            {product.name}
          </Link>
          <p className="line-clamp-2 text-sm leading-6 text-slate-500">{product.description || "Produto com pronta expedicao e atendimento especializado."}</p>
        </div>

        <div className="space-y-1">
          {product.sale_price && <p className="text-sm text-slate-400 line-through">{formatCurrency(product.price)}</p>}
          <p className="text-2xl font-bold text-slate-950">{formatCurrency(currentPrice)}</p>
          <p className="text-xs text-emerald-600">PIX e condicoes comerciais conforme a loja</p>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 rounded-2xl bg-sky-600 text-white hover:bg-sky-700" onClick={() => onAddToCart?.(product.id, product.name)}>Comprar</Button>
          <Link to={`/shop/${slug}/product/${product.id}`} className="flex-1"><Button variant="outline" className="w-full rounded-2xl border-slate-200 bg-white text-slate-950 hover:bg-slate-100">Detalhes</Button></Link>
        </div>
      </div>
    </div>
  );
}
