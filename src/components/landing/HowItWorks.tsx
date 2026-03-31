import { motion } from "framer-motion";
import { MessageSquare, Palette, Rocket } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Escolha seu nicho",
    description: "Selecione o segmento do seu negócio e conte-nos sobre sua marca. Personalizamos tudo para o seu mercado.",
  },
  {
    icon: Palette,
    step: "02",
    title: "Personalizamos sua loja",
    description: "Nossa equipe configura sua loja com identidade visual, produtos, categorias e integrações de pagamento e frete.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Comece a vender",
    description: "Receba sua loja pronta para operar. Com checkout otimizado, gestão de pedidos e painel administrativo completo.",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="section-padding relative">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Como Funciona</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Sua loja pronta em <span className="text-gradient-primary">3 passos simples</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sem complicação. Sem código. Sem demora. Entregamos sua loja profissional pronta para vender.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative glass-card rounded-2xl p-8 text-center group hover:border-primary/30 transition-colors"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-heading text-6xl font-bold text-primary/10">
                {step.step}
              </div>
              <div className="relative mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <step.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
