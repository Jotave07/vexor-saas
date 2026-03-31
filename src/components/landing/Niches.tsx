import { motion } from "framer-motion";
import {
  Shirt,
  Sparkles,
  Dumbbell,
  Smartphone,
  UtensilsCrossed,
  Dog,
  Gem,
  BookOpen,
  Briefcase,
} from "lucide-react";

const niches = [
  { icon: Shirt, label: "Moda", color: "from-pink-500 to-rose-500" },
  { icon: Sparkles, label: "Cosméticos", color: "from-purple-500 to-fuchsia-500" },
  { icon: Dumbbell, label: "Suplementos", color: "from-orange-500 to-amber-500" },
  { icon: Smartphone, label: "Eletrônicos", color: "from-blue-500 to-cyan-500" },
  { icon: UtensilsCrossed, label: "Alimentos", color: "from-green-500 to-emerald-500" },
  { icon: Dog, label: "Pet Shop", color: "from-yellow-500 to-orange-400" },
  { icon: Gem, label: "Joias", color: "from-violet-500 to-purple-500" },
  { icon: BookOpen, label: "Infoprodutos", color: "from-teal-500 to-cyan-500" },
  { icon: Briefcase, label: "Serviços", color: "from-slate-500 to-zinc-400" },
];

const Niches = () => {
  return (
    <section id="nichos" className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Nichos Atendidos</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Lojas adaptadas para <span className="text-gradient-primary">cada segmento</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada loja é personalizada com identidade visual, comunicação e layout específicos para o seu mercado.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-4">
          {niches.map((n, i) => (
            <motion.div
              key={n.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.08, y: -4 }}
              className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer group hover:border-primary/30 transition-all"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${n.color} shadow-lg`}>
                <n.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
                {n.label}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 glass-card rounded-2xl p-8 md:p-12 text-center"
        >
          <h3 className="font-heading text-2xl font-bold mb-3">Não encontrou seu nicho?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Trabalhamos com qualquer segmento. Entre em contato e criamos a loja ideal para o seu negócio.
          </p>
          <button className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Falar com Especialista
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Niches;
