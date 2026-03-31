import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "Tempo para lançar", diy: "3 a 6 meses", us: "7 a 15 dias" },
  { feature: "Investimento inicial", diy: "R$15.000+", us: "A partir de R$997" },
  { feature: "Integrações de pagamento", diy: false, us: true },
  { feature: "Cálculo de frete automático", diy: false, us: true },
  { feature: "Painel administrativo", diy: false, us: true },
  { feature: "Personalização por nicho", diy: false, us: true },
  { feature: "Suporte técnico incluso", diy: false, us: true },
  { feature: "Pronto para vender", diy: false, us: true },
];

const Comparison = () => {
  return (
    <section className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Comparativo</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Por que escolher a <span className="text-gradient-primary">NexShop?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compare criar do zero versus receber sua loja profissional pronta.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="grid grid-cols-3 text-center border-b border-border/50">
            <div className="p-4 md:p-6 text-sm font-medium text-muted-foreground">Funcionalidade</div>
            <div className="p-4 md:p-6 text-sm font-medium text-muted-foreground border-x border-border/50">
              Criar do Zero
            </div>
            <div className="p-4 md:p-6 bg-primary/5">
              <span className="text-sm font-bold text-gradient-primary">NexShop</span>
            </div>
          </div>

          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-3 text-center border-b border-border/30 last:border-0"
            >
              <div className="p-4 md:p-5 text-sm text-foreground text-left pl-6">
                {row.feature}
              </div>
              <div className="p-4 md:p-5 flex items-center justify-center border-x border-border/30">
                {typeof row.diy === "string" ? (
                  <span className="text-sm text-muted-foreground">{row.diy}</span>
                ) : row.diy ? (
                  <Check className="h-5 w-5 text-accent" />
                ) : (
                  <X className="h-5 w-5 text-destructive/60" />
                )}
              </div>
              <div className="p-4 md:p-5 flex items-center justify-center bg-primary/5">
                {typeof row.us === "string" ? (
                  <span className="text-sm font-semibold text-accent">{row.us}</span>
                ) : row.us ? (
                  <Check className="h-5 w-5 text-accent" />
                ) : (
                  <X className="h-5 w-5 text-destructive/60" />
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;
