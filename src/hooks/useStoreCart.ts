import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

interface CartLineItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  name?: string;
  price?: number;
  sale_price?: number | null;
  stock?: number;
  description?: string | null;
}

function buildSessionKey(slug: string | undefined) {
  return `vexor-storefront-session:${slug || "default"}`;
}

function getOrCreateSessionToken(slug: string | undefined) {
  const storageKey = buildSessionKey(slug);
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
}

export function useStoreCart(slug: string | undefined) {
  const [sessionToken, setSessionToken] = useState("");
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const cartItems = useMemo(() => items.map((item) => ({
    productId: item.product_id,
    quantity: item.quantity,
  })), [items]);

  const refresh = async (customToken?: string) => {
    if (!slug) return;
    const token = customToken || sessionToken || getOrCreateSessionToken(slug);
    const response = await api.get<{ items: CartLineItem[]; subtotal: number }>(`/api/public/stores/${slug}/cart?sessionToken=${token}`);
    setItems(response.items || []);
    setSubtotal(Number(response.subtotal || 0));
  };

  useEffect(() => {
    if (!slug) return;
    const token = getOrCreateSessionToken(slug);
    setSessionToken(token);
    refresh(token).finally(() => setLoading(false));
  }, [slug]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!slug) return;
    const token = sessionToken || getOrCreateSessionToken(slug);
    const response = await api.put<{ items: CartLineItem[]; subtotal: number }>(`/api/public/stores/${slug}/cart/items`, {
      sessionToken: token,
      productId,
      quantity,
    });
    setItems(response.items || []);
    setSubtotal(Number(response.subtotal || 0));
  };

  const addItem = async (productId: string, quantity = 1) => {
    if (!slug) return;
    const token = sessionToken || getOrCreateSessionToken(slug);
    const sourceItems = loading
      ? (await api.get<{ items: CartLineItem[]; subtotal: number }>(`/api/public/stores/${slug}/cart?sessionToken=${token}`)).items || []
      : items;
    const current = sourceItems.find((item) => item.product_id === productId);
    await updateQuantity(productId, (current?.quantity || 0) + quantity);
  };

  const removeItem = async (productId: string) => {
    await updateQuantity(productId, 0);
  };

  const clearCart = async () => {
    if (!slug) return;
    const token = sessionToken || getOrCreateSessionToken(slug);
    await api.delete(`/api/public/stores/${slug}/cart?sessionToken=${token}`);
    setItems([]);
    setSubtotal(0);
  };

  return {
    sessionToken,
    items: cartItems,
    lineItems: items,
    subtotal,
    loading,
    refresh,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
