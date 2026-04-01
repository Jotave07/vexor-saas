import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useStoreCustomer(slug: string | undefined) {
  const [customer, setCustomer] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!slug) return;
    const response = await api.get<{ customer: any; addresses: any[] }>(`/api/public/stores/${slug}/auth/me`);
    setCustomer(response.customer || null);
    setAddresses(response.addresses || []);
  };

  useEffect(() => {
    if (!slug) return;
    refresh().finally(() => setLoading(false));
  }, [slug]);

  const login = async (payload: { email: string; password: string; sessionToken?: string }) => {
    const response = await api.post<{ customer: any }>(`/api/public/stores/${slug}/auth/login`, payload);
    setCustomer(response.customer);
    await refresh();
    return response;
  };

  const register = async (payload: { fullName: string; email: string; password: string; phone?: string; document?: string }) => {
    const response = await api.post<{ customer: any }>(`/api/public/stores/${slug}/auth/register`, payload);
    setCustomer(response.customer);
    await refresh();
    return response;
  };

  const logout = async () => {
    await api.post(`/api/public/stores/${slug}/auth/logout`);
    setCustomer(null);
    setAddresses([]);
  };

  return {
    customer,
    addresses,
    loading,
    refresh,
    login,
    register,
    logout,
  };
}
