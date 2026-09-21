import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { formatarMinutos } from "@/lib/duracao";
import { formatarHora, formatarDataCurta } from "@/lib/dates";
import type { SemanaPlanejada } from "../types";

function curto(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

function Medidor({
  rotulo,
  valor,
  meta,
  cumpre,
}: {
  rotulo: string;
  valor: string;
  meta: string;
  cumpre: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-wide text-ink-muted">{rotulo}</span>
      <span className={cn("font-mono text-sm", cumpre ? "text-primary" : "text-alert")}>
        {valor}
      </span>
      <span className="font-mono text-xs text-ink-muted">/ {meta}</span>
    </div>
  );
}

export function SemanaLinha({
  semana,
  metaEncontros,
  metaHoras,
  fusoHorario,
}: {
  semana: SemanaPlanejada;
  metaEncontros: number;
  metaHoras: number;
  fusoHorario: string;
}) {
  const cumpreTudo = semana.cumpreEncontros && semana.cumpreHoras;

  return (
    <Surface
      className={cn(
        "space-y-3 p-4",
        semana.contemHoje && "border-accent/50",
        !cumpreTudo && semana.encerrada && "border-alert/40",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">
            {curto(semana.inicioISO)} – {curto(semana.fimISO)}
          </p>
          {semana.contemHoje && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
              semana atual
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Medidor
            rotulo="encontros"
            valor={String(semana.encontros.length)}
            meta={String(metaEncontros)}
            cumpre={semana.cumpreEncontros}
          />
          <Medidor
            rotulo="horas"
            valor={formatarMinutos(semana.minutos)}
            meta={`${metaHoras}h`}
            cumpre={semana.cumpreHoras}
          />
        </div>
      </div>

      {semana.encontros.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhum encontro nesta semana.</p>
      ) : (
        <ul className="space-y-1">
          {semana.encontros.map((e) => (
            <li key={e.id}>
              <Link
                href={`/reunioes/${e.id}`}
                className="flex items-center gap-2 text-sm text-ink hover:underline"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: e.meeting_types?.cor }}
                />
                <span className="font-mono text-xs text-ink-muted">
                  {formatarDataCurta(e.inicio, fusoHorario)}{" "}
                  {formatarHora(e.inicio, fusoHorario)}
                </span>
                {e.titulo || e.meeting_types?.nome}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!cumpreTudo && (
        <p className="text-xs text-alert">
          {semana.encerrada ? "Semana fechou abaixo da meta." : "Ainda abaixo da meta."}
        </p>
      )}
    </Surface>
  );
}
