"use client";

import { useState, useTransition } from "react";
import { Plus, Check, X, ListRestart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  sugerirTopico,
  criarTopicoPauta,
  criarTopicoRetomada,
  aceitarTopico,
  removerTopico,
} from "../actions";
import type { AgendaItem, ActionItemComResponsavel } from "../types";

interface PautaProps {
  meetingId: string;
  itens: AgendaItem[];
  podeEditar: boolean;
  meuId: string;
  encaminhamentosParaRetomar: ActionItemComResponsavel[];
}

export function Pauta({ meetingId, itens, podeEditar, meuId, encaminhamentosParaRetomar }: PautaProps) {
  const [novoTitulo, setNovoTitulo] = useState("");
  const [pending, startTransition] = useTransition();

  const aceitos = itens.filter((i) => i.aceito).sort((a, b) => a.ordem - b.ordem);
  const sugeridos = itens.filter((i) => !i.aceito);
  const jaTemRetomada = itens.some((i) => i.titulo.startsWith("Retomada dos encaminhamentos"));

  function enviar() {
    const titulo = novoTitulo.trim();
    if (!titulo) return;
    startTransition(async () => {
      if (podeEditar) await criarTopicoPauta(meetingId, titulo);
      else await sugerirTopico(meetingId, titulo);
      setNovoTitulo("");
    });
  }

  return (
    <div className="space-y-3">
      {aceitos.length === 0 && sugeridos.length === 0 && (
        <p className="text-sm text-ink-muted">Nenhum tópico na pauta ainda.</p>
      )}

      {aceitos.length > 0 && (
        <ul className="space-y-1.5">
          {aceitos.map((item) => (
            <li key={item.id}>
              <Surface className="flex items-center justify-between gap-2 p-2.5">
                <span className="whitespace-pre-line text-sm text-ink">{item.titulo}</span>
                {podeEditar && (
                  <button
                    type="button"
                    onClick={() => startTransition(() => removerTopico(item.id, meetingId))}
                    className="shrink-0 p-1 text-ink-muted hover:text-alert"
                    aria-label="Remover tópico"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </Surface>
            </li>
          ))}
        </ul>
      )}

      {sugeridos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-muted">Sugestões aguardando aceite</p>
          {sugeridos.map((item) => (
            <Surface key={item.id} className="flex items-center justify-between gap-2 border-dashed p-2.5">
              <span className="text-sm text-ink-muted">{item.titulo}</span>
              {(podeEditar || item.sugerido_por === meuId) && (
                <div className="flex shrink-0 gap-1">
                  {podeEditar && (
                    <button
                      type="button"
                      onClick={() => startTransition(() => aceitarTopico(item.id, meetingId))}
                      className="p-1 text-primary hover:opacity-70"
                      aria-label="Aceitar tópico"
                    >
                      <Check className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => startTransition(() => removerTopico(item.id, meetingId))}
                    className="p-1 text-ink-muted hover:text-alert"
                    aria-label="Recusar/remover tópico"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </Surface>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          aria-label={podeEditar ? "Novo tópico da pauta" : "Sugerir tópico para a pauta"}
          placeholder={podeEditar ? "Novo tópico" : "Sugerir tópico"}
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
        />
        <Button
          type="button"
          variant="secundario"
          aria-label={podeEditar ? "Adicionar tópico" : "Sugerir tópico"}
          onClick={enviar}
          disabled={pending}
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>

      {podeEditar && !jaTemRetomada && encaminhamentosParaRetomar.length > 0 && (
        <Button
          type="button"
          variant="fantasma"
          disabled={pending}
          onClick={() =>
            startTransition(() =>
              criarTopicoRetomada(
                meetingId,
                encaminhamentosParaRetomar.map((e) => ({
                  descricao: e.descricao,
                  responsavel: e.profiles?.nome_exibicao ?? null,
                  prazo: e.prazo,
                })),
              ),
            )
          }
        >
          <ListRestart className="h-4 w-4" strokeWidth={1.75} />
          Adicionar retomada dos encaminhamentos ({encaminhamentosParaRetomar.length})
        </Button>
      )}
    </div>
  );
}
