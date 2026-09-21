"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { modulosParaPerfil } from "@/config/modules";
import type { ProfileRole } from "@/lib/supabase/types";
import { Avatar } from "@/components/ui/avatar";
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

  const primariosMobile = itens.filter((i) => CHAVES_PRIMARIAS_MOBILE.includes(i.chave));
  const restanteMobile = itens.filter((i) => !CHAVES_PRIMARIAS_MOBILE.includes(i.chave));

  function ativo(rota: string) {
    return rota === "/" ? pathname === "/" : pathname.startsWith(rota);
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-surface">
        <div className="px-5 py-6">
          <p className="font-display text-lg font-semibold text-ink">{nomePrograma}</p>
          <p className="text-sm text-ink-muted">{nomeGrupo}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {itens.map((item) => (
            <Link
              key={item.chave}
              href={item.rota}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium",
                ativo(item.rota)
                  ? "bg-primary/10 text-primary"
                  : "text-ink-muted hover:bg-paper hover:text-ink",
              )}
            >
              <item.icone className="h-4.5 w-4.5" strokeWidth={1.75} />
              {item.nome}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
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
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
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

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Painel "Mais" mobile */}
      {maisAberto && (
        <div className="fixed inset-0 z-20 flex flex-col justify-end md:hidden">
          <button
            type="button"
            aria-label="Fechar"
            className="flex-1 bg-ink/30"
            onClick={() => setMaisAberto(false)}
          />
          <div className="space-y-1 rounded-t-[var(--radius-panel)] border-t border-border bg-surface p-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-medium text-ink">Mais</p>
              <button type="button" onClick={() => setMaisAberto(false)} aria-label="Fechar">
                <X className="h-5 w-5 text-ink-muted" strokeWidth={1.75} />
              </button>
            </div>
            {restanteMobile.map((item) => (
              <Link
                key={item.chave}
                href={item.rota}
                onClick={() => setMaisAberto(false)}
                className={cn(
                  "flex min-h-[48px] items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium",
                  ativo(item.rota) ? "bg-primary/10 text-primary" : "text-ink hover:bg-paper",
                )}
              >
                <item.icone className="h-5 w-5" strokeWidth={1.75} />
                {item.nome}
              </Link>
            ))}
            <form action={sair}>
              <button
                type="submit"
                className="flex min-h-[48px] w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium text-ink hover:bg-paper"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.75} />
                Sair
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navegação inferior mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface md:hidden [padding-bottom:env(safe-area-inset-bottom,0px)]">
        {primariosMobile.map((item) => (
          <Link
            key={item.chave}
            href={item.rota}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
              ativo(item.rota) ? "text-primary" : "text-ink-muted",
            )}
          >
            <item.icone className="h-5 w-5" strokeWidth={1.75} />
            {item.nome}
          </Link>
        ))}
        {restanteMobile.length > 0 && (
          <button
            type="button"
            onClick={() => setMaisAberto(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
              maisAberto ? "text-primary" : "text-ink-muted",
            )}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
            Mais
          </button>
        )}
      </nav>
    </div>
  );
}
