import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroMockup from "@/assets/hero-mockup.jpg";

const HeroSection = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-hero pt-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(217 91% 60% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 60% / 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-narrow relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="text-xs font-medium text-primary">Tecnologia comercial da VEXOR Sistemas</span>
            </div>

            <h1 className="mb-6 font-heading text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Sua operacao digital com a <span className="text-gradient-primary">marca VEXOR Sistemas</span>, pronta
              para vender.
            </h1>

            <p className="mb-8 max-w-lg text-lg text-muted-foreground">
              Estruture catalogo, pedidos, clientes e administracao comercial em uma loja profissional preparada para
              crescer.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="animate-pulse-glow bg-gradient-primary px-8 text-base text-primary-foreground hover:opacity-90"
              >
                Conhecer a Plataforma
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-border/60 text-base text-foreground hover:bg-secondary">
                <Play className="mr-2 h-4 w-4" />
                Ver apresentacao
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">500+</span>
                <span>
                  Lojas
                  <br />
                  ativas
                </span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">R$12M+</span>
                <span>
                  Em vendas
                  <br />
                  processadas
                </span>
              </div>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div className="hidden items-center gap-2 sm:flex">
                <span className="font-heading text-2xl font-bold text-foreground">99.9%</span>
                <span>
                  Uptime
                  <br />
                  garantido
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/30 shadow-glow">
              <img src={heroMockup} alt="Dashboard VEXOR Sistemas" className="h-auto w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="glass-card absolute -bottom-4 -left-4 rounded-xl p-4 shadow-elevated"
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
