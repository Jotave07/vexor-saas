import { ShoppingBag } from "lucide-react";

const Footer = () => {
  const links = {
    Produto: ["Recursos", "Integracoes", "Planos", "Apresentacao"],
    Empresa: ["Sobre", "Blog", "Carreiras", "Contato"],
    Suporte: ["Central de Ajuda", "Documentacao", "Status", "API"],
    Legal: ["Privacidade", "Termos de Uso", "LGPD", "Cookies"],
  };

  return (
    <footer id="contato" className="border-t border-border/40 bg-gradient-hero">
      <div className="container-narrow py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <ShoppingBag className="h-4 w-4 text-primary-foreground" />
              </div>
              VEXOR Sistemas
            </a>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Solucoes para comercio digital, operacao de pedidos e gestao da sua loja em uma unica plataforma.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-4 font-heading text-sm font-semibold">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground sm:flex-row">
          <span>(c) 2026 VEXOR Sistemas. Todos os direitos reservados.</span>
          <span>Operacao digital feita no Brasil</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
