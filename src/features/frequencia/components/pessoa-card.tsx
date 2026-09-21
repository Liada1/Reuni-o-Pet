import { Surface } from "@/components/ui/surface";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatarMinutos } from "@/lib/duracao";
import type { FrequenciaPessoa } from "../types";

function curto(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export function PessoaCard({
  pessoa,
  totalEncontros,
  metaHoras,
  destacada,
}: {
  pessoa: FrequenciaPessoa;
  totalEncontros: number;
  metaHoras: number;
  destacada: boolean;
}) {
  return (
    <Surface className={cn("space-y-3 p-4", destacada && "border-accent/50")}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Avatar nome={pessoa.nome} tamanho="sm" />
          <div>
            <p className="text-sm font-medium text-ink">{pessoa.nome}</p>
            {destacada && <p className="text-xs text-accent">você</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Horas</p>
            <p className="font-mono text-sm text-ink">{formatarMinutos(pessoa.minutos)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Frequência</p>
            <p
              className={cn(
                "font-mono text-sm",
                pessoa.percentual >= 75 ? "text-primary" : "text-alert",
              )}
            >
              {pessoa.percentual}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span>
          <span className="font-mono text-ink">{pessoa.presentes}</span> de{" "}
          <span className="font-mono">{totalEncontros}</span> presenças
        </span>
        {pessoa.justificadas > 0 && (
          <span>
            <span className="font-mono text-accent">{pessoa.justificadas}</span> justificada
            {pessoa.justificadas === 1 ? "" : "s"}
          </span>
        )}
        {pessoa.ausentes > 0 && (
          <span>
            <span className="font-mono text-alert">{pessoa.ausentes}</span>{" "}
            {pessoa.ausentes === 1 ? "falta" : "faltas"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pessoa.semanas.map((semana) => (
          <span
            key={semana.inicioISO}
            title={`${curto(semana.inicioISO)} – ${curto(semana.fimISO)}: ${
              semana.encontros
            } encontro(s), ${formatarMinutos(semana.minutos)} (meta ${metaHoras}h)`}
            className={cn(
              "rounded-[var(--radius-control)] border px-2 py-1 font-mono text-xs",
              semana.cumpreHoras && semana.cumpreEncontros
                ? "border-primary/40 text-primary"
                : semana.minutos > 0
                  ? "border-accent/40 text-accent"
                  : "border-border text-ink-muted",
            )}
          >
            {curto(semana.inicioISO)} · {formatarMinutos(semana.minutos)}
          </span>
        ))}
      </div>
    </Surface>
  );
}
