import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
      <div className="relative z-10 text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Você não tem permissão para acessar esta página. Entre com uma conta autorizada.
        </p>
        <Button onClick={() => navigate("/login")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Login
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
