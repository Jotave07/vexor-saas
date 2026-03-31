import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "997",
    description: "Ideal para quem está começando a vender online.",
    features: [
      "Loja virtual completa",
      "Até 100 produtos",
      "Checkout otimizado",
      "Pagamentos integrados",
      "Cálculo de frete",
      "Painel administrativo",
      "Suporte por e-mail",
    ],
    popular: false,
  },
  {
    name: "Profissional",
    price: "1.997",
    description: "Para negócios que querem crescer com estrutura completa.",
    features: [
      "Tudo do Starter",
      "Produtos ilimitados",
      "CRM integrado",
      "Cupons e promoções",
      "Gestão de estoque avançada",
      "Personalização por nicho",
      "Integrações de marketing",
      "Suporte prioritário",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    description: "Solução sob medida para grandes operações.",
    features: [
      "Tudo do Profissional",
      "Multi-lojas",
      "API personalizada",
      "Integração com ERP",
      "Gerente de conta dedicado",
      "SLA garantido",
      "Onboarding VIP",
      "Customizações exclusivas",
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="planos" className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Planos</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Escolha o plano ideal para <span className="text-gradient-primary">seu negócio</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Investimento único. Sem mensalidades surpresa. Sua loja pronta para faturar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-gradient-card border-2 border-primary/40 shadow-glow"
                  : "glass-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  Mais Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                {plan.price !== "Sob consulta" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="font-heading text-4xl font-bold">{plan.price}</span>
                  </div>
                ) : (
                  <span className="font-heading text-2xl font-bold">{plan.price}</span>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
