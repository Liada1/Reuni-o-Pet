"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotaItem } from "./nota-item";
import type { NotaLocal, TopicoLocal } from "@/lib/offline/types";
import type { NoteTipo } from "@/lib/supabase/types";

interface Membro {
  id: string;
  nome_exibicao: string;
}

interface TopicosAoVivoProps {
  topicos: TopicoLocal[];
  notas: NotaLocal[];
  membros: Membro[];
  fusoHorario: string;
  topicoAtivoId: string | null;
  onSelecionarTopico: (id: string | null) => void;
  onAdicionarTopico: (titulo: string) => void;
  onRetagNota: (
    notaId: string,
    tipo: NoteTipo,
    extra?: { responsavelId?: string | null; prazo?: string | null },
  ) => void;
}

export function TopicosAoVivo({
  topicos,
  notas,
  membros,
  fusoHorario,
  topicoAtivoId,
  onSelecionarTopico,
  onAdicionarTopico,
  onRetagNota,
}: TopicosAoVivoProps) {
  const [novoTopico, setNovoTopico] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  const blocos = [
    { id: null as string | null, titulo: "Geral" },
    ...[...topicos].sort((a, b) => a.ordem - b.ordem).map((t) => ({ id: t.id, titulo: t.titulo })),
  ];

  return (
    <div className="space-y-3">
      {blocos.map((bloco) => {
        const notasDoBloco = notas.filter((n) => n.agendaItemId === bloco.id);
        const ativo = topicoAtivoId === bloco.id;
        return (
          <div
            key={bloco.id ?? "geral"}
            className={cn(
              "rounded-[var(--radius-panel)] border p-3",
              ativo ? "border-primary bg-primary/5" : "border-border bg-surface",
            )}
          >
            <button
              type="button"
              onClick={() => onSelecionarTopico(bloco.id)}
              className="flex min-h-[44px] w-full items-center justify-between text-left"
            >
              <span className={cn("font-medium", ativo ? "text-primary" : "text-ink")}>
                {bloco.titulo}
              </span>
              {ativo && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-on-fill">
                  ANOTANDO AQUI
                </span>
              )}
            </button>
            {notasDoBloco.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {notasDoBloco.map((nota) => (
                  <NotaItem
                    key={nota.id}
                    nota={nota}
                    membros={membros}
                    fusoHorario={fusoHorario}
                    onRetag={(tipo, extra) => onRetagNota(nota.id, tipo, extra)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {adicionando ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            aria-label="Nome do tópico"
            placeholder="Nome do tópico"
            value={novoTopico}
            onChange={(e) => setNovoTopico(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && novoTopico.trim()) {
                onAdicionarTopico(novoTopico.trim());
                setNovoTopico("");
                setAdicionando(false);
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              if (!novoTopico.trim()) return;
              onAdicionarTopico(novoTopico.trim());
              setNovoTopico("");
              setAdicionando(false);
            }}
          >
            Adicionar
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secundario" onClick={() => setAdicionando(true)}>
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Novo tópico
        </Button>
      )}
    </div>
  );
}
