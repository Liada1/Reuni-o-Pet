"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { criarLocal, atualizarLocal, alternarAtivoLocal } from "../actions";
import type { Database } from "@/lib/supabase/types";

type Location = Database["public"]["Tables"]["locations"]["Row"];

export function LocationsManager({ inicial }: { inicial: Location[] }) {
  const [locais, setLocais] = useState(inicial);
  const [novo, setNovo] = useState({ nome: "", endereco: "" });
  const [pending, startTransition] = useTransition();

  function adicionar() {
    const nome = novo.nome.trim();
    if (!nome) return;
    startTransition(async () => {
      const criado = await criarLocal({ nome, endereco: novo.endereco || undefined });
      setLocais((prev) => [...prev, criado]);
      setNovo({ nome: "", endereco: "" });
    });
  }

  function atualizar(id: string, dados: Partial<Location>) {
    setLocais((prev) => prev.map((l) => (l.id === id ? { ...l, ...dados } : l)));
    startTransition(() => atualizarLocal(id, dados));
  }

  function alternar(id: string, ativo: boolean) {
    setLocais((prev) => prev.map((l) => (l.id === id ? { ...l, ativo } : l)));
    startTransition(() => alternarAtivoLocal(id, ativo));
  }

  return (
    <div className="space-y-3">
      {locais.length === 0 && (
        <p className="text-sm text-ink-muted">Nenhum local cadastrado ainda.</p>
      )}
      <ul className="space-y-2">
        {locais.map((local) => (
          <li
            key={local.id}
            className={cn("grid gap-2 sm:grid-cols-[1fr_1fr_auto]", !local.ativo && "opacity-50")}
          >
            <Input
              aria-label={`Nome do local "${local.nome}"`}
              value={local.nome}
              onChange={(e) => atualizar(local.id, { nome: e.target.value })}
            />
            <Input
              aria-label={`Endereço de "${local.nome}"`}
              placeholder="Endereço (opcional)"
              value={local.endereco ?? ""}
              onChange={(e) => atualizar(local.id, { endereco: e.target.value })}
            />
            <button
              type="button"
              onClick={() => alternar(local.id, !local.ativo)}
              className="whitespace-nowrap rounded-[var(--radius-control)] border border-border px-3 py-2 text-xs font-medium text-ink-muted hover:bg-paper"
            >
              {local.ativo ? "Desativar" : "Ativar"}
            </button>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 pt-1 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          aria-label="Nome do novo local"
          placeholder="Novo local"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
        />
        <Input
          aria-label="Endereço do novo local (opcional)"
          placeholder="Endereço (opcional)"
          value={novo.endereco}
          onChange={(e) => setNovo({ ...novo, endereco: e.target.value })}
        />
        <Button
          type="button"
          variant="secundario"
          aria-label="Adicionar local"
          onClick={adicionar}
          disabled={pending}
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
