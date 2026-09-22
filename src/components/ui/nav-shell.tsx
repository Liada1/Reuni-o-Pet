"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { modulosParaPerfil } from "@/config/modules";
import type { ProfileRole } from "@/lib/supabase/types";
import { Avatar } from "@/components/ui/avatar";
import { SeletorTema } from "@/components/tema/seletor-tema";
import { cn } from "@/lib/utils";
import { sair } from "@/features/auth/actions";

interface NavShellProps {
  nomePrograma: string;
  nomeGrupo: string;
  usuario: {
    nomeExibicao: string;
    fotoUrl: string | null;
    role: ProfileRole;
  };
  children: React.ReactNode;
}

const CHAVES_PRIMARIAS_MOBILE = ["painel", "agenda", "atas"];

export function NavShell({ nomePrograma, nomeGrupo, usuario, children }: NavShellProps) {
  const pathname = usePathname();
  const itens = modulosParaPerfil(usuario.role);
  const [maisAberto, setMaisAberto] = useState(false);
  const painelMaisRef = useRef<HTMLDivElement>(null);
  const botaoMaisRef = useRef<HTMLButtonElement>(null);

  const primariosMobile = itens.filter((i) => CHAVES_PRIMARIAS_MOBILE.includes(i.chave));
  const restanteMobile = itens.filter((i) => !CHAVES_PRIMARIAS_MOBILE.includes(i.chave));

  function ativo(rota: string) {
    return rota === "/" ? pathname === "/" : pathname.startsWith(rota);
  }

  // O painel "Mais" é um diálogo modal: Esc fecha, o foco entra nele e não
  // escapa para a página atrás enquanto estiver aberto, e volta para o
  // botão que o abriu ao fechar.
  useEffect(() => {
    if (!maisAberto) return;

    const painel = painelMaisRef.current;
    // Guardado agora: na limpeza o ref já pode apontar para outro nó.
    const botaoQueAbriu = botaoMaisRef.current;
    painel?.querySelector<HTMLElement>("a, button")?.focus();

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setMaisAberto(false);
        return;
      }
      if (evento.key !== "Tab" || !painel) return;

      const focaveis = painel.querySelectorAll<HTMLElement>("a[href], button");
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      botaoQueAbriu?.focus();
    };
  }, [maisAberto]);

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <a
        href="#conteudo"
        className="sr-only rounded-[var(--radius-control)] bg-primary px-4 py-2 text-sm font-medium text-on-fill focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60]"
      >
        Pular para o conteúdo
      </a>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-surface">
        <div className="px-5 py-6">
          <p className="font-display text-lg font-semibold text-ink">{nomePrograma}</p>
          <p className="text-sm text-ink-muted">{nomeGrupo}</p>
        </div>
        <nav aria-label="Seções do sistema" className="flex-1 space-y-1 px-3">
          {itens.map((item) => (
            <Link
              key={item.chave}
              href={item.rota}
              aria-current={ativo(item.rota) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium",
                ativo(item.rota)
                  ? "bg-primary/10 text-primary"
                  : "text-ink-muted hover:bg-paper hover:text-ink",
              )}
            >
              <item.icone className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden="true" />
              {item.nome}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar nome={usuario.nomeExibicao} fotoUrl={usuario.fotoUrl} tamanho="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{usuario.nomeExibicao}</p>
            </div>
            <form action={sair}>
              <button
                type="submit"
                aria-label="Sair"
                className="rounded-[var(--radius-control)] p-2 text-ink-muted hover:bg-paper hover:text-ink"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </form>
          </div>
          <SeletorTema className="mt-3" />
        </div>
      </aside>

      {/* Topo mobile */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div>
          <p className="font-display text-base font-semibold leading-tight text-ink">
            {nomePrograma}
          </p>
          <p className="text-xs text-ink-muted">{nomeGrupo}</p>
        </div>
        <Avatar nome={usuario.nomeExibicao} fotoUrl={usuario.fotoUrl} tamanho="sm" />
      </header>

      <main id="conteudo" tabIndex={-1} className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Painel "Mais" mobile */}
      {maisAberto && (
        <div className="fixed inset-0 z-20 flex flex-col justify-end md:hidden">
          <button
            type="button"
            aria-label="Fechar"
            tabIndex={-1}
            className="flex-1 bg-ink/30"
            onClick={() => setMaisAberto(false)}
          />
          <div
            ref={painelMaisRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mais seções"
            className="space-y-1 rounded-t-[var(--radius-panel)] border-t border-border bg-surface p-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom,0px))]"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-medium text-ink">Mais</p>
              <button type="button" onClick={() => setMaisAberto(false)} aria-label="Fechar">
                <X className="h-5 w-5 text-ink-muted" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            {restanteMobile.map((item) => (
              <Link
                key={item.chave}
                href={item.rota}
                aria-current={ativo(item.rota) ? "page" : undefined}
                onClick={() => setMaisAberto(false)}
                className={cn(
                  "flex min-h-[48px] items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium",
                  ativo(item.rota) ? "bg-primary/10 text-primary" : "text-ink hover:bg-paper",
                )}
              >
                <item.icone className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                {item.nome}
              </Link>
            ))}
            <div className="flex min-h-[48px] items-center justify-between px-3">
              <span className="text-sm font-medium text-ink">Tema</span>
              <SeletorTema />
            </div>
            <form action={sair}>
              <button
                type="submit"
                className="flex min-h-[48px] w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium text-ink hover:bg-paper"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                Sair
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navegação inferior mobile */}
      <nav
        aria-label="Seções principais"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface md:hidden [padding-bottom:env(safe-area-inset-bottom,0px)]"
      >
        {primariosMobile.map((item) => (
          <Link
            key={item.chave}
            href={item.rota}
            aria-current={ativo(item.rota) ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
              ativo(item.rota) ? "text-primary" : "text-ink-muted",
            )}
          >
            <item.icone className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            {item.nome}
          </Link>
        ))}
        {restanteMobile.length > 0 && (
          <button
            ref={botaoMaisRef}
            type="button"
            aria-expanded={maisAberto}
            aria-haspopup="dialog"
            onClick={() => setMaisAberto(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
              maisAberto ? "text-primary" : "text-ink-muted",
            )}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            Mais
          </button>
        )}
      </nav>
    </div>
  );
}
