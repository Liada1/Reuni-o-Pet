"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatarDataSimples } from "@/lib/dates";
import { atualizarStatusEncaminhamento, editarEncaminhamento } from "../actions";
import type { ActionItemComResponsavel } from "../types";
import type { ActionItemStatus } from "@/lib/supabase/types";

const STATUS_TEXTO: Record<ActionItemStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

interface Membro {
  id: string;
  nome_exibicao: string;
}

export function EncaminhamentosTabela({
  itens,
  meetingId,
  membros,
  podeEditarTudo,
  meuId,
}: {
  itens: ActionItemComResponsavel[];
  meetingId: string;
  membros: Membro[];
  podeEditarTudo: boolean;
  meuId: string;
}) {
  const [, startTransition] = useTransition();

  if (itens.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhum encaminhamento nesta reunião.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="py-2 pr-3">O quê</th>
            <th className="py-2 pr-3">Responsável</th>
            <th className="py-2 pr-3">Prazo</th>
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => {
            const podeStatus = podeEditarTudo || item.responsavel_id === meuId;
            return (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-3">
                  {podeEditarTudo ? (
                    <Input
                      defaultValue={item.descricao}
                      onBlur={(e) =>
                        e.target.value !== item.descricao &&
                        startTransition(() =>
                          editarEncaminhamento(item.id, meetingId, { descricao: e.target.value }),
                        )
                      }
                    />
                  ) : (
                    item.descricao
                  )}
                </td>
                <td className="py-2 pr-3">
                  {podeEditarTudo ? (
                    <Select
                      value={item.responsavel_id ?? ""}
                      onChange={(e) =>
                        startTransition(() =>
                          editarEncaminhamento(item.id, meetingId, {
                            responsavelId: e.target.value || null,
                          }),
                        )
                      }
                    >
                      <option value="">Sem responsável</option>
                      {membros.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome_exibicao}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    item.profiles?.nome_exibicao ?? "—"
                  )}
                </td>
                <td className="py-2 pr-3">
                  {podeEditarTudo ? (
                    <Input
                      type="date"
                      defaultValue={item.prazo ?? ""}
                      onBlur={(e) =>
                        e.target.value !== item.prazo &&
                        startTransition(() =>
                          editarEncaminhamento(item.id, meetingId, {
                            prazo: e.target.value || null,
                          }),
                        )
                      }
                    />
                  ) : (
                    item.prazo ? formatarDataSimples(item.prazo) : "—"
                  )}
                </td>
                <td className="py-2 pr-3">
                  <Select
                    value={item.status}
                    disabled={!podeStatus}
                    className={cn(!podeStatus && "opacity-60")}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
