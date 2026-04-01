import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 p-4">
    <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
    <div className="relative z-10 text-center space-y-4">
      <p className="text-8xl font-heading font-bold text-gradient-primary">404</p>
      <h1 className="text-2xl font-heading font-bold text-foreground">Página não encontrada</h1>
      <p className="text-muted-foreground max-w-sm mx-auto">
        A página que você procura não existe ou foi movida.
      </p>
      <Link to="/">
        <Button variant="outline" className="mt-4 gap-2">
          <Home className="h-4 w-4" />
          Voltar ao início
        </Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
