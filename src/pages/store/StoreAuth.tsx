import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { useStoreCart } from "@/hooks/useStoreCart";
import { api } from "@/lib/api";
import { buildStorePath, resolveStoreSlug } from "@/lib/runtime-host";

const StoreAuth = () => {
  const params = useParams();
  const slug = resolveStoreSlug(params.slug);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = useMemo(() => searchParams.get("mode") || "login", [searchParams]);
  const token = searchParams.get("token") || "";
  const { login, register } = useStoreCustomer(slug);
  const { sessionToken } = useStoreCart(slug);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    document: "",
    resetPassword: "",
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!slug) return;
    setLoading(true);

    try {
      if (mode === "register") {
        await register({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          document: form.document,
        });
        toast({ title: "Conta criada", description: "Sua conta foi criada com sucesso." });
        navigate(buildStorePath(slug, "/conta"));
      } else if (mode === "reset") {
        await api.post(`/api/public/stores/${slug}/auth/reset-password`, {
          token,
          password: form.resetPassword,
        });
        toast({ title: "Senha atualizada", description: "Sua nova senha ja pode ser usada." });
        setSearchParams({ mode: "login" });
      } else {
        await login({ email: form.email, password: form.password, sessionToken });
        toast({ title: "Login realizado", description: "Bem-vindo de volta." });
        navigate(buildStorePath(slug, "/conta"));
      }
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!slug || !form.email) return;
    setLoading(true);
    try {
      const response = await api.post<any>(`/api/public/stores/${slug}/auth/forgot-password`, { email: form.email });
      toast({
        title: "Recuperacao iniciada",
        description: response.resetToken ? `Token gerado: ${response.resetToken}` : response.message,
      });
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
      <div className="grid w-full gap-8 md:grid-cols-[1.1fr_420px]">
        <div className="space-y-5">
          <Link to={buildStorePath(slug)} className="text-sm text-muted-foreground">Voltar para a loja</Link>
          <h1 className="font-heading text-4xl font-bold text-foreground">
            {mode === "register" ? "Criar conta" : mode === "reset" ? "Redefinir senha" : "Entrar na sua conta"}
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Acesse seus pedidos, enderecos salvos e acompanhe o pagamento e a entrega em tempo real.
          </p>
        </div>

        <Card className="border-border/50">
          <CardContent className="space-y-4 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2"><Label>Nome completo</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Documento</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
                </>
              )}

              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required={mode !== "reset"} /></div>

              {mode === "reset" ? (
                <div className="space-y-2"><Label>Nova senha</Label><Input type="password" value={form.resetPassword} onChange={(e) => setForm({ ...form, resetPassword: e.target.value })} required /></div>
              ) : (
                <div className="space-y-2"><Label>Senha</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {mode === "register" ? "Criar conta" : mode === "reset" ? "Salvar nova senha" : "Entrar"}
              </Button>
            </form>

            {mode === "login" && (
              <Button type="button" variant="ghost" onClick={handleForgotPassword} disabled={loading || !form.email} className="w-full">
                Esqueci minha senha
              </Button>
            )}

            <div className="text-center text-sm text-muted-foreground">
              {mode === "register" ? (
                <button type="button" onClick={() => setSearchParams({ mode: "login" })}>Ja tenho conta</button>
              ) : mode === "reset" ? (
                <button type="button" onClick={() => setSearchParams({ mode: "login" })}>Voltar ao login</button>
              ) : (
                <button type="button" onClick={() => setSearchParams({ mode: "register" })}>Criar conta</button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoreAuth;
