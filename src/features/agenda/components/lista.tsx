import { CalendarDays } from "lucide-react";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { formatarDiaSemana, formatarData } from "@/lib/dates";
import { paraInputData } from "@/lib/dates";
import { ReuniaoLinha } from "./reuniao-linha";
import type { ReuniaoComDetalhes } from "../types";

export function Lista({
  reunioes,
  fusoHorario,
}: {
  reunioes: ReuniaoComDetalhes[];
  fusoHorario: string;
}) {
  if (reunioes.length === 0) {
    return (
      <EstadoVazio
        icone={CalendarDays}
        titulo="Nenhuma reunião neste período."
      />
    );
  }

  const porDia = new Map<string, ReuniaoComDetalhes[]>();
  for (const r of reunioes) {
    const chave = paraInputData(r.inicio, fusoHorario);
    porDia.set(chave, [...(porDia.get(chave) ?? []), r]);
  }

  return (
    <div className="space-y-4">
      {Array.from(porDia.entries()).map(([chave, doDia]) => (
        <div key={chave}>
          <p className="mb-1.5 font-mono text-xs font-medium text-ink-muted">
            {formatarDiaSemana(doDia[0].inicio, fusoHorario)}{" "}
            {formatarData(doDia[0].inicio, fusoHorario)}
          </p>
          <div className="space-y-1.5">
            {doDia.map((r) => (
              <ReuniaoLinha key={r.id} reuniao={r} fusoHorario={fusoHorario} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
