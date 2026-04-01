import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carla Mendes",
    role: "CEO, Bella Cosmeticos",
    text: "Em 10 dias minha loja estava no ar vendendo. A integracao com pagamentos e frete funcionou perfeitamente desde o primeiro dia.",
    rating: 5,
  },
  {
    name: "Rafael Torres",
    role: "Fundador, FitPower Suplementos",
    text: "A personalizacao para o nicho de suplementos fez toda diferenca. Meus clientes elogiam a experiencia de compra.",
    rating: 5,
  },
  {
    name: "Ana Paula Silva",
    role: "Diretora, Pets & Love",
    text: "Tentei criar minha loja do zero e gastei 4 meses sem resultado. Com a VEXOR Sistemas, recebi tudo pronto e profissional.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-primary">Depoimentos</span>
          <h2 className="mt-3 mb-4 font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            Quem usa, <span className="text-gradient-primary">recomenda</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
              <div>
                <div className="font-heading text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
