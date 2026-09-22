"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTema } from "./provedor-tema";
import { cn } from "@/lib/utils";
import type { Tema } from "@/lib/tema";

const OPCOES: { valor: Tema; rotulo: string; icone: typeof Sun }[] = [
  { valor: "claro", rotulo: "Claro", icone: Sun },
  { valor: "escuro", rotulo: "Escuro", icone: Moon },
  { valor: "sistema", rotulo: "Sistema", icone: Monitor },
];

/**
 * Três estados em vez de um interruptor: sem "Sistema" explícito, quem
 * troca uma vez perde a preferência do aparelho para sempre.
 */
export function SeletorTema({ className }: { className?: string }) {
  const { tema, definirTema } = useTema();

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className={cn(
        "inline-flex gap-0.5 rounded-[var(--radius-control)] border border-border p-0.5",
        className,
      )}
    >
      {OPCOES.map(({ valor, rotulo, icone: Icone }) => {
        const ativo = tema === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            title={rotulo}
            onClick={() => definirTema(valor)}
            className={cn(
              "rounded-[calc(var(--radius-control)-2px)] p-1.5 transition-colors",
              ativo
                ? "bg-primary/12 text-primary"
                : "text-ink-muted hover:bg-paper hover:text-ink",
            )}
          >
            <Icone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">{rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
