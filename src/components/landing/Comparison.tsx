import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "Tempo para lancar", diy: "3 a 6 meses", us: "7 a 15 dias" },
  { feature: "Investimento inicial", diy: "R$15.000+", us: "A partir de R$997" },
  { feature: "Integracoes de pagamento", diy: false, us: true },
  { feature: "Calculo de frete automatico", diy: false, us: true },
  { feature: "Painel administrativo", diy: false, us: true },
  { feature: "Personalizacao por nicho", diy: false, us: true },
  { feature: "Suporte tecnico incluso", diy: false, us: true },
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
          className="mb-16 text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-primary">Comparativo</span>
          <h2 className="mt-3 mb-4 font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            Por que escolher a <span className="text-gradient-primary">VEXOR Sistemas?</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Compare criar do zero versus receber sua loja profissional pronta.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card overflow-hidden rounded-2xl"
        >
          <div className="grid grid-cols-3 border-b border-border/50 text-center">
            <div className="p-4 text-sm font-medium text-muted-foreground md:p-6">Funcionalidade</div>
            <div className="border-x border-border/50 p-4 text-sm font-medium text-muted-foreground md:p-6">
              Criar do Zero
            </div>
            <div className="bg-primary/5 p-4 md:p-6">
              <span className="text-sm font-bold text-gradient-primary">VEXOR Sistemas</span>
            </div>
          </div>

          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-border/30 text-center last:border-0">
              <div className="p-4 pl-6 text-left text-sm text-foreground md:p-5">{row.feature}</div>
              <div className="flex items-center justify-center border-x border-border/30 p-4 md:p-5">
                {typeof row.diy === "string" ? (
                  <span className="text-sm text-muted-foreground">{row.diy}</span>
                ) : row.diy ? (
                  <Check className="h-5 w-5 text-accent" />
                ) : (
                  <X className="h-5 w-5 text-destructive/60" />
                )}
              </div>
              <div className="flex items-center justify-center bg-primary/5 p-4 md:p-5">
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
