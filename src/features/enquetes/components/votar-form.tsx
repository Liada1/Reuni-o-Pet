"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { OpcaoHeader, PilhaAvatares } from "./opcao-card";
import { votar } from "../actions";
import type { EnqueteDetalhe, PollVoto } from "../types";

interface VotarFormProps {
  poll: EnqueteDetalhe;
  fusoHorario: string;
  meusVotosIniciais: Record<string, PollVoto>;
  meuId: string;
}

export function VotarForm({ poll, fusoHorario, meusVotosIniciais, meuId }: VotarFormProps) {
  const router = useRouter();
  const [meusVotos, setMeusVotos] = useState<Record<string, PollVoto | undefined>>(
    meusVotosIniciais,
  );
  const [comentario, setComentario] = useState("");
  const [pending, startTransition] = useTransition();
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternar(optionId: string, valor: PollVoto) {
    setSalvo(false);
    setMeusVotos((prev) => ({
      ...prev,
      [optionId]: prev[optionId] === valor ? undefined : valor,
    }));
  }

  function salvar() {
    const votos = Object.entries(meusVotos)
      .filter((entrada): entrada is [string, PollVoto] => !!entrada[1])
      .map(([optionId, valor]) => ({ optionId, valor }));

    setErro(null);
    startTransition(async () => {
      try {
        await votar(poll.id, votos, comentario);
        setComentario("");
        setSalvo(true);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar o voto.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {poll.poll_options.map((opcao) => {
        const votosSemEu = opcao.poll_votes.filter((v) => v.profile_id !== meuId);
        const meuVoto = meusVotos[opcao.id];
        return (
          <Surface key={opcao.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <OpcaoHeader opcao={opcao} fusoHorario={fusoHorario} />
              {poll.votos_visiveis && votosSemEu.length > 0 && (
                <PilhaAvatares votos={votosSemEu} />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alternar(opcao.id, "pode")}
                className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium ${
                  meuVoto === "pode"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-ink-muted hover:bg-paper"
                }`}
              >
                Posso
              </button>
              <button
                type="button"
                onClick={() => alternar(opcao.id, "se_precisar")}
                className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium ${
                  meuVoto === "se_precisar"
                    ? "border-accent bg-accent/20 text-ink"
                    : "border-border text-ink-muted hover:bg-paper"
                }`}
              >
                Se precisar
              </button>
            </div>
          </Surface>
        );
      })}

      <div>
        <label htmlFor="comentario" className="mb-1.5 block text-sm font-medium text-ink">
          Comentário (opcional)
        </label>
        <textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Só consigo chegar 16h20"
          rows={2}
          className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>

      {erro && <p className="text-sm text-alert">{erro}</p>}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={salvar} disabled={pending}>
          {pending ? "Salvando…" : "Salvar voto"}
        </Button>
        {salvo && <span className="text-sm text-primary">Voto salvo.</span>}
      </div>
    </div>
  );
}
