import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
      <ShieldX className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-heading font-bold text-foreground">Acesso Negado</h1>
      <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      <Button onClick={() => navigate("/login")} variant="outline">Voltar ao Login</Button>
    </div>
  );
};

export default Unauthorized;
