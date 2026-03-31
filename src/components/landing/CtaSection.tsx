import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  return (
    <section className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden bg-gradient-primary p-10 md:p-16 text-center"
        >
          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Oferta por tempo limitado</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-primary-foreground">
              Lance sua loja virtual profissional ainda esta semana
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Receba uma loja pronta, integrada e preparada para converter. 
              Venda online com um site premium, completo e adaptado ao seu mercado.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base px-8"
              >
                Quero Minha Loja Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base"
              >
                Agendar Demonstração
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
