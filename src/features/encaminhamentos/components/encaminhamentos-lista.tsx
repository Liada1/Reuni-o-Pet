"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { atualizarStatusEncaminhamento } from "@/features/atas/actions";
import type { EncaminhamentoComContexto } from "@/features/atas/types";
import { formatarDataSimples } from "@/lib/dates";
import type { ActionItemStatus } from "@/lib/supabase/types";

const STATUS_TEXTO: Record<ActionItemStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export function EncaminhamentosLista({
  itens,
  meuId,
  podeEditarTudo,
}: {
  itens: EncaminhamentoComContexto[];
  meuId: string;
  podeEditarTudo: boolean;
}) {
  const [, startTransition] = useTransition();

  if (itens.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhum encaminhamento encontrado.</p>;
  }

  return (
    <ul className="space-y-2">
      {itens.map((item) => {
        const podeEditar = podeEditarTudo || item.responsavel_id === meuId;
        return (
          <Surface key={item.id} className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-ink">{item.descricao}</p>
              <Select
                aria-label={`Status de "${item.descricao}"`}
                value={item.status}
                disabled={!podeEditar}
                className="w-auto shrink-0"
                onChange={(e) =>
                  startTransition(() =>
                    atualizarStatusEncaminhamento(item.id, e.target.value as ActionItemStatus),
                  )
                }
              >
                {(Object.keys(STATUS_TEXTO) as ActionItemStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_TEXTO[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              {item.minutes && (
                <Link
                  href={`/reunioes/${item.minutes.meeting_id}/ata`}
                  className="flex items-center gap-1 underline"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.minutes.meetings?.meeting_types?.cor }}
                  />
                  {item.minutes.meetings?.titulo || item.minutes.meetings?.meeting_types?.nome}
                </Link>
              )}
              {item.profiles && <span>· {item.profiles.nome_exibicao}</span>}
              {item.prazo && <span>· prazo {formatarDataSimples(item.prazo)}</span>}
            </div>
          </Surface>
        );
      })}
    </ul>
  );
}
