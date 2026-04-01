import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Recursos", href: "#recursos" },
  { label: "Nichos", href: "#nichos" },
  { label: "Integracoes", href: "#integracoes" },
  { label: "Planos", href: "#planos" },
  { label: "Contato", href: "#contato" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container-narrow flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <ShoppingBag className="h-4 w-4 text-primary-foreground" />
          </div>
          VEXOR Sistemas
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link to="/login">Login</Link>
          </Button>
          <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            Solicitar Apresentacao
          </Button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/40 bg-background md:hidden"
          >
            <div className="container-narrow flex flex-col gap-4 py-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Button className="mt-2 w-full bg-gradient-primary text-primary-foreground">
                Solicitar Apresentacao
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
