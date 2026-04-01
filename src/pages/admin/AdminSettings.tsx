import { Card, CardContent } from "@/components/ui/card";
import { Settings, Wrench } from "lucide-react";

const AdminSettings = () => (
  <div className="space-y-6">
    <div className="page-header">
      <h1>Configurações</h1>
      <p>Configurações gerais da plataforma.</p>
    </div>

    <Card className="border-border/50 glass-card">
      <CardContent className="p-0">
        <div className="empty-state py-16">
          <div className="rounded-2xl bg-primary/10 p-4 mb-4">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <p className="empty-state-title">Configurações avançadas</p>
          <p className="empty-state-description">
            Módulo de configurações avançadas da plataforma em desenvolvimento. Em breve você poderá configurar limites globais, notificações e regras de negócio.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default AdminSettings;
