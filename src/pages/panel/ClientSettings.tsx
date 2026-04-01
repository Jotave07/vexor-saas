import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const stringify = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

const ClientSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingPayment, setTestingPayment] = useState(false);
  const [testingShipping, setTestingShipping] = useState(false);
  const [form, setForm] = useState({
    storeName: "",
    slug: "",
    domain: "",
    logoUrl: "",
    faviconUrl: "",
    themeColors: "{\n  \"primary\": \"#111111\",\n  \"secondary\": \"#ffffff\"\n}",
    seo: "{}",
    policies: "{}",
    social: "{}",
    institutional: "{}",
    visual: "{}",
    home: "{}",
    campaigns: "{}",
    footer: "{}",
    trustBadges: "[]",
    featuredBrands: "[]",
    checkout: "{}",
    shipping: "{}",
    paymentMethods: "[]",
    mercadoPagoEnabled: false,
    mercadoPagoMode: "production",
    mercadoPagoPublicKey: "",
    mercadoPagoAccessToken: "",
    mercadoPagoWebhookToken: "",
    melhorEnvioEnabled: false,
    melhorEnvioMode: "sandbox",
    melhorEnvioAccessToken: "",
    melhorEnvioClientId: "",
    melhorEnvioClientSecret: "",
    melhorEnvioWebhookToken: "",
    testCep: "01001000",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const response = await api.get<any>("/api/client/settings");
      if (response.store) {
        setForm({
          storeName: response.store.name || "",
          slug: response.store.slug || "",
          domain: response.store.domain || "",
          logoUrl: response.store.logo_url || "",
          faviconUrl: response.store.favicon_url || "",
          themeColors: stringify(response.store.theme_colors),
          seo: stringify(response.settings?.seo_settings),
          policies: stringify(response.settings?.policies),
          social: stringify(response.settings?.social_links),
          institutional: stringify(response.settings?.institutional_texts),
          visual: stringify(response.settings?.visual_settings),
          home: stringify(response.settings?.home_settings),
          campaigns: stringify(response.settings?.campaign_settings),
          footer: stringify(response.settings?.footer_settings),
          trustBadges: stringify(response.settings?.trust_badges || []),
          featuredBrands: stringify(response.settings?.featured_brands || []),
          checkout: stringify(response.settings?.checkout_settings),
          shipping: stringify(response.settings?.shipping_settings),
          paymentMethods: stringify(response.settings?.payment_methods || []),
          mercadoPagoEnabled: Boolean(response.integrations?.mercado_pago?.enabled),
          mercadoPagoMode: response.integrations?.mercado_pago?.mode || "production",
          mercadoPagoPublicKey: response.integrations?.mercado_pago?.publicKey || "",
          mercadoPagoAccessToken: response.integrations?.mercado_pago?.accessToken || "",
          mercadoPagoWebhookToken: response.integrations?.mercado_pago?.webhookToken || "",
          melhorEnvioEnabled: Boolean(response.integrations?.melhor_envio?.enabled),
          melhorEnvioMode: response.integrations?.melhor_envio?.mode || "sandbox",
          melhorEnvioAccessToken: response.integrations?.melhor_envio?.accessToken || "",
          melhorEnvioClientId: response.integrations?.melhor_envio?.clientId || "",
          melhorEnvioClientSecret: response.integrations?.melhor_envio?.clientSecret || "",
          melhorEnvioWebhookToken: response.integrations?.melhor_envio?.webhookToken || "",
          testCep: "01001000",
        });
      }
      setLoading(false);
    };

    fetchSettings().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/client/settings", {
        store: {
          name: form.storeName,
          slug: form.slug,
          domain: form.domain,
          logo_url: form.logoUrl,
          favicon_url: form.faviconUrl,
          theme_colors: JSON.parse(form.themeColors),
        },
        settings: {
          seo_settings: JSON.parse(form.seo),
          policies: JSON.parse(form.policies),
          social_links: JSON.parse(form.social),
          institutional_texts: JSON.parse(form.institutional),
          visual_settings: JSON.parse(form.visual),
          home_settings: JSON.parse(form.home),
          campaign_settings: JSON.parse(form.campaigns),
          footer_settings: JSON.parse(form.footer),
          trust_badges: JSON.parse(form.trustBadges),
          featured_brands: JSON.parse(form.featuredBrands),
          checkout_settings: JSON.parse(form.checkout),
          shipping_settings: JSON.parse(form.shipping),
          payment_methods: JSON.parse(form.paymentMethods),
        },
        integrations: {
          mercado_pago: {
            enabled: form.mercadoPagoEnabled,
            mode: form.mercadoPagoMode,
            publicKey: form.mercadoPagoPublicKey,
            accessToken: form.mercadoPagoAccessToken,
            webhookToken: form.mercadoPagoWebhookToken,
          },
          melhor_envio: {
            enabled: form.melhorEnvioEnabled,
            mode: form.melhorEnvioMode,
            accessToken: form.melhorEnvioAccessToken,
            clientId: form.melhorEnvioClientId,
            clientSecret: form.melhorEnvioClientSecret,
            webhookToken: form.melhorEnvioWebhookToken,
          },
        },
      });
      toast({ title: "Configuracoes salvas!" });
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const testPayment = async () => {
    setTestingPayment(true);
    try {
      const response = await api.post<any>("/api/client/settings/test-payment");
      toast({ title: "Mercado Pago validado", description: response.account?.email || "Credenciais validas." });
    } catch (error) {
      toast({ title: "Falha no teste", description: (error as Error).message, variant: "destructive" });
    } finally {
      setTestingPayment(false);
    }
  };

  const testShipping = async () => {
    setTestingShipping(true);
    try {
      const response = await api.post<any>("/api/client/settings/test-shipping", { cep: form.testCep });
      toast({ title: "CEP validado", description: `${response.address.city}/${response.address.state}` });
    } catch (error) {
      toast({ title: "Falha no teste", description: (error as Error).message, variant: "destructive" });
    } finally {
      setTestingShipping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Configuracoes</h1>
        <p className="text-muted-foreground">Personalize sua loja com dados persistidos no banco.</p>
      </div>

      <Card className="border-border/50 glass-card">
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div className="space-y-2"><Label>Nome da Loja</Label><Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="space-y-2"><Label>Dominio</Label><Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} /></div>
          <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Favicon URL</Label><Input value={form.faviconUrl} onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Cores do tema (JSON)</Label><Textarea rows={5} value={form.themeColors} onChange={(e) => setForm({ ...form, themeColors: e.target.value })} /></div>
          <div className="space-y-2"><Label>SEO (JSON)</Label><Textarea rows={6} value={form.seo} onChange={(e) => setForm({ ...form, seo: e.target.value })} /></div>
          <div className="space-y-2"><Label>Politicas (JSON)</Label><Textarea rows={6} value={form.policies} onChange={(e) => setForm({ ...form, policies: e.target.value })} /></div>
          <div className="space-y-2"><Label>Redes sociais (JSON)</Label><Textarea rows={6} value={form.social} onChange={(e) => setForm({ ...form, social: e.target.value })} /></div>
          <div className="space-y-2"><Label>Textos institucionais (JSON)</Label><Textarea rows={6} value={form.institutional} onChange={(e) => setForm({ ...form, institutional: e.target.value })} /></div>
          <div className="space-y-2"><Label>Identidade visual (JSON)</Label><Textarea rows={6} value={form.visual} onChange={(e) => setForm({ ...form, visual: e.target.value })} /></div>
          <div className="space-y-2"><Label>Home da loja (JSON)</Label><Textarea rows={6} value={form.home} onChange={(e) => setForm({ ...form, home: e.target.value })} /></div>
          <div className="space-y-2"><Label>Campanhas (JSON)</Label><Textarea rows={6} value={form.campaigns} onChange={(e) => setForm({ ...form, campaigns: e.target.value })} /></div>
          <div className="space-y-2"><Label>Rodape e conteudo (JSON)</Label><Textarea rows={6} value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} /></div>
          <div className="space-y-2"><Label>Selos de confianca (JSON)</Label><Textarea rows={6} value={form.trustBadges} onChange={(e) => setForm({ ...form, trustBadges: e.target.value })} /></div>
          <div className="space-y-2"><Label>Marcas em destaque (JSON)</Label><Textarea rows={6} value={form.featuredBrands} onChange={(e) => setForm({ ...form, featuredBrands: e.target.value })} /></div>
          <div className="space-y-2"><Label>Checkout (JSON)</Label><Textarea rows={6} value={form.checkout} onChange={(e) => setForm({ ...form, checkout: e.target.value })} /></div>
          <div className="space-y-2"><Label>Frete (JSON)</Label><Textarea rows={6} value={form.shipping} onChange={(e) => setForm({ ...form, shipping: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Metodos de pagamento (JSON)</Label><Textarea rows={5} value={form.paymentMethods} onChange={(e) => setForm({ ...form, paymentMethods: e.target.value })} /></div>
          <div className="space-y-2"><Label>Mercado Pago ativo</Label><Input value={form.mercadoPagoEnabled ? "true" : "false"} onChange={(e) => setForm({ ...form, mercadoPagoEnabled: e.target.value === "true" })} /></div>
          <div className="space-y-2"><Label>Mercado Pago modo</Label><Input value={form.mercadoPagoMode} onChange={(e) => setForm({ ...form, mercadoPagoMode: e.target.value })} /></div>
          <div className="space-y-2"><Label>Mercado Pago public key</Label><Input value={form.mercadoPagoPublicKey} onChange={(e) => setForm({ ...form, mercadoPagoPublicKey: e.target.value })} /></div>
          <div className="space-y-2"><Label>Mercado Pago access token</Label><Input value={form.mercadoPagoAccessToken} onChange={(e) => setForm({ ...form, mercadoPagoAccessToken: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Webhook token Mercado Pago</Label><Input value={form.mercadoPagoWebhookToken} onChange={(e) => setForm({ ...form, mercadoPagoWebhookToken: e.target.value })} /></div>
          <div className="space-y-2"><Label>Melhor Envio ativo</Label><Input value={form.melhorEnvioEnabled ? "true" : "false"} onChange={(e) => setForm({ ...form, melhorEnvioEnabled: e.target.value === "true" })} /></div>
          <div className="space-y-2"><Label>Melhor Envio modo</Label><Input value={form.melhorEnvioMode} onChange={(e) => setForm({ ...form, melhorEnvioMode: e.target.value })} /></div>
          <div className="space-y-2"><Label>Melhor Envio access token</Label><Input value={form.melhorEnvioAccessToken} onChange={(e) => setForm({ ...form, melhorEnvioAccessToken: e.target.value })} /></div>
          <div className="space-y-2"><Label>Melhor Envio client id</Label><Input value={form.melhorEnvioClientId} onChange={(e) => setForm({ ...form, melhorEnvioClientId: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Melhor Envio client secret</Label><Input value={form.melhorEnvioClientSecret} onChange={(e) => setForm({ ...form, melhorEnvioClientSecret: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Webhook token Melhor Envio</Label><Input value={form.melhorEnvioWebhookToken} onChange={(e) => setForm({ ...form, melhorEnvioWebhookToken: e.target.value })} /></div>
          <div className="space-y-2"><Label>CEP de teste</Label><Input value={form.testCep} onChange={(e) => setForm({ ...form, testCep: e.target.value })} /></div>
          <div className="flex items-end gap-3 md:col-span-2">
            <Button type="button" variant="outline" onClick={testPayment} disabled={testingPayment}>Testar Mercado Pago</Button>
            <Button type="button" variant="outline" onClick={testShipping} disabled={testingShipping}>Testar CEP/Frete</Button>
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar configuracoes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSettings;
