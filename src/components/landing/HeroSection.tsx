import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroMockup from "@/assets/hero-mockup.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-hero pt-16">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(217 91% 60% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 60% / 0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-narrow relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-primary">Plataforma #1 em e-commerce white-label</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Seu e-commerce profissional,{" "}
              <span className="text-gradient-primary">personalizado para o seu nicho</span>
              , pronto para vender.
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Receba uma loja virtual completa, com pagamentos, frete e estrutura integrada. 
              Lance sua operação em dias, não meses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 animate-pulse-glow text-base px-8"
              >
                Criar Minha Loja
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border/60 text-foreground hover:bg-secondary text-base"
              >
                <Play className="mr-2 h-4 w-4" />
                Ver Demonstração
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">500+</span>
                <span>Lojas<br/>ativas</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">R$12M+</span>
                <span>Em vendas<br/>processadas</span>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">99.9%</span>
                <span>Uptime<br/>garantido</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-glow border border-border/30">
              <img
                src={heroMockup}
                alt="Dashboard NexShop - Plataforma de e-commerce profissional"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 glass-card rounded-xl p-4 shadow-elevated"
            >
              <div className="text-xs text-muted-foreground">Vendas Hoje</div>
              <div className="font-heading text-xl font-bold text-accent">+R$ 4.280</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
