import { ShoppingBag } from "lucide-react";

const Footer = () => {
  const links = {
    Produto: ["Recursos", "Integrações", "Planos", "Demonstração"],
    Empresa: ["Sobre", "Blog", "Carreiras", "Contato"],
    Suporte: ["Central de Ajuda", "Documentação", "Status", "API"],
    Legal: ["Privacidade", "Termos de Uso", "LGPD", "Cookies"],
  };

  return (
    <footer id="contato" className="border-t border-border/40 bg-gradient-hero">
      <div className="container-narrow py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 font-heading text-lg font-bold text-foreground mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <ShoppingBag className="h-4 w-4 text-primary-foreground" />
              </div>
              NexShop
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma SaaS de e-commerce white-label. Lojas profissionais personalizadas para cada nicho.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-heading font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span>© 2026 NexShop. Todos os direitos reservados.</span>
          <span>Feito com ❤️ no Brasil</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
