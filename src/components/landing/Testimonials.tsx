import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carla Mendes",
    role: "CEO, Bella Cosméticos",
    text: "Em 10 dias minha loja estava no ar vendendo. A integração com pagamentos e frete funcionou perfeitamente desde o primeiro dia.",
    rating: 5,
  },
  {
    name: "Rafael Torres",
    role: "Fundador, FitPower Suplementos",
    text: "A personalização para o nicho de suplementos fez toda diferença. Meus clientes elogiam a experiência de compra.",
    rating: 5,
  },
  {
    name: "Ana Paula Silva",
    role: "Diretora, Pets & Love",
    text: "Tentei criar minha loja do zero e gastei 4 meses sem resultado. Com a NexShop, recebi tudo pronto e profissional.",
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
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Depoimentos</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Quem usa, <span className="text-gradient-primary">recomenda</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
              <div>
                <div className="font-heading font-semibold text-sm">{t.name}</div>
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
