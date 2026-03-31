import { motion } from "framer-motion";
import { CreditCard, Truck, BarChart3, MessageCircle, Mail, Database } from "lucide-react";

const integrations = [
  { icon: CreditCard, title: "Gateways de Pagamento", items: ["PIX", "Mercado Pago", "PagSeguro", "Stripe", "PayPal"] },
  { icon: Truck, title: "Frete e Logística", items: ["Correios", "Jadlog", "Melhor Envio", "Frenet", "Kangu"] },
  { icon: BarChart3, title: "Analytics e SEO", items: ["Google Analytics", "Google Tag Manager", "Facebook Pixel", "SEO Avançado"] },
  { icon: MessageCircle, title: "Comunicação", items: ["WhatsApp", "Chatbot", "Notificações Push", "SMS"] },
  { icon: Mail, title: "Marketing", items: ["E-mail marketing", "Automações", "Remarketing", "Cupons"] },
  { icon: Database, title: "Gestão (em breve)", items: ["ERP", "Bling", "Tiny", "Omie", "Nota Fiscal"] },
];

const Integrations = () => {
  return (
    <section id="integracoes" className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Integrações</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Conectado com as <span className="text-gradient-primary">melhores ferramentas</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Integração nativa com as principais soluções de pagamento, frete, marketing e gestão do mercado.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integ, i) => (
            <motion.div
              key={integ.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <integ.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold mb-3">{integ.title}</h3>
              <div className="flex flex-wrap gap-2">
                {integ.items.map((item) => (
                  <span
                    key={item}
                    className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
