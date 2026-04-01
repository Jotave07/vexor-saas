export function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export function productDisplayPrice(product: any) {
  return Number(product?.sale_price ?? product?.price ?? 0);
}

export function productImage(product: any) {
  return Array.isArray(product?.images) && product.images[0] ? product.images[0] : null;
}

export function whatsappLink(raw: string | undefined) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

