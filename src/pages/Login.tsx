import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      return;
    }

    navigate("/dashboard");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    const { error, resetUrl } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Recuperação iniciada",
      description: resetUrl ? `Use este link: ${resetUrl}` : "Token de recuperação gerado com sucesso.",
    });
    setIsForgot(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />

      <div className="absolute top-6 left-6 z-10">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </Link>
      </div>

      <Card className="relative z-10 w-full max-w-md border-border/50 glass-card shadow-elevated">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <ShoppingBag className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-heading">{isForgot ? "Recuperar Senha" : "Acessar Plataforma"}</CardTitle>
            <CardDescription>
              {isForgot ? "Informe seu email para gerar um link de recuperação." : "Entre com suas credenciais para acessar o painel."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={isForgot ? handleForgot : handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
            </div>

            {!isForgot && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isForgot ? "Enviar link" : "Entrar"}
            </Button>

            <button
              type="button"
              onClick={() => setIsForgot(!isForgot)}
              className="w-full text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {isForgot ? "← Voltar ao login" : "Esqueceu a senha?"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
