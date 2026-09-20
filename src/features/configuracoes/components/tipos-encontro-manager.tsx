"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  criarTipoEncontro,
  atualizarTipoEncontro,
  alternarAtivoTipoEncontro,
} from "../actions";
import type { Database } from "@/lib/supabase/types";

type TipoEncontro = Database["public"]["Tables"]["meeting_types"]["Row"];

export function TiposEncontroManager({ inicial }: { inicial: TipoEncontro[] }) {
  const [tipos, setTipos] = useState(inicial);
  const [novo, setNovo] = useState({ nome: "", cor: "#2F6B4F", duracao: 120 });
  const [pending, startTransition] = useTransition();

  function adicionar() {
    const nome = novo.nome.trim();
    if (!nome) return;
    startTransition(async () => {
      const criado = await criarTipoEncontro({
        nome,
        cor: novo.cor,
        duracao_padrao_minutos: novo.duracao,
      });
      setTipos((prev) => [...prev, criado]);
      setNovo({ nome: "", cor: "#2F6B4F", duracao: 120 });
    });
  }

  function atualizar(id: string, dados: Partial<TipoEncontro>) {
    setTipos((prev) => prev.map((t) => (t.id === id ? { ...t, ...dados } : t)));
    startTransition(() => atualizarTipoEncontro(id, dados));
  }

  function alternar(id: string, ativo: boolean) {
    setTipos((prev) => prev.map((t) => (t.id === id ? { ...t, ativo } : t)));
    startTransition(() => alternarAtivoTipoEncontro(id, ativo));
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {tipos.map((tipo) => (
          <li
            key={tipo.id}
            className={cn(
              "grid grid-cols-[auto_1fr_auto_auto] items-center gap-2",
              !tipo.ativo && "opacity-50",
            )}
          >
            <input
              type="color"
              value={tipo.cor}
              onChange={(e) => atualizar(tipo.id, { cor: e.target.value })}
              className="h-11 w-11 cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface p-1"
              aria-label={`Cor de ${tipo.nome}`}
            />
            <Input
              value={tipo.nome}
              onChange={(e) => atualizar(tipo.id, { nome: e.target.value })}
            />
            <div className="flex items-center gap-1 font-mono text-sm text-ink-muted">
              <Input
                type="number"
                min={15}
                step={15}
                value={tipo.duracao_padrao_minutos}
                onChange={(e) =>
                  atualizar(tipo.id, {
                    duracao_padrao_minutos: Number(e.target.value),
                  })
                }
                className="w-20"
              />
              <span>min</span>
            </div>
            <button
              type="button"
              onClick={() => alternar(tipo.id, !tipo.ativo)}
              className="whitespace-nowrap rounded-[var(--radius-control)] border border-border px-3 py-2 text-xs font-medium text-ink-muted hover:bg-paper"
            >
              {tipo.ativo ? "Desativar" : "Ativar"}
            </button>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 pt-1">
        <input
          type="color"
          value={novo.cor}
          onChange={(e) => setNovo({ ...novo, cor: e.target.value })}
          className="h-11 w-11 cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface p-1"
          aria-label="Cor do novo tipo"
        />
        <Input
          placeholder="Novo tipo de encontro"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
        />
        <div className="flex items-center gap-1 font-mono text-sm text-ink-muted">
          <Input
            type="number"
            min={15}
            step={15}
            value={novo.duracao}
            onChange={(e) => setNovo({ ...novo, duracao: Number(e.target.value) })}
            className="w-20"
          />
          <span>min</span>
        </div>
        <Button type="button" variant="secundario" onClick={adicionar} disabled={pending}>
          <Plus className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
