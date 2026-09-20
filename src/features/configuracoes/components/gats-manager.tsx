"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { criarGat, renomearGat, alternarAtivoGat } from "../actions";
import type { Database } from "@/lib/supabase/types";

type Gat = Database["public"]["Tables"]["gats"]["Row"];

export function GatsManager({ inicial }: { inicial: Gat[] }) {
  const [gats, setGats] = useState(inicial);
  const [novoNome, setNovoNome] = useState("");
  const [pending, startTransition] = useTransition();

  function adicionar() {
    const nome = novoNome.trim();
    if (!nome) return;
    startTransition(async () => {
      const criado = await criarGat(nome);
      setGats((prev) => [...prev, criado]);
      setNovoNome("");
    });
  }

  function renomear(id: string, nome: string) {
    setGats((prev) => prev.map((g) => (g.id === id ? { ...g, nome } : g)));
    startTransition(() => renomearGat(id, nome));
  }

  function alternar(id: string, ativo: boolean) {
    setGats((prev) => prev.map((g) => (g.id === id ? { ...g, ativo } : g)));
    startTransition(() => alternarAtivoGat(id, ativo));
  }

  return (
    <div className="space-y-3">
      {gats.length === 0 && (
        <p className="text-sm text-ink-muted">Nenhum GAT cadastrado ainda.</p>
      )}
      <ul className="space-y-2">
        {gats.map((gat) => (
          <li key={gat.id} className="flex items-center gap-2">
            <Input
              value={gat.nome}
              onChange={(e) => renomear(gat.id, e.target.value)}
              className={cn(!gat.ativo && "opacity-50")}
            />
            <button
              type="button"
              onClick={() => alternar(gat.id, !gat.ativo)}
              className="whitespace-nowrap rounded-[var(--radius-control)] border border-border px-3 py-2 text-xs font-medium text-ink-muted hover:bg-paper"
            >
              {gat.ativo ? "Desativar" : "Ativar"}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 pt-1">
        <Input
          placeholder="Novo GAT"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
        />
        <Button type="button" variant="secundario" onClick={adicionar} disabled={pending}>
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
