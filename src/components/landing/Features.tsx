import { motion } from "framer-motion";
import {
  ShoppingCart,
  CreditCard,
  Truck,
  BarChart3,
  Users,
  Tag,
  Package,
  Shield,
  Zap,
  Layers,
  Settings,
  Globe,
} from "lucide-react";

const features = [
  { icon: ShoppingCart, title: "E-commerce Completo", desc: "Catálogo, carrinho, checkout otimizado e área do cliente integrados." },
  { icon: CreditCard, title: "Pagamentos Integrados", desc: "PIX, cartão de crédito, boleto e gateways prontos para receber." },
  { icon: Truck, title: "Frete em Tempo Real", desc: "Cálculo automático com Correios, transportadoras e logística completa." },
  { icon: BarChart3, title: "Painel Administrativo", desc: "Dashboard completo com métricas, vendas, estoque e gestão de pedidos." },
  { icon: Users, title: "CRM Integrado", desc: "Acompanhe leads, clientes e histórico de compras em um só lugar." },
  { icon: Tag, title: "Cupons e Promoções", desc: "Crie descontos, cupons e campanhas promocionais com facilidade." },
  { icon: Package, title: "Gestão de Estoque", desc: "Controle total do inventário com alertas de reposição automáticos." },
  { icon: Shield, title: "Segurança Total", desc: "SSL, proteção contra fraudes e conformidade com LGPD garantidos." },
  { icon: Zap, title: "Performance Máxima", desc: "Infraestrutura otimizada para velocidade e SEO de alto nível." },
  { icon: Layers, title: "Multi-categorias", desc: "Produtos com variações, categorias ilimitadas e filtros avançados." },
  { icon: Settings, title: "Personalização Total", desc: "Adapte cores, layout, banners e comunicação ao seu nicho." },
  { icon: Globe, title: "Preparado para Escalar", desc: "Infraestrutura cloud que cresce junto com seu negócio." },
];

const Features = () => {
  return (
    <section id="recursos" className="section-padding relative">
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      <div className="container-narrow relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Recursos</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Tudo que você precisa para <span className="text-gradient-primary">vender online</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma plataforma completa com todas as ferramentas para gerenciar e escalar seu e-commerce.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-6 group hover:border-primary/30 transition-all hover:shadow-glow/20"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
